import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import {
  otpMatches,
  generateResetToken,
  hashResetToken,
  resetTokenMatches,
} from "@/lib/email/crypto";
import { renderTemplate } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transporter";
import {
  AuthPurpose,
  AuthEvent,
  AuthTemplateKey,
  AccountStatus,
  AUTH_MESSAGES,
  AUTH_CONSTANTS,
  AUTH_PATTERNS,
  isUuid,
  cleanEmail as sanitizeEmail,
  evaluatePasswordCriteria,
  getErrorMessage,
} from "@/constants/auth";

export const dynamic = "force-dynamic";

interface VerifyOtpRequestBody {
  email?: string;
  userId?: string;
  purpose?: string;
  code?: string;
  resetToken?: string;
  name?: string;
  newPassword?: string;
}

interface OtpRecord {
  id: string;
  user_id: string;
  email: string;
  purpose: string;
  code_hash: string;
  reset_token_hash?: string | null;
  reset_token_expires_at?: string | null;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  created_at: string;
  consumed_at: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyOtpRequestBody = await request.json();
    const { email, userId, purpose, code, resetToken, name, newPassword } = body;

    const cleanEmail = sanitizeEmail(email);
    const validPurpose =
      purpose === AuthPurpose.PASSWORD_RESET
        ? AuthPurpose.PASSWORD_RESET
        : AuthPurpose.EMAIL_VERIFY;

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || null;
    const userAgent = request.headers.get("user-agent") || null;
    const supabase = getServiceSupabase();

    // =========================================================================
    // FLOW A: Password Reset Step 2 (Reset Token + New Password)
    // =========================================================================
    if (validPurpose === AuthPurpose.PASSWORD_RESET && resetToken && newPassword) {
      const cleanToken = String(resetToken).trim();

      // 1. Validate Password Criteria
      const pwdVal = evaluatePasswordCriteria(newPassword);
      if (!pwdVal.isValid) {
        return NextResponse.json(
          { error: AUTH_MESSAGES.PASSWORD_CRITERIA },
          { status: 400 }
        );
      }

      // 2. Locate active OTP record with valid reset_token_hash
      const { data: records, error: tokenFetchErr } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("email", cleanEmail)
        .eq("purpose", AuthPurpose.PASSWORD_RESET)
        .not("reset_token_hash", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (tokenFetchErr) {
        throw new Error(`Database error: ${tokenFetchErr.message}`);
      }

      const activeResetDoc = (records as OtpRecord[] | null)?.[0];
      if (
        !activeResetDoc?.reset_token_hash ||
        !activeResetDoc.reset_token_expires_at ||
        new Date(activeResetDoc.reset_token_expires_at).getTime() < Date.now()
      ) {
        return NextResponse.json(
          { error: AUTH_MESSAGES.RESET_TOKEN_INVALID_OR_EXPIRED },
          { status: 400 }
        );
      }

      // 3. Constant-time comparison of reset token
      const isTokenValid = resetTokenMatches(activeResetDoc.reset_token_hash, cleanToken);
      if (!isTokenValid) {
        return NextResponse.json(
          { error: AUTH_MESSAGES.RESET_TOKEN_INVALID_OR_EXPIRED },
          { status: 400 }
        );
      }

      // 4. Invalidate the reset token immediately (single-use)
      await supabase
        .from("otp_codes")
        .update({
          reset_token_expires_at: new Date(0).toISOString(),
          reset_token_hash: null,
        })
        .eq("id", activeResetDoc.id);

      // 5. Resolve target User ID
      let targetUserId = isUuid(activeResetDoc.user_id) ? activeResetDoc.user_id : "";
      if (!targetUserId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", cleanEmail)
          .maybeSingle();
        if (profile?.id && isUuid(profile.id)) {
          targetUserId = profile.id;
        } else {
          const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const users = (userList?.users || []) as Array<{ id: string; email?: string }>;
          const matched = users.find(
            (u) => (u.email || "").trim().toLowerCase() === cleanEmail.toLowerCase()
          );
          if (matched?.id && isUuid(matched.id)) {
            targetUserId = matched.id;
          }
        }
      }

      if (!targetUserId || !isUuid(targetUserId)) {
        return NextResponse.json(
          { error: AUTH_MESSAGES.USER_NOT_FOUND },
          { status: 404 }
        );
      }

      // 6. Update user password in Supabase Auth
      const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(targetUserId, {
        password: String(newPassword),
        email_confirm: true,
      });

      if (authUpdateErr) {
        return NextResponse.json(
          { error: authUpdateErr.message || AUTH_MESSAGES.PASSWORD_UPDATE_FAILED },
          { status: 400 }
        );
      }

      // 7. Update profile timestamp & audit log
      const nowIso = new Date().toISOString();
      await supabase.from("profiles").update({ updated_at: nowIso }).eq("id", targetUserId);

      try {
        await supabase.from("auth_audit_logs").insert({
          user_id: targetUserId,
          email: cleanEmail,
          event: AuthEvent.PASSWORD_RESET_COMPLETED,
          ip: clientIp,
          user_agent: userAgent,
          metadata: { method: "reset_token" },
        });
      } catch (auditErr: unknown) {
        console.warn("[Audit Log Notice]:", getErrorMessage(auditErr));
      }

      return NextResponse.json({
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
      });
    }

    // =========================================================================
    // FLOW B: 6-Digit OTP Code Verification (Email Verify or Password Reset Step 1)
    // =========================================================================
    if (!code || (!userId && !cleanEmail)) {
      return NextResponse.json(
        { error: "Missing required fields: code and email." },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim();
    if (cleanCode.length !== AUTH_CONSTANTS.OTP_LENGTH || !AUTH_PATTERNS.NUMERIC_ONLY.test(cleanCode)) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.OTP_INCOMPLETE_CODE },
        { status: 400 }
      );
    }

    // 1. Fetch the latest active (unconsumed) OTP code
    const { data: rawRecords, error: fetchErr } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", cleanEmail)
      .eq("purpose", validPurpose)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchErr) {
      throw new Error(`Database error: ${fetchErr.message}`);
    }

    const activeOtpDoc = (rawRecords as OtpRecord[] | null)?.[0];

    if (!activeOtpDoc) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.OTP_EXPIRED_OR_NOT_FOUND },
        { status: 400 }
      );
    }

    // 2. Check if maximum attempts exceeded
    if (activeOtpDoc.attempts >= activeOtpDoc.max_attempts) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.OTP_TOO_MANY_ATTEMPTS },
        { status: 400 }
      );
    }

    // 3. Check expiration
    if (new Date(activeOtpDoc.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.OTP_CODE_EXPIRED },
        { status: 400 }
      );
    }

    // 4. Constant-time HMAC comparison
    let isMatch = otpMatches(
      activeOtpDoc.code_hash,
      cleanCode,
      cleanEmail,
      validPurpose
    );
    if (!isMatch && activeOtpDoc.user_id) {
      isMatch = otpMatches(
        activeOtpDoc.code_hash,
        cleanCode,
        activeOtpDoc.user_id,
        validPurpose
      );
    }

    if (!isMatch) {
      const newAttempts = (activeOtpDoc.attempts || 0) + 1;
      await supabase
        .from("otp_codes")
        .update({ attempts: newAttempts })
        .eq("id", activeOtpDoc.id);

      const remaining = Math.max(0, activeOtpDoc.max_attempts - newAttempts);
      return NextResponse.json(
        {
          error: `${AUTH_MESSAGES.OTP_INVALID_CODE} ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
          remainingAttempts: remaining,
        },
        { status: 400 }
      );
    }

    // CODE IS VALID: Immediately mark OTP as consumed in PostgreSQL
    const nowIso = new Date().toISOString();
    await supabase
      .from("otp_codes")
      .update({ consumed_at: nowIso })
      .eq("id", activeOtpDoc.id);

    // 5. If this is Step 1 of Password Reset (no newPassword provided)
    if (validPurpose === AuthPurpose.PASSWORD_RESET && !newPassword) {
      const resetToken = generateResetToken();
      const resetTokenHash = hashResetToken(resetToken);
      const resetExpiresAt = new Date(
        Date.now() + AUTH_CONSTANTS.RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000
      ).toISOString();

      await supabase
        .from("otp_codes")
        .update({
          reset_token_hash: resetTokenHash,
          reset_token_expires_at: resetExpiresAt,
        })
        .eq("id", activeOtpDoc.id);

      try {
        await supabase.from("auth_audit_logs").insert({
          user_id: activeOtpDoc.user_id || null,
          email: cleanEmail,
          event: AuthEvent.RESET_TOKEN_ISSUED,
          ip: clientIp,
          user_agent: userAgent,
          metadata: { expiresInMinutes: AUTH_CONSTANTS.RESET_TOKEN_EXPIRATION_MINUTES },
        });
      } catch (auditErr: unknown) {
        console.warn("[Audit Log Notice]:", getErrorMessage(auditErr));
      }

      return NextResponse.json({
        success: true,
        verified: true,
        resetToken,
        message: "Code verified successfully! You may now create your new password.",
      });
    }

    // 6. Resolve target User ID for user update
    let targetUserId = isUuid(activeOtpDoc.user_id) ? activeOtpDoc.user_id : "";
    if (!targetUserId && cleanEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (profile?.id && isUuid(profile.id)) {
        targetUserId = profile.id;
      } else {
        const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const users = (userList?.users || []) as Array<{ id: string; email?: string }>;
        const matched = users.find(
          (u) => (u.email || "").toLowerCase() === cleanEmail.toLowerCase()
        );
        if (matched?.id && isUuid(matched.id)) {
          targetUserId = matched.id;
        }
      }
    }

    // 7. Handle Legacy Single-Step Password Reset (if newPassword sent with code)
    if (validPurpose === AuthPurpose.PASSWORD_RESET && newPassword) {
      if (!targetUserId || !isUuid(targetUserId)) {
        return NextResponse.json(
          { error: AUTH_MESSAGES.USER_NOT_FOUND },
          { status: 404 }
        );
      }

      const pwdVal = evaluatePasswordCriteria(newPassword);
      if (!pwdVal.isValid) {
        return NextResponse.json(
          { error: AUTH_MESSAGES.PASSWORD_CRITERIA },
          { status: 400 }
        );
      }

      const { error: authErr } = await supabase.auth.admin.updateUserById(targetUserId, {
        password: String(newPassword),
        email_confirm: true,
      });

      if (authErr) {
        return NextResponse.json(
          { error: authErr.message || AUTH_MESSAGES.PASSWORD_UPDATE_FAILED },
          { status: 400 }
        );
      }

      await supabase.from("profiles").update({ updated_at: nowIso }).eq("id", targetUserId);

      return NextResponse.json({
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
      });
    }

    // 8. Handle Email Verification
    if (validPurpose === AuthPurpose.EMAIL_VERIFY) {
      if (!targetUserId || !isUuid(targetUserId)) {
        return NextResponse.json(
          { error: AUTH_MESSAGES.USER_NOT_FOUND },
          { status: 404 }
        );
      }

      const { error: confirmErr } = await supabase.auth.admin.updateUserById(targetUserId, {
        email_confirm: true,
      });

      if (confirmErr) {
        throw new Error(`Failed to activate account: ${confirmErr.message}`);
      }

      await supabase.from("profiles").update({ updated_at: nowIso }).eq("id", targetUserId);

      // Send branded Welcome Email
      try {
        const { subject, html, text } = await renderTemplate({
          template: AuthTemplateKey.WELCOME,
          data: { name },
        });
        await sendEmail({
          to: cleanEmail || activeOtpDoc.email,
          subject,
          html,
          text,
        });
      } catch (welcomeErr: unknown) {
        console.warn("[Welcome Email Send Notice]:", getErrorMessage(welcomeErr));
      }

      try {
        await supabase.from("auth_audit_logs").insert({
          user_id: targetUserId,
          email: cleanEmail,
          event: AuthEvent.OTP_VERIFIED,
          metadata: { purpose: AuthPurpose.EMAIL_VERIFY },
        });
      } catch (auditErr: unknown) {
        console.warn("[Audit Log Notice]:", getErrorMessage(auditErr));
      }
    }

    // 9. Generate instant authentication session token for direct login
    let sessionTokenHash: string | undefined = undefined;
    let verificationType = "magiclink";
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: cleanEmail || activeOtpDoc.email,
      });
      sessionTokenHash = linkData?.properties?.hashed_token;
      if (linkData?.properties?.verification_type) {
        verificationType = linkData.properties.verification_type;
      }
    } catch (linkErr: unknown) {
      console.warn("[Session Link Generation Notice]:", getErrorMessage(linkErr));
    }

    return NextResponse.json({
      success: true,
      message: "Email successfully verified! Your account is now active.",
      status: AccountStatus.ACTIVE,
      sessionTokenHash,
      verificationType,
    });
  } catch (error: unknown) {
    console.error("[Verify OTP Error]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, AUTH_MESSAGES.UNEXPECTED_ERROR) },
      { status: 500 }
    );
  }
}
