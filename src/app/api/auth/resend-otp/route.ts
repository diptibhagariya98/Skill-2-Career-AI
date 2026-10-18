import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { generateOtp, hashOtp } from "@/lib/email/crypto";
import { renderTemplate } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transporter";
import {
  AuthPurpose,
  AuthEvent,
  AuthTemplateKey,
  AUTH_MESSAGES,
  AUTH_CONSTANTS,
  AUTH_PATTERNS,
  cleanEmail as sanitizeEmail,
  getErrorMessage,
  isUuid,
} from "@/constants/auth";

export const dynamic = "force-dynamic";

interface ResendOtpRequestBody {
  email?: string;
  userId?: string;
  purpose?: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResendOtpRequestBody = await request.json();
    const { email, userId, purpose, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.FIELD_REQUIRED },
        { status: 400 }
      );
    }

    const cleanEmail = sanitizeEmail(email);
    if (!AUTH_PATTERNS.EMAIL.test(cleanEmail)) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.EMAIL_INVALID },
        { status: 400 }
      );
    }

    const validPurpose =
      purpose === AuthPurpose.PASSWORD_RESET
        ? AuthPurpose.PASSWORD_RESET
        : AuthPurpose.EMAIL_VERIFY;

    const supabase = getServiceSupabase();
    let cleanUserId = userId && isUuid(userId) ? String(userId).trim() : "";
    let resolvedName = String(name || "").trim();

    // 1. Resolve User from profiles using indexed email lookup
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, full_name")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (profile?.id) {
      cleanUserId = profile.id;
      if (!resolvedName) {
        resolvedName = profile.full_name || profile.name || "";
      }
    }

    // 2. For password reset, require that user account exists
    if (validPurpose === AuthPurpose.PASSWORD_RESET && !cleanUserId) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    // 3. Rate-limiting check: Don't allow resending more than once every 30 seconds
    const { data: recentOtp } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("email", cleanEmail)
      .eq("purpose", validPurpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp?.created_at) {
      const diffSec = (Date.now() - new Date(recentOtp.created_at).getTime()) / 1000;
      const cooldownSec = 30;
      if (diffSec < cooldownSec) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil(cooldownSec - diffSec)}s before requesting another code.` },
          { status: 429 }
        );
      }
    }

    // 4. Invalidate existing active OTPs
    await supabase
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("email", cleanEmail)
      .eq("purpose", validPurpose)
      .is("consumed_at", null);

    // 5. Generate new OTP
    const code = generateOtp();
    const codeHash = hashOtp(code, cleanEmail, validPurpose);
    const expiresInMinutes = AUTH_CONSTANTS.OTP_EXPIRATION_MINUTES;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || null;
    const userAgent = request.headers.get("user-agent") || null;

    const { error: dbError } = await supabase.from("otp_codes").insert({
      user_id: cleanUserId || cleanEmail,
      email: cleanEmail,
      purpose: validPurpose,
      code_hash: codeHash,
      attempts: 0,
      max_attempts: AUTH_CONSTANTS.MAX_OTP_ATTEMPTS,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      consumed_at: null,
      ip_address: clientIp,
      user_agent: userAgent,
    });

    if (dbError) {
      throw new Error(`Failed to save new verification code: ${dbError.message}`);
    }

    // 6. Render email template
    const templateKey =
      validPurpose === AuthPurpose.PASSWORD_RESET
        ? AuthTemplateKey.RESET_PASSWORD
        : AuthTemplateKey.VERIFY_EMAIL;

    const { subject, html, text } = await renderTemplate({
      template: templateKey,
      data: {
        name: resolvedName,
        code,
        expiresInMinutes,
      },
    });

    await sendEmail({
      to: cleanEmail,
      subject,
      html,
      text,
    });

    // 7. Audit log
    try {
      await supabase.from("auth_audit_logs").insert({
        user_id: cleanUserId || null,
        email: cleanEmail,
        event: AuthEvent.OTP_DISPATCHED,
        ip: clientIp,
        user_agent: userAgent,
        metadata: { isResend: true, purpose: validPurpose },
      });
    } catch (auditErr: unknown) {
      console.warn("[Audit Log Notice]:", getErrorMessage(auditErr));
    }

    return NextResponse.json({
      success: true,
      message: `A fresh 6-digit verification code has been sent to ${cleanEmail}.`,
      expiresInMinutes,
    });
  } catch (error: unknown) {
    console.error("[Resend OTP Error]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to resend verification code.") },
      { status: 500 }
    );
  }
}
