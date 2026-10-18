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

interface SendOtpRequestBody {
  email?: string;
  userId?: string;
  purpose?: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendOtpRequestBody = await request.json();
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

    // 1. Resolve User from profiles using indexed email lookup (avoiding linear user list scans)
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

    // 1b. If not in profiles, search Supabase auth.users to avoid false 404 deadlocks
    if (!cleanUserId) {
      const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const users = (userList?.users || []) as Array<{
        id: string;
        email?: string;
        user_metadata?: { name?: string; full_name?: string };
      }>;
      const matched = users.find(
        (u) => (u.email || "").trim().toLowerCase() === cleanEmail.toLowerCase()
      );
      if (matched) {
        cleanUserId = matched.id;
        if (!resolvedName) {
          resolvedName =
            matched.user_metadata?.name ||
            matched.user_metadata?.full_name ||
            cleanEmail.split("@")[0];
        }
        try {
          await supabase.from("profiles").upsert({
            id: cleanUserId,
            email: cleanEmail,
            name: resolvedName,
            full_name: resolvedName,
            updated_at: new Date().toISOString(),
          });
        } catch (healErr: unknown) {
          console.warn("[Profile Auto-Heal Notice]:", getErrorMessage(healErr));
        }
      }
    }

    // 2. For password reset, require an existing account
    if (validPurpose === AuthPurpose.PASSWORD_RESET && !cleanUserId) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    // 3. Invalidate any existing unconsumed OTPs for this email and purpose
    try {
      await supabase
        .from("otp_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("email", cleanEmail)
        .eq("purpose", validPurpose)
        .is("consumed_at", null);
    } catch (invalErr: unknown) {
      console.warn("[OTP Invalidate Notice]:", getErrorMessage(invalErr));
    }

    // 4. Generate 6-digit numeric OTP and HMAC hash
    const code = generateOtp();
    const codeHash = hashOtp(code, cleanEmail, validPurpose);
    const expiresInMinutes = AUTH_CONSTANTS.OTP_EXPIRATION_MINUTES;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || null;
    const userAgent = request.headers.get("user-agent") || null;

    // 5. Store OTP record in PostgreSQL (clean, minimal columns)
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
    });

    if (dbError) {
      throw new Error(`Failed to save verification record: ${dbError.message}`);
    }

    // 6. Render and dispatch branded email
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

    // 7. Record audit log
    try {
      await supabase.from("auth_audit_logs").insert({
        user_id: cleanUserId || null,
        email: cleanEmail,
        event: AuthEvent.OTP_DISPATCHED,
        ip: clientIp,
        user_agent: userAgent,
        metadata: { purpose: validPurpose },
      });
    } catch (auditErr: unknown) {
      console.warn("[Audit Log Notice]:", getErrorMessage(auditErr));
    }

    return NextResponse.json({
      success: true,
      message:
        validPurpose === AuthPurpose.PASSWORD_RESET
          ? AUTH_MESSAGES.OTP_SENT_PASSWORD_RESET
          : AUTH_MESSAGES.OTP_SENT_EMAIL_VERIFY,
      expiresInMinutes,
    });
  } catch (error: unknown) {
    console.error("[Send OTP Error]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to generate or send verification code.") },
      { status: 500 }
    );
  }
}
