import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { generateOtp, hashOtp } from "@/lib/email/crypto";
import { renderTemplate } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transporter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name || "").trim();
    const supabase = getServiceSupabase();

    // 1. Check if user already exists in Supabase Auth
    const { data: userList } = await supabase.auth.admin.listUsers();
    const existing = (userList?.users as any[])?.find(
      (u: any) => u.email?.toLowerCase() === cleanEmail
    );

    let userId = "";

    if (existing) {
      // If user exists and is already confirmed, prompt them to sign in
      if (existing.email_confirmed_at) {
        return NextResponse.json(
          { error: "An account with this email address already exists. Please sign in instead." },
          { status: 409 }
        );
      }
      // If user exists but is unconfirmed, update their password and re-trigger OTP
      userId = existing.id;
      await supabase.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { name: cleanName, full_name: cleanName },
      });
    } else {
      // 2. Create user via Supabase Admin API with email_confirm: false
      // IMPORTANT: admin.createUser NEVER triggers Supabase's default confirmation email!
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: false,
        user_metadata: {
          name: cleanName,
          full_name: cleanName,
        },
      });

      if (createErr || !newUser?.user) {
        throw new Error(createErr?.message || "Failed to create user account.");
      }

      userId = newUser.user.id;

      // 3. Create or update user profile
      try {
        await supabase.from("profiles").upsert({
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          updated_at: new Date().toISOString(),
        });
      } catch (profileErr: any) {
        console.warn("[Profile Creation Notice]:", profileErr.message);
      }
    }

    // 4. Invalidate any existing active OTPs for EMAIL_VERIFY
    await supabase
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("email", cleanEmail)
      .eq("purpose", "EMAIL_VERIFY")
      .is("consumed_at", null);

    // 5. Generate secure 6-digit OTP
    const code = generateOtp();
    const codeHash = hashOtp(code, userId, "EMAIL_VERIFY");
    const expiresInMinutes = 10;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const { error: dbError } = await supabase.from("otp_codes").insert({
      user_id: userId,
      email: cleanEmail,
      purpose: "EMAIL_VERIFY",
      code_hash: codeHash,
      attempts: 0,
      max_attempts: 5,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      consumed_at: null,
    });

    if (dbError) {
      throw new Error(`Failed to store OTP: ${dbError.message}`);
    }

    // 6. Send ONLY our custom branded ResuMentor verification email via Nodemailer
    const { subject, html, text } = await renderTemplate({
      template: "verify-email",
      data: {
        name: cleanName,
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
      userId,
      message: "Account created! A 6-digit verification code has been sent to your email.",
      expiresInMinutes,
    });
  } catch (error: any) {
    console.error("[Register Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register account." },
      { status: 500 }
    );
  }
}
