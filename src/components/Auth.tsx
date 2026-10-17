"use client";

import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { GraduationCap, Mail, Lock, Eye, EyeOff, User } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field-specific validation states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
          errorMsg = "Email is invalid. Only @, _, ., - are allowed as special characters";
        }
      }
      if (field === "password") {
        const hasUppercase = /[A-Z]/.test(cleanValue);
        const hasNumber = /\d/.test(cleanValue);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(cleanValue);
        if (cleanValue.length < 8 || !hasUppercase || !hasNumber || !hasSpecial) {
          errorMsg = "Min 8 chars, at least 1 uppercase, 1 number, and 1 special character";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmailValid = validateField("email", email);
    if (!isEmailValid || !password) {
      toast.error("Please provide valid login details.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Successfully logged in!");
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateField("fullName", fullName);
    const isEmailValid = validateField("email", email);
    const isPasswordValid = validateField("password", password);

    if (!isNameValid || !isEmailValid || !isPasswordValid) {
      toast.error("Please fix form errors first.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: fullName,
        email: user.email,
        createdAt: new Date().toISOString(),
      });

      await updateProfile(user, { displayName: fullName });

      toast.success("Registration successful! Logging you in...");
    } catch (error: any) {
      toast.error(error.message || "Error creating account.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address in the input field first.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      {isLogin ? (
        <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-2xl shadow-xl animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <GraduationCap className="h-12 w-12 text-indigo-600" />
            <h1 className="ml-4 text-3xl font-bold text-gray-800">ResuMentor</h1>
          </div>
          <h2 className="text-2xl font-bold text-center mb-1 text-gray-900">Welcome Back!</h2>
          <p className="text-center text-gray-500 mb-8">Please login to access your portal.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute top-3.5 left-4 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Enter email id"
                value={email}
                onChange={(e) => handleChange("email", e.target.value, setEmail)}
                onBlur={(e) => handleBlur("email", e.target.value)}
                required
                className={`w-full pl-12 pr-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.email ? "border-red-500 ring-1 ring-red-200" : "border-gray-300"
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
            </div>

            <div className="relative">
              <Lock className="absolute top-3.5 left-4 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3.5 right-4 h-5 w-5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-semibold text-indigo-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8 font-medium">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => {
                setIsLogin(false);
                setShowPassword(false);
                setErrors({});
              }}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-2xl shadow-xl animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <GraduationCap className="h-12 w-12 text-indigo-600" />
            <h1 className="ml-4 text-3xl font-bold text-gray-800">ResuMentor</h1>
          </div>
          <h2 className="text-2xl font-bold text-center mb-1 text-gray-900">Create an Account</h2>
          <p className="text-center text-gray-500 mb-8">Get started on your career journey today.</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <User className="absolute top-3.5 left-4 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => handleChange("fullName", e.target.value, setFullName)}
                onBlur={(e) => handleBlur("fullName", e.target.value)}
                required
                className={`w-full pl-12 pr-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.fullName ? "border-red-500 ring-1 ring-red-200" : "border-gray-300"
                }`}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.fullName}</p>}
            </div>

            <div className="relative">
              <Mail className="absolute top-3.5 left-4 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => handleChange("email", e.target.value, setEmail)}
                onBlur={(e) => handleBlur("email", e.target.value)}
                required
                className={`w-full pl-12 pr-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.email ? "border-red-500 ring-1 ring-red-200" : "border-gray-300"
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
            </div>

            <div className="relative">
              <Lock className="absolute top-3.5 left-4 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => handleChange("password", e.target.value, setPassword)}
                onBlur={(e) => handleBlur("password", e.target.value)}
                required
                className={`w-full pl-12 pr-12 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.password ? "border-red-500 ring-1 ring-red-200" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3.5 right-4 h-5 w-5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password}</p>}
            </div>

            <div className="relative">
              <Lock className="absolute top-3.5 left-4 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-3.5 right-4 h-5 w-5 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8 font-medium">
            Already have an account?{" "}
            <button
              onClick={() => {
                setIsLogin(true);
                setShowPassword(false);
                setErrors({});
              }}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
