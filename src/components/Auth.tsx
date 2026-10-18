"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  KeyRound,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { API_ROUTES, APP_ROUTES } from "@/constants/endpoints";
import ResuMentorBrandLogo from "@/shared/ui/ResuMentorBrandLogo";
import { useBackHandler, dispatchBack } from "@/shared/platform";
import {
  AuthMode,
  AuthPurpose,
  AUTH_MESSAGES,
  AUTH_CONSTANTS,
  AUTH_PATTERNS,
  getErrorMessage,
  cleanEmail as sanitizeEmail,
} from "@/constants/auth";

export { AuthMode };

export interface AuthProps {
  initialMode?: AuthMode;
}

export default function Auth({ initialMode = AuthMode.LOGIN }: AuthProps = {}) {
  const router = useRouter();

  // Mode state: Enforces AuthMode enum per project guidelines
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Sync mode with URL search params if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get("mode") as AuthMode | null;
      if (
        urlMode &&
        Object.values(AuthMode).includes(urlMode)
      ) {
        setMode(urlMode);
      }
    }
  }, []);

  // Form field states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // New password states for password reset mode
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Forgot password & reset state
  const [resetSent, setResetSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [verifiedResetCode, setVerifiedResetCode] = useState("");
  const [resetOtpError, setResetOtpError] = useState<string | null>(null);

  // OTP Verification segmented states
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pendingUserId, setPendingUserId] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [pendingPurpose, setPendingPurpose] = useState<AuthPurpose>(AuthPurpose.EMAIL_VERIFY);
  const [cooldown, setCooldown] = useState(0);

  // Field-specific validation states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Restore pendingEmail from sessionStorage on mount if lost across page refreshes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = sessionStorage.getItem("resumentor_pending_email");
      const savedPurpose = sessionStorage.getItem("resumentor_pending_purpose") as AuthPurpose | null;
      if (savedEmail && !pendingEmail) {
        setPendingEmail(savedEmail);
      }
      if (savedPurpose && Object.values(AuthPurpose).includes(savedPurpose)) {
        setPendingPurpose(savedPurpose);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync pendingEmail and purpose to sessionStorage
  useEffect(() => {
    if (pendingEmail && typeof window !== "undefined") {
      sessionStorage.setItem("resumentor_pending_email", pendingEmail);
      sessionStorage.setItem("resumentor_pending_purpose", pendingPurpose);
    }
  }, [pendingEmail, pendingPurpose]);

  // Register in-screen back navigation for Auth flows (Entry Layer per Implementation Guide)
  useBackHandler("in_screen", () => {
    if (mode === AuthMode.SET_NEW_PASSWORD) {
      setMode(AuthMode.VERIFY_RESET_OTP);
      return true;
    }
    if (mode === AuthMode.VERIFY_RESET_OTP) {
      setMode(AuthMode.FORGOT);
      return true;
    }
    if (mode === AuthMode.FORGOT) {
      setForgotError(null);
      setMode(AuthMode.LOGIN);
      return true;
    }
    if (mode === AuthMode.OTP) {
      setMode(AuthMode.REGISTER);
      return true;
    }
    return false;
  }, [mode]);

  // Focus the first OTP box when entering OTP or reset-password verification mode
  useEffect(() => {
    if (mode === AuthMode.OTP || mode === AuthMode.VERIFY_RESET_OTP || mode === AuthMode.RESET_PASSWORD) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [mode]);

  // Password strength calculations
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const passedCount = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-500", "bg-amber-500", "bg-indigo-500", "bg-emerald-500"];
  const strengthTextColor = ["text-red-600", "text-amber-600", "text-indigo-600", "text-emerald-600"];

  // New Password strength calculations (for password reset)
  const newHasMinLength = newPassword.length >= 8;
  const newHasUppercase = /[A-Z]/.test(newPassword);
  const newHasNumber = /\d/.test(newPassword);
  const newHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const newPassedCount = [newHasMinLength, newHasUppercase, newHasNumber, newHasSpecial].filter(Boolean).length;

  const validateField = (field: string, value: string) => {
    let errorMsg = "";
    const cleanValue = (value || "").trim();

    if (!cleanValue) {
      errorMsg = "This field is required";
    } else {
      if (field === "fullName") {
        if (!/^[a-zA-Z\s]+$/.test(cleanValue)) {
          errorMsg = "Letters and spaces only, no numbers or special characters";
        }
      }
      if (field === "email") {
        if (!/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanValue)) {
          errorMsg = "Please enter a valid email address";
        }
      }
      if (field === "password") {
        if (passedCount < 4) {
          errorMsg = "Please meet all password security requirements";
        }
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (errorMsg) next[field] = errorMsg;
      else delete next[field];
      return next;
    });

    return !errorMsg;
  };

  const handleBlur = (field: string, value: string) => {
    validateField(field, value);
  };

  const handleChange = (
    field: string,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(value);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // --- Segmented OTP Handlers ---
  const handleOtpChange = (index: number, val: string) => {
    const numericChar = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = numericChar;
    setOtpDigits(newDigits);

    if (numericChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || "";
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // --- Login Handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmailValid = validateField("email", email);
    if (!isEmailValid || !password) {
      toast.error(AUTH_MESSAGES.LOGIN_INVALID_DETAILS);
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = sanitizeEmail(email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // If email confirmation is required, automatically dispatch a 6-digit OTP and switch to OTP mode
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setPendingEmail(cleanEmail);
          setPendingPassword(password);
          setPendingPurpose(AuthPurpose.EMAIL_VERIFY);
          setOtpDigits(["", "", "", "", "", ""]);
          setMode(AuthMode.OTP);
          setCooldown(AUTH_CONSTANTS.OTP_COOLDOWN_SECONDS);

          try {
            await fetch(API_ROUTES.AUTH_SEND_OTP, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: cleanEmail,
                purpose: AuthPurpose.EMAIL_VERIFY,
              }),
            });
          } catch (e: unknown) {
            console.warn("[OTP Trigger Notice]:", getErrorMessage(e));
          }

          toast(AUTH_MESSAGES.OTP_SENT_EMAIL_VERIFY, { icon: "✉️" });
          return;
        }
        throw error;
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("resumentor_resume_current");
        localStorage.removeItem("resumentor_resume_revisions");
      }
      toast.success(AUTH_MESSAGES.LOGIN_SUCCESS);
      router.replace(APP_ROUTES.DASHBOARD);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, AUTH_MESSAGES.LOGIN_INVALID_CREDENTIALS));
    } finally {
      setLoading(false);
    }
  };

  // --- Register Handler ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateField("fullName", fullName);
    const isEmailValid = validateField("email", email);
    const isPasswordValid = passedCount === 4;

    if (!isNameValid || !isEmailValid || !isPasswordValid) {
      toast.error("Please satisfy all required fields and password rules.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      const response = await fetch(API_ROUTES.AUTH_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          name: cleanName,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create account.");
      }

      setPendingUserId(result.userId || "");
      setPendingEmail(cleanEmail);
      setPendingPassword(password);
      setPendingName(cleanName);
      setPendingPurpose(AuthPurpose.EMAIL_VERIFY);
      setOtpDigits(["", "", "", "", "", ""]);
      setMode(AuthMode.OTP);
      setCooldown(AUTH_CONSTANTS.OTP_COOLDOWN_SECONDS);
      toast.success("Account created! A 6-digit verification code has been sent to your email.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error creating account."));
    } finally {
      setLoading(false);
    }
  };

  // --- OTP Verification Handler ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      // 1. Verify code with our backend OTP verification API
      let verifiedSuccessfully = false;
      try {
        const response = await fetch(API_ROUTES.AUTH_VERIFY_OTP, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: pendingEmail,
            userId: pendingUserId,
            code,
            purpose: AuthPurpose.EMAIL_VERIFY,
            name: pendingName,
          }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          verifiedSuccessfully = true;
        } else {
          throw new Error(result.error || "Verification failed");
        }
      } catch (err: unknown) {
        // Fallback: try Supabase's native verifyOtp in case token was generated natively
        const fallback = await supabase.auth.verifyOtp({
          email: pendingEmail,
          token: code,
          type: "signup",
        });
        if (!fallback.error) {
          verifiedSuccessfully = true;
        } else {
          throw err;
        }
      }

      if (verifiedSuccessfully) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("resumentor_resume_current");
          localStorage.removeItem("resumentor_resume_revisions");
        }
        // 2. Establish active session with password
        if (pendingPassword) {
          await supabase.auth.signInWithPassword({
            email: pendingEmail,
            password: pendingPassword,
          });
        }
        toast.success("Email verified successfully! Welcome to ResuMentor.");
        router.replace(APP_ROUTES.DASHBOARD);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to verify 6-digit code."));
    } finally {
      setLoading(false);
    }
  };

  // --- Resend OTP Handler ---
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;

    let targetEmail = (pendingEmail || email).trim().toLowerCase();
    if (!targetEmail && typeof window !== "undefined") {
      targetEmail = (sessionStorage.getItem("resumentor_pending_email") || "").trim().toLowerCase();
    }

    if (!targetEmail || !AUTH_PATTERNS.EMAIL.test(targetEmail)) {
      toast.error(AUTH_MESSAGES.EMAIL_INVALID);
      setMode(AuthMode.FORGOT);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.AUTH_RESEND_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          userId: pendingUserId,
          name: pendingName,
          purpose: pendingPurpose,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to resend code.");
      }

      setCooldown(AUTH_CONSTANTS.OTP_COOLDOWN_SECONDS);
      toast.success(`Fresh 6-digit verification code sent to ${targetEmail}!`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to resend code."));
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password Request Handler (Option 2: 6-Digit OTP via SMTP) ---
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setForgotError(null);
    try {
      const response = await fetch(API_ROUTES.AUTH_SEND_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          purpose: AuthPurpose.PASSWORD_RESET,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.error || AUTH_MESSAGES.USER_NOT_FOUND;
        setForgotError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      setPendingEmail(cleanEmail);
      setPendingUserId("");
      setPendingPurpose(AuthPurpose.PASSWORD_RESET);
      setOtpDigits(["", "", "", "", "", ""]);
      setVerifiedResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setResetOtpError(null);
      setCooldown(AUTH_CONSTANTS.OTP_COOLDOWN_SECONDS);
      setMode(AuthMode.VERIFY_RESET_OTP);
      toast.success(AUTH_MESSAGES.OTP_SENT_PASSWORD_RESET);
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, "Failed to send reset email.");
      setForgotError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 1: Verify OTP Handler for Password Reset ---
  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setResetOtpError(null);
    try {
      const response = await fetch(API_ROUTES.AUTH_VERIFY_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          code,
          purpose: AuthPurpose.PASSWORD_RESET,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || AUTH_MESSAGES.OTP_INVALID_CODE);
      }

      // Successfully verified code without consuming it
      setVerifiedResetCode(code);
      setMode(AuthMode.SET_NEW_PASSWORD);
      toast.success("Code verified! Now create your new password.");
    } catch (error: unknown) {
      const msg = getErrorMessage(error, "Failed to verify 6-digit code.");
      setResetOtpError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Set New Password Submit Handler ---
  const handleSetNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToUse = verifiedResetCode || otpDigits.join("");
    if (!codeToUse || codeToUse.length !== 6) {
      toast.error("Verification session expired. Please verify your OTP code again.");
      setMode(AuthMode.VERIFY_RESET_OTP);
      return;
    }

    if (newPassedCount < 4) {
      toast.error(AUTH_MESSAGES.PASSWORD_CRITERIA);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error(AUTH_MESSAGES.PASSWORDS_MISMATCH);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.AUTH_VERIFY_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          code: codeToUse,
          purpose: AuthPurpose.PASSWORD_RESET,
          newPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || AUTH_MESSAGES.PASSWORD_UPDATE_FAILED);
      }

      // Establish session with the newly created password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: pendingEmail,
        password: newPassword,
      });

      if (signInErr) {
        // Password was changed in Supabase, but automatic session creation encountered an error
        toast.success(AUTH_MESSAGES.PASSWORD_UPDATED_PLEASE_LOGIN);
        setMode(AuthMode.LOGIN);
        setEmail(pendingEmail);
        setPassword("");
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("resumentor_resume_current");
        localStorage.removeItem("resumentor_resume_revisions");
      }
      toast.success(AUTH_MESSAGES.PASSWORD_RESET_SUCCESS);
      router.replace(APP_ROUTES.DASHBOARD);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, AUTH_MESSAGES.PASSWORD_UPDATE_FAILED));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 pt-safe pb-safe bg-gradient-to-br from-indigo-50/70 via-slate-50 to-teal-50/40 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md p-7 sm:p-10 rounded-3xl shadow-2xl shadow-indigo-100/50 border border-slate-100/80 transition-all duration-300 relative z-10">
        
        {/* Brand Banner Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <ResuMentorBrandLogo variant="ready" colorScheme="indigo" size={48} showWordmark={true} theme="light" />
          <p className="text-xs font-semibold text-slate-500 mt-2">
            AI-Powered Career &amp; Student Portal
          </p>
        </div>

        {/* SCREEN 1: OTP Verification Screen */}
        {mode === AuthMode.OTP && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-2.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 mb-2">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verify Your Email</h2>
              <p className="text-xs text-slate-500 mt-1">
                We sent a 6-digit verification code to
                <br />
                <span className="font-semibold text-slate-800 break-all">{pendingEmail}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* 6 Segmented Digit Boxes */}
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-2.5 text-center tracking-wider">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-center gap-1.5 sm:gap-2.5 max-w-full">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-150 shrink-0"
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || otpDigits.join("").length !== 6}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition duration-150 disabled:opacity-50 shadow-md shadow-indigo-200 flex items-center justify-center space-x-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{loading ? "Verifying Code..." : "Verify & Continue"}</span>
              </button>
            </form>

            {/* Resend OTP with Cooldown Pill */}
            <div className="mt-5 text-center">
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleResendOtp}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:no-underline inline-flex items-center space-x-1.5 transition min-h-[32px] px-2 rounded-lg"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
                <span>
                  {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Didn't receive code? Resend"}
                </span>
              </button>
            </div>

            {/* Back to Login */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => dispatchBack()}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1.5 transition min-h-[36px]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign Up</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: Forgot Password Screen */}
        {mode === AuthMode.FORGOT && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-2.5 bg-amber-50 border border-amber-100 rounded-full text-amber-600 mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered email address and we&apos;ll send you a secure 6-digit verification code.
              </p>
            </div>

            {/* Prominent Account Not Found / Error Banner */}
            {forgotError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-left animate-fade-in shadow-sm">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-rose-900">Account Not Found</p>
                  <p className="text-rose-700 mt-0.5 leading-relaxed">{forgotError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      setForgotError(null);
                      setMode(AuthMode.REGISTER);
                    }}
                    className="mt-2 font-semibold text-indigo-700 hover:text-indigo-900 underline inline-flex items-center space-x-1"
                  >
                    <span>Create a new account with this email &rarr;</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (forgotError) setForgotError(null);
                  }}
                  required
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 ${
                    forgotError ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-200"
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition duration-150 disabled:opacity-50 text-sm shadow-md shadow-indigo-200"
              >
                {loading ? "Checking Account & Sending Code..." : "Send 6-Digit Code"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotError(null);
                    setMode(AuthMode.LOGIN);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Login</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SCREEN 3A: Step 1 - Verify Password Reset OTP */}
        {(mode === AuthMode.VERIFY_RESET_OTP || mode === AuthMode.RESET_PASSWORD) && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-2.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 mb-2">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verify Reset Code</h2>
              <p className="text-xs text-slate-500 mt-1">
                Step 1 of 2: Enter the 6-digit code sent to
                <br />
                <span className="font-semibold text-slate-800 break-all">{pendingEmail}</span>
              </p>
            </div>

            {/* Inline Error Message */}
            {resetOtpError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2.5 text-left animate-fade-in">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-700 font-medium">{resetOtpError}</p>
              </div>
            )}

            <form onSubmit={handleVerifyResetOtp} className="space-y-4">
              {/* 6 Segmented Digit Boxes */}
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-2 text-center tracking-wider">
                  6-Digit Verification Code
                </label>
                <div className="flex justify-center gap-1.5 sm:gap-2.5 max-w-full">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        handleOtpChange(idx, e.target.value);
                        if (resetOtpError) setResetOtpError(null);
                      }}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-150 shrink-0"
                    />
                  ))}
                </div>
              </div>

              {/* Verify Code Button */}
              <button
                type="submit"
                disabled={loading || otpDigits.join("").length !== 6}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition duration-150 disabled:opacity-50 shadow-md shadow-indigo-200 flex items-center justify-center space-x-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{loading ? "Verifying Code..." : "Verify Code & Proceed"}</span>
              </button>
            </form>

            {/* Resend OTP with Cooldown Pill */}
            <div className="mt-5 text-center">
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleResendOtp}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:no-underline inline-flex items-center space-x-1.5 transition min-h-[32px] px-2 rounded-lg"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
                <span>
                  {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Didn't receive code? Resend"}
                </span>
              </button>
            </div>

            {/* Change Email or Back to Login */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => dispatchBack()}
                className="hover:text-indigo-600 inline-flex items-center space-x-1 transition min-h-[36px]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Change Email</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotError(null);
                  setMode(AuthMode.LOGIN);
                }}
                className="hover:text-slate-800 transition min-h-[36px]"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3B: Step 2 - Create New Password */}
        {mode === AuthMode.SET_NEW_PASSWORD && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-2.5 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-600 mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Create New Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                Step 2 of 2: Code verified! Choose a strong password for
                <br />
                <span className="font-semibold text-slate-800 break-all">{pendingEmail}</span>
              </p>
            </div>

            <form onSubmit={handleSetNewPasswordSubmit} className="space-y-4">
              {/* New Password Input */}
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute top-3.5 right-4 h-5 w-5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Meter & Interactive Requirements */}
                {newPassword.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Strength:</span>
                      <span className={`font-semibold ${newPassedCount > 0 ? strengthTextColor[newPassedCount - 1] : "text-slate-400"}`}>
                        {newPassedCount > 0 ? strengthLabels[newPassedCount - 1] : "Too Weak"}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 transition-all duration-300 ${
                            newPassedCount >= step ? strengthColors[newPassedCount - 1] : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <div className={`flex items-center space-x-1 ${newHasMinLength ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {newHasMinLength ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                        <span>8+ Characters</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${newHasUppercase ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {newHasUppercase ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                        <span>1 Uppercase</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${newHasNumber ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {newHasNumber ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                        <span>1 Number</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${newHasSpecial ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {newHasSpecial ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                        <span>1 Symbol</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password Input */}
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute top-3.5 right-4 h-5 w-5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Match Status */}
                {confirmNewPassword.length > 0 && (
                  <p className={`text-xs ${newPassword === confirmNewPassword ? "text-emerald-600" : "text-rose-500"} font-medium`}>
                    {newPassword === confirmNewPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || newPassedCount < 4 || newPassword !== confirmNewPassword}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition duration-150 disabled:opacity-50 shadow-md shadow-indigo-200 flex items-center justify-center space-x-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{loading ? "Updating Password..." : "Update Password & Sign In"}</span>
              </button>
            </form>

            {/* Back to Previous Step */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => dispatchBack()}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1.5 transition min-h-[36px]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Verify Code</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3 & 4: Login / Sign Up Tabs Screen */}
        {(mode === AuthMode.LOGIN || mode === AuthMode.REGISTER) && (
          <div>
            {/* Segmented Top Tabs */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl mb-6 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setMode(AuthMode.LOGIN);
                  setErrors({});
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  mode === AuthMode.LOGIN
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(AuthMode.REGISTER);
                  setErrors({});
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  mode === AuthMode.REGISTER
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Login Form */}
            {mode === AuthMode.LOGIN && (
              <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
                <div className="relative">
                  <Mail className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => handleChange("email", e.target.value, setEmail)}
                    onBlur={(e) => handleBlur("email", e.target.value)}
                    required
                    autoComplete="username"
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 ${
                      errors.email ? "border-red-500 ring-1 ring-red-200" : "border-slate-200"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3.5 right-4 h-5 w-5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setMode(AuthMode.FORGOT);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition duration-150 disabled:opacity-50 text-sm shadow-md shadow-indigo-200 flex items-center justify-center space-x-2"
                >
                  <span>{loading ? "Signing In..." : "Sign In"}</span>
                </button>
              </form>
            )}

            {/* Register Form */}
            {mode === AuthMode.REGISTER && (
              <form onSubmit={handleRegister} className="space-y-3.5 animate-fade-in">
                <div className="relative">
                  <User className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => handleChange("fullName", e.target.value, setFullName)}
                    onBlur={(e) => handleBlur("fullName", e.target.value)}
                    required
                    autoComplete="name"
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 ${
                      errors.fullName ? "border-red-500 ring-1 ring-red-200" : "border-slate-200"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.fullName}</p>
                  )}
                </div>

                <div className="relative">
                  <Mail className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => handleChange("email", e.target.value, setEmail)}
                    onBlur={(e) => handleBlur("email", e.target.value)}
                    required
                    autoComplete="username"
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 ${
                      errors.email ? "border-red-500 ring-1 ring-red-200" : "border-slate-200"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3.5 right-4 h-5 w-5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Meter & Interactive Requirements */}
                {password.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Strength:</span>
                      <span className={`font-semibold ${passedCount > 0 ? strengthTextColor[passedCount - 1] : "text-slate-400"}`}>
                        {passedCount > 0 ? strengthLabels[passedCount - 1] : "Too Weak"}
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 transition-all duration-300 ${
                            passedCount >= step ? strengthColors[passedCount - 1] : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>

                    {/* 4 Interactive Requirement Pills */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <div className={`flex items-center space-x-1 ${hasMinLength ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {hasMinLength ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                        <span>8+ Characters</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${hasUppercase ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {hasUppercase ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                        <span>1 Uppercase</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${hasNumber ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {hasNumber ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                        <span>1 Number</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${hasSpecial ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {hasSpecial ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                        <span>1 Symbol</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-3.5 right-4 h-5 w-5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition duration-150 disabled:opacity-50 text-sm shadow-md shadow-indigo-200 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{loading ? "Creating Account..." : "Create Account"}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
