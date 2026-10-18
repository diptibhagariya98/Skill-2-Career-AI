import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { otpMatches } from "@/lib/email/crypto";
import { renderTemplate } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transporter";
import {
  AuthPurpose,
  AccountStatus,
  AUTH_MESSAGES,
  AUTH_CONSTANTS,
  isUuid,
  cleanEmail as sanitizeEmail,
  getErrorMessage,
} from "@/constants/auth";

export const dynamic = "force-dynamic";

interface VerifyOtpRequestBody {
  email?: string;
  userId?: string;
  purpose?: string;
  code?: string;
  name?: string;
  newPassword?: string;
}

interface OtpRecord {
  id: string;
  user_id: string;
  email: string;
  purpose: string;
  code_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  created_at: string;
  consumed_at: string | null;
}

interface AdminUserRecord {
  id: string;
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyOtpRequestBody = await request.json();
    const { email, userId, purpose, code, name, newPassword } = body;

    if (!code || (!userId && !email)) {
      return NextResponse.json(
        { error: "Missing required fields: code and email/userId." },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim();
    const cleanEmail = sanitizeEmail(email);
    let cleanUserId = userId ? String(userId).trim() : cleanEmail;
    const validPurpose =
      purpose === AuthPurpose.PASSWORD_RESET
        ? AuthPurpose.PASSWORD_RESET
        : AuthPurpose.EMAIL_VERIFY;

    const supabase = getServiceSupabase();

    // Look up Supabase Auth User ID if not provided as a valid UUID
    if (!isUuid(cleanUserId)) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", cleanEmail)
          .maybeSingle();

        if (profile?.id && isUuid(profile.id)) {
          cleanUserId = profile.id;
        } else {
          const { data: userList } = await supabase.auth.admin.listUsers({
            perPage: AUTH_CONSTANTS.MAX_USERS_SEARCH_PAGE_SIZE,
          });
          const found = (userList?.users as AdminUserRecord[] | undefined)?.find(
            (u) => sanitizeEmail(u.email) === cleanEmail
          );
          if (found?.id && isUuid(found.id)) {
            cleanUserId = found.id;
          }
        }
      } catch (lookupErr: unknown) {
        console.warn("[User Lookup Warning]:", getErrorMessage(lookupErr));
      }
    }

    // 1. Fetch active (unconsumed) OTP codes for this user/email and purpose
    let query = supabase
      .from("otp_codes")
      .select("*")
      .eq("purpose", validPurpose)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (cleanEmail) {
      query = query.eq("email", cleanEmail);
    } else {
      query = query.eq("user_id", cleanUserId);
    }

    const { data: rawRecords, error: fetchErr } = await query;

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

    // 4. Verify code using constant-time HMAC comparison (check against cleanUserId or email)
    let isMatch = otpMatches(
      activeOtpDoc.code_hash,
      cleanCode,
      activeOtpDoc.user_id,
      validPurpose
    );
    if (!isMatch && cleanEmail) {
      isMatch = otpMatches(
        activeOtpDoc.code_hash,
        cleanCode,
        cleanEmail,
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

    // 5. If this is Step 1 of Password Reset (code verification only, no newPassword supplied)
    if (validPurpose === AuthPurpose.PASSWORD_RESET && !newPassword) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: "Code verified successfully! You may now create your new password.",
      });
    }

    // Code is valid: Mark consumed in Supabase PostgreSQL
    const nowIso = new Date().toISOString();
    await supabase
      .from("otp_codes")
      .update({ consumed_at: nowIso })
      .eq("id", activeOtpDoc.id);

    // 6. Confirm user email or update password in Supabase Auth via Admin API
    let targetUserId = isUuid(activeOtpDoc.user_id)
      ? activeOtpDoc.user_id
      : isUuid(cleanUserId)
      ? cleanUserId
      : "";

    // If targetUserId is still not resolved to a UUID, perform a direct profile lookup first
    if (!targetUserId && cleanEmail) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", cleanEmail)
          .maybeSingle();

        if (profile?.id && isUuid(profile.id)) {
          targetUserId = profile.id;
        } else {
          const { data: userList } = await supabase.auth.admin.listUsers({
            perPage: AUTH_CONSTANTS.MAX_USERS_SEARCH_PAGE_SIZE,
          });
          const found = (userList?.users as AdminUserRecord[] | undefined)?.find(
            (u) => sanitizeEmail(u.email) === cleanEmail
          );
          if (found?.id && isUuid(found.id)) {
            targetUserId = found.id;
          }
        }
      } catch (err: unknown) {
        console.warn("[Admin User Search Error]:", getErrorMessage(err));
      }
    }

    // Guard: For password reset, targetUserId MUST be a valid UUID. Never silently skip!
    if (validPurpose === AuthPurpose.PASSWORD_RESET && newPassword) {
      if (!targetUserId || !isUuid(targetUserId)) {
        return NextResponse.json(
          { error: AUTH_MESSAGES.USER_NOT_FOUND },
          { status: 404 }
        );
      }

      try {
        const { error: authErr } = await supabase.auth.admin.updateUserById(
          targetUserId,
          {
            password: String(newPassword),
            email_confirm: true,
          }
        );

        if (authErr) {
          console.error("[Supabase Auth Admin Update Error]:", authErr.message);
          return NextResponse.json(
            { error: authErr.message || AUTH_MESSAGES.PASSWORD_UPDATE_FAILED },
            { status: 400 }
          );
        }
      } catch (authErr: unknown) {
        console.error("[Supabase Auth Admin Exception]:", authErr);
        return NextResponse.json(
          { error: getErrorMessage(authErr, AUTH_MESSAGES.PASSWORD_UPDATE_FAILED) },
          { status: 500 }
        );
      }

      // Update profile timestamp
      try {
        await supabase
          .from("profiles")
          .update({ updated_at: nowIso })
          .eq("id", targetUserId);
      } catch (profileErr: unknown) {
        console.warn("[Profile Update Notice]:", getErrorMessage(profileErr));
      }
    } else if (targetUserId && isUuid(targetUserId)) {
      // Email verify flow
      try {
        await supabase.auth.admin.updateUserById(targetUserId, {
          email_confirm: true,
        });
      } catch (confirmErr: unknown) {
        console.warn("[Supabase Auth Confirm Notice]:", getErrorMessage(confirmErr));
      }

      try {
        await supabase
          .from("profiles")
          .update({ updated_at: nowIso })
          .eq("id", targetUserId);
      } catch (profileErr: unknown) {
        console.warn("[Profile Update Notice]:", getErrorMessage(profileErr));
      }
    }

    // 7. If this was an email verification, send the branded Welcome Email
    if (validPurpose === AuthPurpose.EMAIL_VERIFY && (cleanEmail || activeOtpDoc.email)) {
      try {
        const targetEmail = cleanEmail || activeOtpDoc.email;
        const { subject, html, text } = await renderTemplate({
          template: "welcome",
          data: { name },
        });
        await sendEmail({
          to: targetEmail,
          subject,
          html,
          text,
        });
      } catch (welcomeErr: unknown) {
        console.warn("[Welcome Email Send Notice]:", getErrorMessage(welcomeErr));
      }
    }

    return NextResponse.json({
      success: true,
      message:
        validPurpose === AuthPurpose.PASSWORD_RESET
          ? AUTH_MESSAGES.PASSWORD_RESET_SUCCESS
          : "Email successfully verified! Your account is now active.",
      status: AccountStatus.ACTIVE,
    });
  } catch (error: unknown) {
    console.error("[Verify OTP Error]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, AUTH_MESSAGES.UNEXPECTED_ERROR) },
      { status: 500 }
    );
  }
}
