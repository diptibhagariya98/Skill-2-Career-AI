import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from "firebase/firestore";
import { generateOtp, hashOtp } from "@/lib/email/crypto";
import { renderTemplate } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transporter";

export const dynamic = "force-dynamic";

const COOLDOWN_SECONDS = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, purpose = "EMAIL_VERIFY", name } = body;

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: email and userId." },
        { status: 400 }
      );
    }

    const cleanUserId = String(userId).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const validPurpose = purpose === "PASSWORD_RESET" ? "PASSWORD_RESET" : "EMAIL_VERIFY";

    // 1. Check cooldown: Find most recent OTP code for this user & purpose
    const q = query(
      collection(db, "otp_codes"),
      where("userId", "==", cleanUserId),
      where("purpose", "==", validPurpose)
    );
    const snapshot = await getDocs(q);

    const sortedDocs: any[] = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const latestDoc: any = sortedDocs[0];

    if (latestDoc && latestDoc.createdAt) {
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(latestDoc.createdAt).getTime()) / 1000
      );

      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remainingSeconds = COOLDOWN_SECONDS - elapsedSeconds;
        return NextResponse.json(
          {
            error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
            retryAfter: remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    // 2. Invalidate all older unconsumed codes
    for (const d of sortedDocs) {
      if (!d.consumedAt) {
        await updateDoc(doc(db, "otp_codes", d.id), {
          consumedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Issue fresh 6-digit OTP
    const code = generateOtp();
    const codeHash = hashOtp(code, cleanUserId, validPurpose);
    const expiresInMinutes = 10;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    await addDoc(collection(db, "otp_codes"), {
      userId: cleanUserId,
      email: cleanEmail,
      purpose: validPurpose,
      codeHash,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      createdAt: new Date().toISOString(),
      consumedAt: null,
    });

    // 4. Render template & send email
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
      message: `A new verification code has been sent to ${cleanEmail}.`,
      expiresInMinutes,
      cooldownSeconds: COOLDOWN_SECONDS,
    });
  } catch (error: any) {
    console.error("[Resend OTP Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resend verification code." },
      { status: 500 }
    );
  }
}
