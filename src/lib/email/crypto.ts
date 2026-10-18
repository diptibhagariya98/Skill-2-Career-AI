import { randomInt, randomBytes, createHmac, createHash, timingSafeEqual } from "crypto";
import { AuthPurpose } from "@/constants/auth";

const SERVER_AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "resumentor-production-secure-hmac-salt-key-2026";

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 * Example: "482910"
 */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Hash an OTP using HMAC-SHA256 with user identifier, purpose and server secret.
 * Prevents offline rainbow table / brute-force attacks on 6-digit codes.
 */
export function hashOtp(
  code: string,
  identifier: string,
  purpose: AuthPurpose | string,
  secret: string = SERVER_AUTH_SECRET
): string {
  const normalizedId = String(identifier || "").trim().toLowerCase();
  const normalizedPurpose = String(purpose || "").trim().toUpperCase();
  const normalizedCode = String(code || "").trim();

  return createHmac("sha256", secret)
    .update(`${normalizedId}:${normalizedPurpose}:${normalizedCode}`)
    .digest("hex");
}

/**
 * Timing-safe comparison of provided OTP with stored HMAC hex hash.
 */
export function otpMatches(
  storedHex: string,
  code: string,
  identifier: string,
  purpose: AuthPurpose | string,
  secret: string = SERVER_AUTH_SECRET
): boolean {
  try {
    const computedHex = hashOtp(code, identifier, purpose, secret);
    const a = Buffer.from(computedHex, "hex");
    const b = Buffer.from(storedHex, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Generate a high-entropy 256-bit cryptographically secure reset token.
 * Formatted as a 64-character hexadecimal string.
 */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a reset token using SHA-256 for persistent database storage.
 */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Timing-safe comparison of provided reset token with stored SHA-256 hex hash.
 */
export function resetTokenMatches(storedHash: string, token: string): boolean {
  try {
    const computedHash = hashResetToken(token);
    const a = Buffer.from(computedHash, "hex");
    const b = Buffer.from(storedHash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
