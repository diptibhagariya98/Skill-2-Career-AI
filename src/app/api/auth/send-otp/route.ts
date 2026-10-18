import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { generateOtp, hashOtp } from "@/lib/email/crypto";
import { renderTemplate } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transporter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, purpose = "EMAIL_VERIFY", name } = body;

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: email and userId" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUserId = String(userId).trim();
    const validPurpose = purpose === "PASSWORD_RESET" ? "PASSWORD_RESET" : "EMAIL_VERIFY";

    // 1. Invalidate any existing unused OTPs for this user and purpose
    try {
      const existingQuery = query(
        collection(db, "otp_codes"),
        where("userId", "==", cleanUserId),
        where("purpose", "==", validPurpose)
      );
      const snapshot = await getDocs(existingQuery);
      for (const otpDoc of snapshot.docs) {
        if (!otpDoc.data().consumedAt) {
          await updateDoc(doc(db, "otp_codes", otpDoc.id), {
            consumedAt: new Date().toISOString(),
          });
        }
      }
    } catch (e: any) {
      console.warn("[OTP Invalidate Warning]", e.message);
    }

    // 2. Generate 6-digit cryptographic OTP and HMAC hash
    const code = generateOtp();
    const codeHash = hashOtp(code, cleanUserId, validPurpose);
    const expiresInMinutes = 10;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    // 3. Store OTP record in Firestore
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

    // 4. Render branded email template
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
