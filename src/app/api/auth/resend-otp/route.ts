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

interface ResendOtpRequestBody {
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
    const body: ResendOtpRequestBody = await request.json();
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
        console.warn("[Resend OTP Lookup Warning]:", getErrorMessage(lookupErr));
      }
    }

    // For password reset, require that user account exists
    if (validPurpose === AuthPurpose.PASSWORD_RESET && !isUuid(cleanUserId)) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    // Rate-limiting check: Don't allow resending more than once every 30 seconds
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
      if (diffSec < 30) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil(30 - diffSec)}s before requesting another code.` },
          { status: 429 }
        );
      }
    }

    // Invalidate existing active OTPs
    await supabase
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("email", cleanEmail)
      .eq("purpose", validPurpose)
      .is("consumed_at", null);

    // Generate new OTP
    const code = generateOtp();
    const codeHash = hashOtp(code, cleanUserId, validPurpose);
    const expiresInMinutes = AUTH_CONSTANTS.OTP_EXPIRATION_MINUTES;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

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
      throw new Error(`Failed to save new verification code: ${dbError.message}`);
    }

    // Render email template
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

    await sendEmail({
      to: cleanEmail,
      subject,
      html,
      text,
    });

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
