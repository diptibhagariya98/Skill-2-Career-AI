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

    // Rate-limiting check: Don't allow resending more than once every 30 seconds
    const { data: recentOtp } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("email", cleanEmail)
      .eq("purpose", validPurpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

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
    const expiresInMinutes = 10;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

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
      throw new Error(`Failed to save new verification code: ${dbError.message}`);
    }

    // Render email template
    const templateKey = validPurpose === "PASSWORD_RESET" ? "reset-password" : "verify-email";
    const { subject, html, text } = await renderTemplate({
      template: templateKey,
      data: {
        name,
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
  } catch (error: any) {
    console.error("[Resend OTP Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resend verification code." },
      { status: 500 }
    );
  }
}
