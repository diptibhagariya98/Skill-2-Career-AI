/**
 * Hardcore Black-Box Controller & End-to-End Method Verification Script
 * Domain: Auth / Password Reset Lifecycle
 * Spec: .agents/rules/blackbox-testing.md
 * 
 * Verifies the actual hardcore black-box behavior of the authentication and
 * two-step password reset endpoints from top-level NextRequest entry points
 * down to database persistence, cryptographic checks, and session generation.
 */

import "./env-loader";
import { NextRequest } from "next/server";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as sendOtpHandler } from "@/app/api/auth/send-otp/route";
import { POST as verifyOtpHandler } from "@/app/api/auth/verify-otp/route";
import { getServiceSupabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import {
  AuthPurpose,
  AUTH_MESSAGES,
  AUTH_CONSTANTS,
  evaluatePasswordCriteria,
  getErrorMessage,
} from "@/constants/auth";

// Colors for terminal formatting
const COLOR_RESET = "\x1b[0m";
const COLOR_GREEN = "\x1b[32m";
const COLOR_RED = "\x1b[31m";
const COLOR_CYAN = "\x1b[36m";
const COLOR_YELLOW = "\x1b[33m";
const COLOR_BOLD = "\x1b[1m";

interface JsonResponsePayload {
  success?: boolean;
  error?: string;
  message?: string;
  userId?: string;
  resetToken?: string;
  verified?: boolean;
  expiresInMinutes?: number;
  remainingAttempts?: number;
  sessionTokenHash?: string;
}

// Request Helper: Simulates a real NextRequest invocation
async function callEndpoint(
  handler: (req: NextRequest) => Promise<Response>,
  url: string,
  body: Record<string, unknown>,
  clientIp = "192.168.1.100"
): Promise<{ status: number; data: JsonResponsePayload }> {
  console.log(`\n${COLOR_CYAN}>>> INCOMING REQUEST [POST] ${url}${COLOR_RESET}`);
  console.log(`${COLOR_CYAN}Headers:${COLOR_RESET} x-forwarded-for: ${clientIp}, content-type: application/json`);
  console.log(`${COLOR_CYAN}Payload:${COLOR_RESET} ${JSON.stringify(body, null, 2)}`);

  const request = new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": clientIp,
      "user-agent": "BlackBoxTestRunner/1.0 (Integration; Android)",
    },
    body: JSON.stringify(body),
  });

  const response = await handler(request);
  const data = (await response.json()) as JsonResponsePayload;

  console.log(`${COLOR_CYAN}<<< CONTROLLER RESPONSE [Status ${response.status}]${COLOR_RESET}`);
  console.log(JSON.stringify(data, null, 2));

  return { status: response.status, data };
}

function assertCondition(desc: string, condition: boolean): void {
  if (condition) {
    console.log(`  ${COLOR_GREEN}✓ PASS:${COLOR_RESET} ${desc}`);
  } else {
    console.error(`  ${COLOR_RED}❌ FAIL:${COLOR_RESET} ${desc}`);
    throw new Error(`Assertion failed: ${desc}`);
  }
}

async function runBlackboxTestSuite() {
  console.log(`${COLOR_BOLD}========================================================================${COLOR_RESET}`);
  console.log(`${COLOR_BOLD}   HARDCORE BLACK-BOX VERIFICATION: AUTH PASSWORD RESET LIFECYCLE      ${COLOR_RESET}`);
  console.log(`${COLOR_BOLD}========================================================================${COLOR_RESET}`);

  const supabase = getServiceSupabase();
  const timestamp = Date.now();
  const testUserA = {
    name: "BlackBox Tester Alpha",
    email: `bb.test.alpha.${timestamp}@example.com`,
    initialPassword: "OldPassword1!",
    newPassword: "NewSecurePassword2@",
  };
  const testUserB = {
    name: "BlackBox Tester Beta",
    email: `bb.test.beta.${timestamp}@example.com`,
    initialPassword: "OldPassword1!",
    newPassword: "BetaNewPassword3#",
  };

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Missing / Non-Existent Target (404 Not Found)
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[CASE 1] Missing / Non-Existent Target (404 Not Found)${COLOR_RESET}`);
    const nonExistentRes = await callEndpoint(
      sendOtpHandler,
      "/api/auth/send-otp",
      {
        email: `ghost.account.${timestamp}@example.com`,
        purpose: AuthPurpose.PASSWORD_RESET,
      }
    );
    assertCondition("Endpoint returns 404 for unregistered email", nonExistentRes.status === 404);
    assertCondition("Error message matches USER_NOT_FOUND constant", nonExistentRes.data.error === AUTH_MESSAGES.USER_NOT_FOUND);

    // -------------------------------------------------------------------------
    // SETUP FIXTURES: Register Real Accounts via Top-Level Registration Endpoint
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[SETUP] Registering User A via /api/auth/register${COLOR_RESET}`);
    const regUserA = await callEndpoint(
      registerHandler,
      "/api/auth/register",
      {
        name: testUserA.name,
        email: testUserA.email,
        password: testUserA.initialPassword,
      }
    );
    assertCondition("User A created via registration endpoint", regUserA.status === 200 && !!regUserA.data.userId);

    console.log(`\n${COLOR_YELLOW}[SETUP] Registering User B via /api/auth/register${COLOR_RESET}`);
    const regUserB = await callEndpoint(
      registerHandler,
      "/api/auth/register",
      {
        name: testUserB.name,
        email: testUserB.email,
        password: testUserB.initialPassword,
      }
    );
    assertCondition("User B created via registration endpoint", regUserB.status === 200 && !!regUserB.data.userId);

    // Confirm both users in Supabase so login tests can test password validation accurately
    await supabase.auth.admin.updateUserById(regUserA.data.userId as string, { email_confirm: true });
    await supabase.auth.admin.updateUserById(regUserB.data.userId as string, { email_confirm: true });

    // -------------------------------------------------------------------------
    // TEST 2: Request Password Reset OTP (Happy Path Step 1 Request)
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[CASE 2] Password Reset Request for User A (Happy Path)${COLOR_RESET}`);
    const sendOtpRes = await callEndpoint(
      sendOtpHandler,
      "/api/auth/send-otp",
      {
        email: testUserA.email,
        purpose: AuthPurpose.PASSWORD_RESET,
      }
    );
    assertCondition("Send OTP returns HTTP 200", sendOtpRes.status === 200);
    assertCondition("Response indicates success", sendOtpRes.data.success === true);
    assertCondition("Expiry time returned", typeof sendOtpRes.data.expiresInMinutes === "number");

    // -------------------------------------------------------------------------
    // TEST 3: Mismatched / Malformed Payloads (400 Bad Request)
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[CASE 3] Malformed Payloads & Validation Guardrails${COLOR_RESET}`);
    
    // 3a. Invalid code format
    const malformedCodeRes = await callEndpoint(
      verifyOtpHandler,
      "/api/auth/verify-otp",
      {
        email: testUserA.email,
        code: "ABC!",
        purpose: AuthPurpose.PASSWORD_RESET,
      }
    );
    assertCondition("Rejects non-numeric/short OTP code with 400", malformedCodeRes.status === 400);

    // 3b. Missing email
    const missingEmailRes = await callEndpoint(
      verifyOtpHandler,
      "/api/auth/verify-otp",
      {
        code: "123456",
        purpose: AuthPurpose.PASSWORD_RESET,
      }
    );
    assertCondition("Rejects missing email with 400", missingEmailRes.status === 400);

    // 3c. Incorrect 6-digit code
    const incorrectCodeRes = await callEndpoint(
      verifyOtpHandler,
      "/api/auth/verify-otp",
      {
        email: testUserA.email,
        code: "999999",
        purpose: AuthPurpose.PASSWORD_RESET,
      }
    );
    assertCondition("Rejects wrong 6-digit OTP code with 400", incorrectCodeRes.status === 400);
    assertCondition("Returns remaining attempts", typeof incorrectCodeRes.data.remainingAttempts === "number");

    // -------------------------------------------------------------------------
    // TEST 4: Happy Path Step 1: Code Verification & Reset Token Issuance
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[CASE 4] Step 1: Code Verification & Reset Token Issuance${COLOR_RESET}`);
    
    // Retrieve the active OTP code record from database to obtain the HMAC-hashed code for verification
    const { data: dbOtp } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", testUserA.email)
      .eq("purpose", AuthPurpose.PASSWORD_RESET)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    assertCondition("Database contains active unconsumed OTP code record", !!dbOtp);

    // Compute or brute-force the 6-digit code matching the stored HMAC (deterministic check for black-box)
    const { otpMatches } = await import("@/lib/email/crypto");
    let validCode = "";
    for (let c = 0; c <= 999999; c++) {
      const candidate = String(c).padStart(6, "0");
      if (otpMatches(dbOtp.code_hash, candidate, testUserA.email, AuthPurpose.PASSWORD_RESET)) {
        validCode = candidate;
        break;
      }
    }
    assertCondition("Located valid 6-digit numeric OTP matching stored HMAC", validCode.length === 6);

    const step1Res = await callEndpoint(
      verifyOtpHandler,
      "/api/auth/verify-otp",
      {
        email: testUserA.email,
        code: validCode,
        purpose: AuthPurpose.PASSWORD_RESET,
      }
    );
    assertCondition("Step 1 verification returns 200", step1Res.status === 200);
    assertCondition("Step 1 returns verified: true", step1Res.data.verified === true);
    assertCondition("Step 1 returns high-entropy resetToken", typeof step1Res.data.resetToken === "string" && step1Res.data.resetToken.length >= 32);

    const issuedResetToken = step1Res.data.resetToken as string;

    // -------------------------------------------------------------------------
    // TEST 5: Step 2 Weak Password Rejection (400 Bad Request)
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[CASE 5] Step 2 Weak Password Validation Constraints${COLOR_RESET}`);
    const weakPwdRes = await callEndpoint(
      verifyOtpHandler,
      "/api/auth/verify-otp",
      {
        email: testUserA.email,
        purpose: AuthPurpose.PASSWORD_RESET,
        resetToken: issuedResetToken,
        newPassword: "weak",
      }
    );
    assertCondition("Rejects weak new password with 400", weakPwdRes.status === 400);
    assertCondition("Error message matches PASSWORD_CRITERIA", weakPwdRes.data.error === AUTH_MESSAGES.PASSWORD_CRITERIA);

    // -------------------------------------------------------------------------
    // TEST 6: Multi-User Concurrency & Cross-Account Isolation
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[CASE 6] Multi-User Cross-Account Isolation (User A token on User B)${COLOR_RESET}`);
    const crossAccountRes = await callEndpoint(
      verifyOtpHandler,
      "/api/auth/verify-otp",
      {
        email: testUserB.email, // Attacking User B with User A's token
        purpose: AuthPurpose.PASSWORD_RESET,
        resetToken: issuedResetToken,
        newPassword: testUserB.newPassword,
      }
    );
    assertCondition("Cross-account token replay rejected with 400", crossAccountRes.status === 400);

    // -------------------------------------------------------------------------
    // TEST 7: Happy Path Step 2: Set New Password & Database State Verification
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[CASE 7] Step 2: Update Password & Finalize Reset (Happy Path)${COLOR_RESET}`);
    const step2Res = await callEndpoint(
      verifyOtpHandler,
      "/api/auth/verify-otp",
      {
        email: testUserA.email,
        purpose: AuthPurpose.PASSWORD_RESET,
        resetToken: issuedResetToken,
        newPassword: testUserA.newPassword,
      }
    );
    assertCondition("Step 2 returns 200 without database schema error", step2Res.status === 200);
    assertCondition("Response message matches PASSWORD_RESET_SUCCESS", step2Res.data.message === AUTH_MESSAGES.PASSWORD_RESET_SUCCESS);

    // -------------------------------------------------------------------------
    // TEST 8: Single-Use Token Protection (Replay Prevention)
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[CASE 8] Single-Use Token Replay Prevention${COLOR_RESET}`);
    const replayRes = await callEndpoint(
      verifyOtpHandler,
      "/api/auth/verify-otp",
      {
        email: testUserA.email,
        purpose: AuthPurpose.PASSWORD_RESET,
        resetToken: issuedResetToken,
        newPassword: "AnotherPassword9!",
      }
    );
    assertCondition("Replaying the exact same resetToken is rejected with 400", replayRes.status === 400);
    assertCondition("Error matches RESET_TOKEN_INVALID_OR_EXPIRED", replayRes.data.error === AUTH_MESSAGES.RESET_TOKEN_INVALID_OR_EXPIRED);

    // -------------------------------------------------------------------------
    // TEST 9: Downstream Integration: Supabase Auth Login with New Credentials
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[CASE 9] Downstream Integration: Login Verification${COLOR_RESET}`);
    
    // Old password must be rejected
    const { data: oldLoginData, error: oldLoginErr } = await anonClient.auth.signInWithPassword({
      email: testUserA.email,
      password: testUserA.initialPassword,
    });
    assertCondition("Old password is no longer accepted", !!oldLoginErr);

    // New password must succeed and generate an active JWT session
    const { data: newLoginData, error: newLoginErr } = await anonClient.auth.signInWithPassword({
      email: testUserA.email,
      password: testUserA.newPassword,
    });
    assertCondition("New password logs in successfully", !newLoginErr && !!newLoginData.session);
    assertCondition("JWT Access Token generated", typeof newLoginData.session?.access_token === "string");
    assertCondition("Refresh Token generated", typeof newLoginData.session?.refresh_token === "string");

    // -------------------------------------------------------------------------
    // TEST 10: Database State & Audit Trail Verification
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_YELLOW}[CASE 10] Database State & Audit Trail Side-Effects${COLOR_RESET}`);
    const { data: auditLogs } = await supabase
      .from("auth_audit_logs")
      .select("*")
      .eq("email", testUserA.email)
      .order("created_at", { ascending: true });

    assertCondition("Audit records exist in auth_audit_logs", (auditLogs || []).length >= 1);
    const eventTypes = (auditLogs || []).map((l) => l.event);
    console.log("  Audited events recorded:", eventTypes);
    assertCondition("Audit log recorded OTP_DISPATCHED", eventTypes.includes("OTP_DISPATCHED"));

    console.log(`\n${COLOR_GREEN}${COLOR_BOLD}========================================================================${COLOR_RESET}`);
    console.log(`${COLOR_GREEN}${COLOR_BOLD}   ALL 10 BLACK-BOX CONTROLLER CONTRACT TESTS PASSED PERFECTLY!         ${COLOR_RESET}`);
    console.log(`${COLOR_GREEN}${COLOR_BOLD}========================================================================${COLOR_RESET}`);
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP: Zero Residual Test Pollution
    // -------------------------------------------------------------------------
    console.log(`\n${COLOR_CYAN}[CLEANUP] Purging test fixtures to ensure zero residual pollution...${COLOR_RESET}`);
    try {
      const { data: usersToClean } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      for (const u of usersToClean?.users || []) {
        if (u.email?.includes(`bb.test.alpha.${timestamp}`) || u.email?.includes(`bb.test.beta.${timestamp}`)) {
          await supabase.from("otp_codes").delete().eq("email", u.email);
          await supabase.from("auth_audit_logs").delete().eq("email", u.email);
          await supabase.from("profiles").delete().eq("id", u.id);
          await supabase.auth.admin.deleteUser(u.id);
          console.log(`  Cleaned fixture user: ${u.email}`);
        }
      }
      console.log(`  ${COLOR_GREEN}✓ Cleanup complete.${COLOR_RESET}`);
    } catch (cleanErr: unknown) {
      console.warn("  Cleanup warning:", getErrorMessage(cleanErr));
    }
  }
}

// Self-executing runner
runBlackboxTestSuite().catch((err: unknown) => {
  console.error(`\n${COLOR_RED}Fatal Blackbox Test Failure:${COLOR_RESET}`, err);
  process.exit(1);
});
