/**
 * Centralized Authentication Enums, Validation Patterns, and Domain Messages
 * Enforces strict typing, zero hardcoded strings, and zero `any`.
 */

export enum AuthPurpose {
  EMAIL_VERIFY = "EMAIL_VERIFY",
  PASSWORD_RESET = "PASSWORD_RESET",
}

export enum AuthEvent {
  REGISTER = "REGISTER",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  OTP_DISPATCHED = "OTP_DISPATCHED",
  OTP_VERIFIED = "OTP_VERIFIED",
  OTP_FAILED = "OTP_FAILED",
  RESET_TOKEN_ISSUED = "RESET_TOKEN_ISSUED",
  PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
}

export enum AuthTemplateKey {
  VERIFY_EMAIL = "verify-email",
  RESET_PASSWORD = "reset-password",
  WELCOME = "welcome",
}

export enum AuthMode {
  LOGIN = "login",
  REGISTER = "register",
  OTP = "otp",
  FORGOT = "forgot",
  VERIFY_RESET_OTP = "verify-reset-otp",
  SET_NEW_PASSWORD = "set-new-password",
  RESET_PASSWORD = "reset-password",
}

export enum AccountStatus {
  ACTIVE = "ACTIVE",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  SUSPENDED = "SUSPENDED",
}

export enum MobileProfileTab {
  ACCOUNT = "account",
  SECURITY = "security",
  PREFERENCES = "preferences",
}

export const AUTH_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  OTP_LENGTH: 6,
  OTP_COOLDOWN_SECONDS: 60,
  OTP_EXPIRATION_MINUTES: 10,
  RESET_TOKEN_EXPIRATION_MINUTES: 15,
  RESET_TOKEN_HEX_LENGTH: 64,
  MAX_OTP_ATTEMPTS: 5,
  MIN_PASSWORD_CRITERIA_COUNT: 4,
  MAX_USERS_SEARCH_PAGE_SIZE: 1000,
} as const;

export const AUTH_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  LETTERS_AND_SPACES: /^[a-zA-Z\s]+$/,
  NUMERIC_ONLY: /^\d+$/,
  HEX_TOKEN: /^[0-9a-f]{64}$/i,
} as const;

export const AUTH_MESSAGES = {
  FIELD_REQUIRED: "This field is required.",
  EMAIL_INVALID: "Please enter a valid email address.",
  PASSWORD_CRITERIA: "Please satisfy all password security requirements.",
  PASSWORDS_MISMATCH: "Passwords do not match.",
  NAME_INVALID: "Letters and spaces only, no numbers or special characters.",
  NAME_MIN_LENGTH: "Full name must be at least 2 characters long.",
  LOGIN_INVALID_DETAILS: "Please provide valid login details.",
  LOGIN_SUCCESS: "Successfully logged in!",
  LOGIN_INVALID_CREDENTIALS: "Invalid email or password.",
  OTP_SENT_EMAIL_VERIFY: "A 6-digit verification code has been sent to your email.",
  OTP_SENT_PASSWORD_RESET: "A 6-digit password reset code has been sent to your email!",
  OTP_RESENT: "Fresh 6-digit verification code sent!",
  OTP_INVALID_CODE: "Invalid verification code.",
  OTP_INCOMPLETE_CODE: "Please enter the complete 6-digit verification code.",
  OTP_EXPIRED_OR_NOT_FOUND: "No active verification code found. Please request a new one.",
  OTP_TOO_MANY_ATTEMPTS: "Too many failed attempts. This code is invalidated, please request a new one.",
  OTP_CODE_EXPIRED: "Verification code has expired. Please request a new one.",
  RESET_TOKEN_INVALID_OR_EXPIRED: "Password reset session has expired or is invalid. Please verify your OTP code again.",
  CURRENT_PASSWORD_REQUIRED: "Current password is required to change your password.",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect. Please verify and try again.",
  USER_NOT_FOUND: "No account found with this email address. Please register first.",
  ACCOUNT_ALREADY_EXISTS: "An account with this email address already exists. Please sign in instead.",
  ACCOUNT_PENDING_VERIFICATION: "This account is awaiting email verification. A fresh code has been sent.",
  PASSWORD_RESET_SUCCESS: "Password successfully reset! You can now log in with your new password.",
  PASSWORD_UPDATED_PLEASE_LOGIN: "Password updated successfully! Please sign in with your new password.",
  PASSWORD_CHANGED_SUCCESS: "Password changed successfully!",
  PASSWORD_UPDATE_FAILED: "Failed to update password. Please check your credentials and try again.",
  EMAIL_AND_PASSWORD_REQUIRED: "Email and password are required.",
  UNEXPECTED_ERROR: "An unexpected error occurred. Please try again.",
  COOLDOWN_ACTIVE: "Please wait before requesting another code.",
  UNAUTHORIZED_ACCESS: "Unauthorized access. Authentication session required.",
} as const;

export function isUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return AUTH_PATTERNS.UUID.test(value.trim());
}

export function isEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return AUTH_PATTERNS.EMAIL.test(value.trim());
}

export function cleanEmail(email: unknown): string {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export function getErrorMessage(error: unknown, fallback: string = AUTH_MESSAGES.UNEXPECTED_ERROR): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}

export interface PasswordCriteriaResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  passedCount: number;
}

export function evaluatePasswordCriteria(password: string): PasswordCriteriaResult {
  const clean = password || "";
  const hasMinLength = clean.length >= AUTH_CONSTANTS.PASSWORD_MIN_LENGTH;
  const hasUppercase = /[A-Z]/.test(clean);
  const hasNumber = /\d/.test(clean);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(clean);
  const passedCount = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  const isValid = passedCount >= AUTH_CONSTANTS.MIN_PASSWORD_CRITERIA_COUNT;

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasNumber,
    hasSpecial,
    passedCount,
  };
}
