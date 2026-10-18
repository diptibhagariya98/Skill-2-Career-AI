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
  cleanEmail,
  evaluatePasswordCriteria,
  getErrorMessage,
} from "@/constants/auth";

export const dynamic = "force-dynamic";

interface RegisterRequestBody {
  email?: string;
  password?: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequestBody = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.EMAIL_AND_PASSWORD_REQUIRED },
        { status: 400 }
      );
    }

    const sanitizedEmail = cleanEmail(email);
    const sanitizedName = String(name || "").trim();

    // 1. Validate Email format
    if (!AUTH_PATTERNS.EMAIL.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.EMAIL_INVALID },
        { status: 400 }
      );
    }

    // 2. Validate Full Name format & length
    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.NAME_MIN_LENGTH },
        { status: 400 }
      );
    }
    if (!AUTH_PATTERNS.LETTERS_AND_SPACES.test(sanitizedName)) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.NAME_INVALID },
        { status: 400 }
      );
    }

    // 3. Server-side Password Criteria Validation
    const passwordValidation = evaluatePasswordCriteria(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: AUTH_MESSAGES.PASSWORD_CRITERIA },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 4. Create user via Supabase Admin API with email_confirm: false
    // If the user already exists, Supabase Admin API returns an error without an in-memory scan
    let userId = "";
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: false,
      user_metadata: {
        name: sanitizedName,
        full_name: sanitizedName,
      },
    });

    if (createErr || !newUser?.user) {
      const errLower = (createErr?.message || "").toLowerCase();
      const isAlreadyExists =
        errLower.includes("already registered") ||
        errLower.includes("already exists") ||
        errLower.includes("violates unique constraint");

      if (isAlreadyExists) {
        // Query profile to determine if the existing account is already confirmed
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("email", sanitizedEmail)
          .maybeSingle();

        if (existingProfile?.id) {
          const { data: authUserData } = await supabase.auth.admin.getUserById(existingProfile.id);
          if (authUserData?.user?.email_confirmed_at) {
            return NextResponse.json(
              { error: AUTH_MESSAGES.ACCOUNT_ALREADY_EXISTS },
              { status: 409 }
            );
          }
          // The user exists but is unconfirmed:
          // Update their password and metadata to what they just entered in the registration form
          // so that upon OTP confirmation, the password they just entered ACTUALLY works!
          userId = existingProfile.id;
          const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
            password,
            user_metadata: {
              name: sanitizedName,
              full_name: sanitizedName,
            },
          });
          if (updateErr) {
            console.warn("[Unconfirmed User Password Sync Notice]:", updateErr.message);
          }
        } else {
          return NextResponse.json(
            { error: AUTH_MESSAGES.ACCOUNT_ALREADY_EXISTS },
            { status: 409 }
          );
        }
      } else {
        throw new Error(createErr?.message || "Failed to create user account.");
      }
    } else {
      userId = newUser.user.id;
    }

    // 5. Create or sync user profile
    try {
      await supabase.from("profiles").upsert({
        id: userId,
        email: sanitizedEmail,
        name: sanitizedName,
        full_name: sanitizedName,
        updated_at: new Date().toISOString(),
      });
    } catch (profileErr: unknown) {
      console.warn("[Profile Upsert Notice]:", getErrorMessage(profileErr));
    }

    // 6. Invalidate any existing active OTPs for EMAIL_VERIFY
    await supabase
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("email", sanitizedEmail)
      .eq("purpose", AuthPurpose.EMAIL_VERIFY)
      .is("consumed_at", null);

    // 7. Generate secure 6-digit OTP
    const code = generateOtp();
    const codeHash = hashOtp(code, sanitizedEmail, AuthPurpose.EMAIL_VERIFY);
    const expiresInMinutes = AUTH_CONSTANTS.OTP_EXPIRATION_MINUTES;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || null;
    const userAgent = request.headers.get("user-agent") || null;

    const { error: dbError } = await supabase.from("otp_codes").insert({
      user_id: userId,
      email: sanitizedEmail,
      purpose: AuthPurpose.EMAIL_VERIFY,
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
      throw new Error(`Failed to store OTP: ${dbError.message}`);
    }

    // 8. Send branded verification email via Nodemailer
    const { subject, html, text } = await renderTemplate({
      template: AuthTemplateKey.VERIFY_EMAIL,
      data: {
        name: sanitizedName,
        code,
        expiresInMinutes,
      },
    });

    await sendEmail({
      to: sanitizedEmail,
      subject,
      html,
      text,
    });

    // 9. Record audit event
    try {
      await supabase.from("auth_audit_logs").insert({
        user_id: userId,
        email: sanitizedEmail,
        event: AuthEvent.REGISTER,
        ip: clientIp,
        user_agent: userAgent,
        metadata: { purpose: AuthPurpose.EMAIL_VERIFY },
      });
    } catch (auditErr: unknown) {
      console.warn("[Audit Log Notice]:", getErrorMessage(auditErr));
    }

    return NextResponse.json({
      success: true,
      userId,
      message: AUTH_MESSAGES.OTP_SENT_EMAIL_VERIFY,
      expiresInMinutes,
    });
  } catch (error: unknown) {
    console.error("[Register Route Error]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to register account.") },
      { status: 500 }
    );
  }
}
