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
} from "lucide-react";
import { APP_ROUTES } from "@/constants/endpoints";

type AuthMode = "login" | "register" | "otp" | "forgot";

export default function Auth() {
  const router = useRouter();

  // Mode state: 'login' | 'register' | 'otp' | 'forgot'
  const [mode, setMode] = useState<AuthMode>("login");

  // Form field states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password reset sent state
  const [resetSent, setResetSent] = useState(false);

  // OTP Verification segmented states
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pendingUserId, setPendingUserId] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Field-specific validation states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus the first OTP box when entering OTP mode
  useEffect(() => {
    if (mode === "otp") {
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
      toast.error("Please provide valid login details.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // If email confirmation is required in Supabase, switch to OTP verification mode
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setPendingEmail(cleanEmail);
          setOtpDigits(["", "", "", "", "", ""]);
          setMode("otp");
          setCooldown(60);
          await supabase.auth.resend({
            type: "signup",
            email: cleanEmail,
          });
          toast("Please verify your 6-digit email code to continue.", { icon: "✉️" });
          return;
        }
        throw error;
      }

      toast.success("Successfully logged in!");
      router.replace(APP_ROUTES.DASHBOARD);
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password.");
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

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            full_name: cleanName,
          },
        },
      });

      if (error) throw error;

      // If user requires email verification:
      if (data.user && !data.session) {
        setPendingUserId(data.user.id);
        setPendingEmail(cleanEmail);
        setPendingName(cleanName);
        setOtpDigits(["", "", "", "", "", ""]);
        setMode("otp");
        setCooldown(60);
        toast.success("Account created! A 6-digit code has been sent to your email.");
      } else {
        // Automatically verified / logged in
        toast.success("Account created successfully!");
        router.replace(APP_ROUTES.DASHBOARD);
      }
    } catch (error: any) {
      toast.error(error.message || "Error creating account.");
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
      // 1. Try signup OTP confirmation
      let { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: code,
        type: "signup",
      });

      // 2. If not signup, try generic email OTP (recovery / magiclink)
      if (error) {
        const fallback = await supabase.auth.verifyOtp({
          email: pendingEmail,
          token: code,
          type: "email",
        });
        if (!fallback.error) {
          data = fallback.data;
          error = null;
        }
      }

      if (error) throw error;

      toast.success("Email verified successfully! Welcome to ResuMentor.");
      router.replace(APP_ROUTES.DASHBOARD);
    } catch (error: any) {
      toast.error(error.message || "Failed to verify 6-digit code.");
    } finally {
      setLoading(false);
    }
  };

  // --- Resend OTP Handler ---
  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
      });

      if (error) throw error;

      setCooldown(60);
      toast.success("New 6-digit code sent to your email!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password Handler ---
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth?mode=reset` : undefined,
      });

      if (error) throw error;

      setResetSent(true);
      toast.success("Password reset instructions dispatched!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email.");
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-indigo-600 text-white p-3 rounded-2xl shadow-md shadow-indigo-200 mb-3">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ResuMentor
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            AI-Powered Career &amp; Student Portal
          </p>
        </div>

        {/* =========================================================================
            SCREEN 1: OTP Verification Screen
            ========================================================================= */}
        {mode === "otp" && (
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
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:no-underline inline-flex items-center space-x-1.5 transition"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${cooldown > 0 ? "animate-spin" : ""}`} />
                <span>
                  {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Didn't receive code? Resend"}
                </span>
              </button>
            </div>

            {/* Back to Login */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1.5 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Login</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 2: Forgot Password Screen
            ========================================================================= */}
        {mode === "forgot" && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-2.5 bg-amber-50 border border-amber-100 rounded-full text-amber-600 mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered email address and we&apos;ll send you recovery instructions.
              </p>
            </div>

            {resetSent ? (
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Check Your Inbox</h3>
                <p className="text-xs text-slate-500 px-4">
                  We&apos;ve sent password reset instructions to <strong className="text-slate-700">{email}</strong>.
                  Please check your spam or junk folder if you don&apos;t see it shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResetSent(false);
                    setMode("login");
                  }}
                  className="w-full mt-4 bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition text-sm"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition duration-150 disabled:opacity-50 text-sm shadow-md shadow-indigo-200"
                >
                  {loading ? "Sending link..." : "Send Recovery Link"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1 transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Login</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* =========================================================================
            SCREEN 3 & 4: Login / Sign Up Tabs Screen
            ========================================================================= */}
        {(mode === "login" || mode === "register") && (
          <div>
            {/* Segmented Top Tabs */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl mb-6 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrors({});
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  mode === "login"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrors({});
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  mode === "register"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Login Form */}
            {mode === "login" && (
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
                      setMode("forgot");
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
            {mode === "register" && (
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
