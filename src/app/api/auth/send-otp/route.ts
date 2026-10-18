import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { generateOtp, hashOtp } from "@/lib/email/crypto";
import { renderTemplate } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transporter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, purpose = "EMAIL_VERIFY", name } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Missing required field: email" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let cleanUserId = userId ? String(userId).trim() : cleanEmail;
    const validPurpose = purpose === "PASSWORD_RESET" ? "PASSWORD_RESET" : "EMAIL_VERIFY";
    const supabase = getServiceSupabase();

    // Look up Supabase Auth User ID if not provided as UUID
    if (!cleanUserId || cleanUserId.includes("@")) {
      try {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const found = (userList?.users as any[])?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
        if (found) cleanUserId = found.id;
      } catch {
        // fallback
      }
    }

    // 1. Invalidate any existing unused OTPs for this user and purpose
    try {
      await supabase
        .from("otp_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("email", cleanEmail)
        .eq("purpose", validPurpose)
        .is("consumed_at", null);
    } catch (e: any) {
      console.warn("[OTP Invalidate Notice]", e.message);
    }

    // 2. Generate 6-digit numeric OTP and HMAC hash
    const code = generateOtp();
    const codeHash = hashOtp(code, cleanUserId, validPurpose);
    const expiresInMinutes = 10;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    // 3. Store OTP record in Supabase PostgreSQL
    const { error: dbError } = await supabase.from("otp_codes").insert({
      user_id: cleanUserId,
      email: cleanEmail,
      purpose: validPurpose,
      code_hash: codeHash,
      attempts: 0,
      max_attempts: 5,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      consumed_at: null,
    });

    if (dbError) {
      throw new Error(`Failed to save verification record: ${dbError.message}`);
    }

    // 4. Render branded email template with 6-digit code
    const templateKey = validPurpose === "PASSWORD_RESET" ? "reset-password" : "verify-email";
    const { subject, html, text } = await renderTemplate({
      template: templateKey,
      data: {
        name,
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
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
      expiresInMinutes,
    });
  } catch (error: any) {
    console.error("[Send OTP Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate or send verification code." },
      { status: 500 }
    );
  }
}
