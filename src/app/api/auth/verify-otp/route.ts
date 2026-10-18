import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { otpMatches } from "@/lib/email/crypto";
import { renderTemplate } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transporter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, purpose = "EMAIL_VERIFY", code, name } = body;

    if (!code || (!userId && !email)) {
      return NextResponse.json(
        { error: "Missing required fields: code and email/userId." },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim();
    const cleanEmail = email ? String(email).trim().toLowerCase() : "";
    let cleanUserId = userId ? String(userId).trim() : cleanEmail;
    const validPurpose = purpose === "PASSWORD_RESET" ? "PASSWORD_RESET" : "EMAIL_VERIFY";
    const supabase = getServiceSupabase();

    // Look up Supabase Auth User ID if not provided as UUID
    if (!cleanUserId || cleanUserId.includes("@")) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (profile?.id) {
          cleanUserId = profile.id;
        } else {
          const { data: userList } = await supabase.auth.admin.listUsers();
          const found = (userList?.users as any[])?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
          if (found) cleanUserId = found.id;
        }
      } catch {
        // fallback
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

    const { data: records, error: fetchErr } = await query;

    if (fetchErr) {
      throw new Error(`Database error: ${fetchErr.message}`);
    }

    const activeOtpDoc = records?.[0];

    if (!activeOtpDoc) {
      return NextResponse.json(
        { error: "No active verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // 2. Check if maximum attempts exceeded
    if (activeOtpDoc.attempts >= activeOtpDoc.max_attempts) {
      return NextResponse.json(
        { error: "Too many failed attempts. This code is invalidated, please request a new one." },
        { status: 400 }
      );
    }

    // 3. Check expiration
    if (new Date(activeOtpDoc.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 4. Verify code using constant-time HMAC comparison (check against cleanUserId or email)
    let isMatch = otpMatches(activeOtpDoc.code_hash, cleanCode, activeOtpDoc.user_id, validPurpose);
    if (!isMatch && cleanEmail) {
      isMatch = otpMatches(activeOtpDoc.code_hash, cleanCode, cleanEmail, validPurpose);
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
          error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
          remainingAttempts: remaining,
        },
        { status: 400 }
      );
    }

    // 5. Code is valid: Mark consumed in Supabase PostgreSQL
    const nowIso = new Date().toISOString();
    await supabase
      .from("otp_codes")
      .update({ consumed_at: nowIso })
      .eq("id", activeOtpDoc.id);

    // 6. Confirm user email or update password in Supabase Auth via Admin API
    const targetUserId = activeOtpDoc.user_id?.includes("@") ? cleanUserId : activeOtpDoc.user_id;
    if (targetUserId && !targetUserId.includes("@")) {
      const updatePayload: Record<string, any> = {
        email_confirm: true,
      };

      if (validPurpose === "PASSWORD_RESET" && body.newPassword) {
        updatePayload.password = String(body.newPassword);
      }

      try {
        const { error: authErr } = await supabase.auth.admin.updateUserById(targetUserId, updatePayload);
        if (authErr) {
          console.error("[Supabase Auth Admin Update Error]:", authErr.message);
          return NextResponse.json(
            { error: authErr.message || "Failed to update user security record." },
            { status: 400 }
          );
        }
      } catch (authErr: any) {
        console.warn("[Supabase Auth Confirm Notice]:", authErr.message);
      }

      // Update profile timestamp
      try {
        await supabase
          .from("profiles")
          .update({ updated_at: nowIso })
          .eq("id", targetUserId);
      } catch (profileErr: any) {
        console.warn("[Profile Update Notice]:", profileErr.message);
      }
    }

    // 7. If this was an email verification, send the branded Welcome Email
    if (validPurpose === "EMAIL_VERIFY" && (cleanEmail || activeOtpDoc.email)) {
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
      } catch (welcomeErr: any) {
        console.warn("[Welcome Email Send Notice]:", welcomeErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: validPurpose === "PASSWORD_RESET"
        ? "Password successfully reset! You can now log in with your new password."
        : "Email successfully verified! Your account is now active.",
      status: "ACTIVE",
    });
  } catch (error: any) {
    console.error("[Verify OTP Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify code." },
      { status: 500 }
    );
  }
}
