import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from "firebase/firestore";
import { otpMatches } from "@/lib/email/crypto";
import { renderTemplate } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transporter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, purpose = "EMAIL_VERIFY", code, name } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: "Missing required fields: userId and code." },
        { status: 400 }
      );
    }

    const cleanUserId = String(userId).trim();
    const cleanCode = String(code).trim();
    const cleanEmail = email ? String(email).trim().toLowerCase() : "";
    const validPurpose = purpose === "PASSWORD_RESET" ? "PASSWORD_RESET" : "EMAIL_VERIFY";

    // 1. Fetch active (unconsumed) OTP codes for this user and purpose
    const q = query(
      collection(db, "otp_codes"),
      where("userId", "==", cleanUserId),
      where("purpose", "==", validPurpose)
    );
    const snapshot = await getDocs(q);

    // Find the latest unconsumed OTP record
    const unconsumedDocs = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d: any) => !d.consumedAt)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activeOtpDoc: any = unconsumedDocs[0];

    if (!activeOtpDoc) {
      return NextResponse.json(
        { error: "No active verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // 2. Check if maximum attempts exceeded
    if (activeOtpDoc.attempts >= activeOtpDoc.maxAttempts) {
      return NextResponse.json(
        { error: "Too many failed attempts. This code is invalidated, please request a new one." },
        { status: 400 }
      );
    }

    // 3. Check expiration
    if (new Date(activeOtpDoc.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 4. Verify code using constant-time HMAC comparison
    const isMatch = otpMatches(activeOtpDoc.codeHash, cleanCode, cleanUserId, validPurpose);

    if (!isMatch) {
      const newAttempts = (activeOtpDoc.attempts || 0) + 1;
      await updateDoc(doc(db, "otp_codes", activeOtpDoc.id), {
        attempts: newAttempts,
      });

      const remaining = Math.max(0, activeOtpDoc.maxAttempts - newAttempts);
      return NextResponse.json(
        {
          error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
          remainingAttempts: remaining,
        },
        { status: 400 }
      );
    }

    // 5. Code is valid: Mark consumed in Firestore
    const nowIso = new Date().toISOString();
    await updateDoc(doc(db, "otp_codes", activeOtpDoc.id), {
      consumedAt: nowIso,
    });

    // 6. Update user record in Firestore to ACTIVE and mark emailVerifiedAt
    try {
      await setDoc(
        doc(db, "users", cleanUserId),
        {
          status: "ACTIVE",
          emailVerifiedAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } catch (userErr: any) {
      console.warn("[User Status Update Warning]:", userErr.message);
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
      message: "Email successfully verified! Your account is now active.",
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
