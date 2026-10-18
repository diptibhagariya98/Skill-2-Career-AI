import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { generateOtp, hashOtp } from "@/lib/email/crypto";
import { renderTemplate } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transporter";
import {
  AuthPurpose,
  AUTH_MESSAGES,
  AUTH_CONSTANTS,
  isUuid,
  cleanEmail as sanitizeEmail,
  getErrorMessage,
} from "@/constants/auth";

export const dynamic = "force-dynamic";

interface SendOtpRequestBody {
  email?: string;
  userId?: string;
  purpose?: string;
  name?: string;
}

interface AdminUserRecord {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SendOtpRequestBody = await request.json();
    const { email, userId, purpose, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Missing required field: email" },
        { status: 400 }
      );
    }

    const cleanEmail = sanitizeEmail(email);
    let cleanUserId = userId ? String(userId).trim() : cleanEmail;
    const validPurpose =
      purpose === AuthPurpose.PASSWORD_RESET
        ? AuthPurpose.PASSWORD_RESET
        : AuthPurpose.EMAIL_VERIFY;
    const supabase = getServiceSupabase();

    let resolvedName = name || "";

    // Look up Supabase Auth User ID if not provided as UUID
    if (!isUuid(cleanUserId)) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .ilike("email", cleanEmail)
          .maybeSingle();

        if (profile?.id && isUuid(profile.id)) {
          cleanUserId = profile.id;
          if (!resolvedName && profile.full_name) resolvedName = profile.full_name;
        } else {
          const { data: userList } = await supabase.auth.admin.listUsers({
            perPage: AUTH_CONSTANTS.MAX_USERS_SEARCH_PAGE_SIZE,
          });
          const found = (userList?.users as AdminUserRecord[] | undefined)?.find(
            (u) => sanitizeEmail(u.email) === cleanEmail
          );
          if (found?.id && isUuid(found.id)) {
            cleanUserId = found.id;
            if (!resolvedName && (found.user_metadata?.full_name || found.user_metadata?.name)) {
              resolvedName = found.user_metadata?.full_name || found.user_metadata?.name || "";
            }
          }
        }
      } catch (lookupErr: unknown) {
        console.warn("[Send OTP Lookup Notice]:", getErrorMessage(lookupErr));
      }
    }

    // For password reset, require that user account exists
    if (validPurpose === AuthPurpose.PASSWORD_RESET && !isUuid(cleanUserId)) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    // 1. Invalidate any existing unused OTPs for this user and purpose
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

    // 2. Generate 6-digit numeric OTP and HMAC hash
    const code = generateOtp();
    const codeHash = hashOtp(code, cleanUserId, validPurpose);
    const expiresInMinutes = AUTH_CONSTANTS.OTP_EXPIRATION_MINUTES;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    // 3. Store OTP record in Supabase PostgreSQL
    const { error: dbError } = await supabase.from("otp_codes").insert({
      user_id: cleanUserId,
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

    // 4. Render branded email template with 6-digit code
    const templateKey =
      validPurpose === AuthPurpose.PASSWORD_RESET ? "reset-password" : "verify-email";
    const { subject, html, text } = await renderTemplate({
      template: templateKey,
      data: {
        name: resolvedName,
        code,
        expiresInMinutes,
      },
    });

    // 5. Dispatch email via Nodemailer
    await sendEmail({
      to: cleanEmail,
      subject,
      html,
      text,
    });

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
