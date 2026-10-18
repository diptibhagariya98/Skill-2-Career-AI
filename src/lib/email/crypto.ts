import { randomInt, createHmac, timingSafeEqual } from "crypto";

const DEFAULT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "resumentor-secret-hmac-key-default-2026";

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 * Example: "482910"
 */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Hash an OTP using HMAC-SHA256 with userId, purpose and server secret.
 * Prevents offline rainbow table / brute-force attacks on 6-digit codes.
 */
export function hashOtp(
  code: string,
  userId: string,
  purpose: string,
  secret: string = DEFAULT_SECRET
): string {
  return createHmac("sha256", secret)
    .update(`${userId.toLowerCase()}:${purpose.toUpperCase()}:${code.trim()}`)
    .digest("hex");
}

/**
 * Timing-safe comparison of provided OTP with stored HMAC hex hash.
 */
export function otpMatches(
  storedHex: string,
  code: string,
  userId: string,
  purpose: string,
  secret: string = DEFAULT_SECRET
): boolean {
  try {
    const computedHex = hashOtp(code, userId, purpose, secret);
    const a = Buffer.from(computedHex, "hex");
    const b = Buffer.from(storedHex, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
