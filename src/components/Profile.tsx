"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Camera,
  Trash2,
  Loader2,
  Sparkles,
  Smartphone,
  ChevronRight,
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  CheckCircle2,
} from "lucide-react";
import { processAvatarImage, getInitials } from "../lib/imageUtils";
import { UserData } from "../types/user";
import { UserRole, isUserAdmin } from "@/constants/roles";
import IntroScreens from "./mobile/IntroScreens";
import {
  getErrorMessage,
  AUTH_MESSAGES,
  AUTH_PATTERNS,
  AUTH_CONSTANTS,
  MobileProfileTab,
} from "@/constants/auth";
import { useStatusBarStyle, AppStatusBarStyle } from "@/shared/platform";

interface ProfileProps {
  userData: UserData | null;
  onUpdateUserData: (data: UserData) => void;
}

export default function Profile({ userData, onUpdateUserData }: ProfileProps) {
  const [showTourModal, setShowTourModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileProfileTab>(MobileProfileTab.ACCOUNT);
  // Light surface → dark icons on status bar
  useStatusBarStyle(AppStatusBarStyle.DARK_CONTENT);

  // Form field states
  const [fullName, setFullName] = useState(userData?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading states
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (userData?.name) {
      setFullName(userData.name);
    }
  }, [userData]);

  const validateField = (field: string, value: string): boolean => {
    let errorMsg = "";
    const cleanValue = (value || "").trim();

    if (!cleanValue) {
      errorMsg = AUTH_MESSAGES.FIELD_REQUIRED;
    } else {
      if (field === "fullName") {
        if (!AUTH_PATTERNS.LETTERS_AND_SPACES.test(cleanValue)) {
          errorMsg = AUTH_MESSAGES.NAME_INVALID;
        }
      }
      if (field === "newPassword") {
        const hasUppercase = /[A-Z]/.test(cleanValue);
        const hasNumber = /\d/.test(cleanValue);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(cleanValue);
        if (
          cleanValue.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH ||
          !hasUppercase ||
          !hasNumber ||
          !hasSpecial
        ) {
          errorMsg = AUTH_MESSAGES.PASSWORD_CRITERIA;
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateField("fullName", fullName);
    if (!isNameValid) {
      toast.error(errors.fullName || AUTH_MESSAGES.NAME_INVALID);
      return;
    }

    setUpdatingProfile(true);
    try {
      const isGuest = !userData?.id || userData.id === "guest-user" || userData.id.startsWith("guest-");
      const cleanName = fullName.trim();

      if (isGuest) {
        onUpdateUserData({
          ...(userData || {
            id: "guest-user",
            email: "guest@resumentor.app",
            photoURL: "",
            role: UserRole.STUDENT,
          }),
          name: cleanName,
        });
        toast.success("Profile name updated successfully (Guest Mode)!");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You are not logged in.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: cleanName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { name: cleanName, full_name: cleanName },
      });

      onUpdateUserData({ ...userData, name: cleanName });
      toast.success("Profile name updated successfully!");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update profile name."));
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const isGuest = !userData?.id || userData.id === "guest-user" || userData.id.startsWith("guest-");
      const compressedDataUrl = await processAvatarImage(file, 256, 0.85);

      if (isGuest) {
        onUpdateUserData({
          ...(userData || {
            id: "guest-user",
            email: "guest@resumentor.app",
            photoURL: "",
            role: UserRole.STUDENT,
          }),
          photoURL: compressedDataUrl,
        });
        toast.success("Profile photo updated successfully (Guest Mode)!");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to update your profile photo.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          photo_url: compressedDataUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { avatar_url: compressedDataUrl },
      });

      onUpdateUserData({ ...userData, photoURL: compressedDataUrl });
      toast.success("Profile photo updated successfully!");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to process and upload profile image."));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (mobileFileInputRef.current) {
        mobileFileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const isGuest = !userData?.id || userData.id === "guest-user" || userData.id.startsWith("guest-");
      if (isGuest) {
        onUpdateUserData({
          ...(userData || {
            id: "guest-user",
            email: "guest@resumentor.app",
            photoURL: "",
            role: UserRole.STUDENT,
          }),
          photoURL: "",
        });
        toast.success("Profile photo removed.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          photo_url: "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { avatar_url: "" },
      });

      onUpdateUserData({ ...userData, photoURL: "" });
      toast.success("Profile photo removed.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to remove photo."));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const isGuest = !userData?.id || userData.id === "guest-user" || userData.id.startsWith("guest-");
    if (isGuest) {
      toast.error("Password change is not available in Guest mode. Please create an account to secure your profile.");
      return;
    }
    if (!currentPassword) {
      toast.error(AUTH_MESSAGES.CURRENT_PASSWORD_REQUIRED);
      return;
    }
    const isPasswordValid = validateField("newPassword", newPassword);
    if (!isPasswordValid) {
      toast.error(AUTH_MESSAGES.PASSWORD_CRITERIA);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(AUTH_MESSAGES.PASSWORDS_MISMATCH);
      return;
    }

    setUpdatingPassword(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("You must be logged in to update your password.");
        return;
      }

      // Verify current password first
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyErr) {
        throw new Error(AUTH_MESSAGES.CURRENT_PASSWORD_INCORRECT);
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success(AUTH_MESSAGES.PASSWORD_CHANGED_SUCCESS);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, AUTH_MESSAGES.PASSWORD_UPDATE_FAILED));
    } finally {
      setUpdatingPassword(false);
    }
  };

  const rawCreatedAt = userData?.created_at || userData?.createdAt;
  const parsedCreatedAt =
    typeof rawCreatedAt === "string" || typeof rawCreatedAt === "number"
      ? new Date(rawCreatedAt)
      : rawCreatedAt && typeof rawCreatedAt === "object" && "seconds" in rawCreatedAt
      ? new Date((rawCreatedAt as { seconds: number }).seconds * 1000)
      : new Date();

  const enrollmentDateStr = parsedCreatedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const userDisplayName = userData?.name || "Student";
  const avatarInitials = getInitials(userDisplayName);

  // Interactive password criteria evaluation
  const newHasMinLength = newPassword.length >= AUTH_CONSTANTS.PASSWORD_MIN_LENGTH;
  const newHasUppercase = /[A-Z]/.test(newPassword);
  const newHasNumber = /\d/.test(newPassword);
  const newHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

  return (
    <div className="w-full">
      {/* ============================================================== */}
      {/* 1. DESKTOP / WEBSITE LAYOUT (Hidden on mobile, 3-column grid) */}
      {/* ============================================================== */}
      <div className="hidden md:grid md:grid-cols-3 gap-8">
        {/* Left Column: Editable Information & Password Forms */}
        <div className="md:col-span-2 space-y-8">
          {/* Card 1: Personal Details */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Profile Information</h2>
                <p className="text-sm text-gray-500 mt-1">Update your personal details here.</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => handleChange("fullName", e.target.value, setFullName)}
                  onBlur={(e) => handleBlur("fullName", e.target.value)}
                  className={`mt-1 block w-full border rounded-md shadow-xs py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${
                    errors.fullName ? "border-red-500 ring-1 ring-red-200" : "border-gray-300"
                  }`}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.fullName}</p>
                )}
              </div>
              <div>
                <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="emailAddress"
                  autoComplete="username"
                  value={userData?.email || ""}
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs py-2 px-3 bg-gray-100 text-gray-500 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div className="pt-2 text-right">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{updatingProfile ? "Updating..." : "Update Profile"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Password Management */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
                <p className="text-sm text-gray-500 mt-1">
                  For your security, we recommend using a strong password.
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
            </div>
            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-xs py-2 pl-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => handleChange("newPassword", e.target.value, setNewPassword)}
                    onBlur={(e) => handleBlur("newPassword", e.target.value)}
                    className={`block w-full border rounded-md shadow-xs py-2 pl-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${
                      errors.newPassword ? "border-red-500 ring-1 ring-red-200" : "border-gray-300"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.newPassword}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-xs py-2 pl-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="pt-2 text-right">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{updatingPassword ? "Changing..." : "Change Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: User Avatar & Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md text-center border border-gray-100">
            {/* Avatar Container with Upload Trigger */}
            <div className="relative group mx-auto h-28 w-28 rounded-full">
              {userData?.photoURL ? (
                <img
                  className="h-28 w-28 rounded-full ring-4 ring-indigo-200 mx-auto object-cover shadow-xs"
                  src={userData.photoURL}
                  alt={`${userDisplayName}'s profile avatar`}
                />
              ) : (
                <div className="h-28 w-28 rounded-full ring-4 ring-indigo-200 mx-auto bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-xs tracking-wider">
                  {avatarInitials}
                </div>
              )}

              {/* Hover overlay with Camera action */}
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile photo"
                className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[2px] cursor-pointer disabled:cursor-not-allowed"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-white mb-1" />
                    <span className="text-[11px] font-semibold tracking-wide">Change</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarFileSelected}
              />
            </div>

            {/* Action buttons below avatar */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
                {userData?.photoURL ? "Change Photo" : "Upload Photo"}
              </button>

              {userData?.photoURL && (
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={handleRemoveAvatar}
                  title="Remove photo"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-full transition disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>

            <h3 className="mt-4 text-xl font-bold text-gray-900">{userDisplayName}</h3>
            <p className="text-sm text-gray-500 break-all">{userData?.email || ""}</p>
            <div className="mt-2.5">
              <span
                className={`inline-block text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full ${
                  isUserAdmin(userData?.role, userData?.email)
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : userData?.role === UserRole.CANDIDATE
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                }`}
              >
                Role: {isUserAdmin(userData?.role, userData?.email) ? "Super Admin" : (userData?.role || "Student")}
              </span>
            </div>
            <div className="mt-6 text-left space-y-3 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <strong>Enrolled Since:</strong> {enrollmentDateStr}
              </p>
            </div>
          </div>

          {/* App Tour & Guide Card */}
          <div className="bg-white p-6 rounded-xl shadow-md text-left border border-gray-100">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">App Tour &amp; Guide</h4>
                <p className="text-[11px] text-gray-500">Learn how ResuMentor powers your career</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-4 mt-2">
              Replay the introductory walkthrough to discover how the AI Resume Builder, Mock
              Interview Coach, and Scholarships work.
            </p>

            <button
              type="button"
              onClick={() => setShowTourModal(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 rounded-xl font-bold text-xs border border-indigo-150 transition active:scale-[0.98] min-h-[48px]"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-indigo-600" />
                <span>Replay App Tour</span>
              </div>
              <ChevronRight className="h-4 w-4 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DEDICATED MOBILE LAYOUT (Active on mobile screens < 768px)   */}
      {/* ============================================================== */}
      <div className="block md:hidden space-y-3 pb-28">
        {/* Mobile Hero Profile Card: Avatar, Name, Email, Role at Top */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 text-center relative overflow-hidden">
          <div className="relative mx-auto h-24 w-24 rounded-full mb-3">
            {userData?.photoURL ? (
              <img
                className="h-24 w-24 rounded-full ring-3 ring-indigo-200 mx-auto object-cover shadow-xs"
                src={userData.photoURL}
                alt={`${userDisplayName}'s mobile profile avatar`}
              />
            ) : (
              <div className="h-24 w-24 rounded-full ring-3 ring-indigo-200 mx-auto bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-xs tracking-wider">
                {avatarInitials}
              </div>
            )}

            {/* Camera Edit Badge */}
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => mobileFileInputRef.current?.click()}
              aria-label="Upload profile photo"
              className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md border-2 border-white transition active:scale-90"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>

            <input
              ref={mobileFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarFileSelected}
            />
          </div>

          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{userDisplayName}</h3>
          <p className="text-xs text-slate-500 break-all mt-0.5">{userData?.email || ""}</p>

          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                isUserAdmin(userData?.role, userData?.email)
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : userData?.role === UserRole.CANDIDATE
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
              }`}
            >
              Role: {isUserAdmin(userData?.role, userData?.email) ? "Super Admin" : (userData?.role || "Student")}
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              Joined {enrollmentDateStr}
            </span>
          </div>
        </div>

        {/* Mobile Segmented Navigation Bar (Switch between Account, Security, Tour) */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setMobileTab(MobileProfileTab.ACCOUNT)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
              mobileTab === MobileProfileTab.ACCOUNT
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Account</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab(MobileProfileTab.SECURITY)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
              mobileTab === MobileProfileTab.SECURITY
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Security</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab(MobileProfileTab.PREFERENCES)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
              mobileTab === MobileProfileTab.PREFERENCES
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>App Tour</span>
          </button>
        </div>

        {/* Mobile Section 1: Account Information */}
        {mobileTab === MobileProfileTab.ACCOUNT && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="h-4 w-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-800">Account Details</h4>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-3.5">
              <div>
                <label htmlFor="mobileFullName" className="block text-xs font-semibold text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="mobileFullName"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => handleChange("fullName", e.target.value, setFullName)}
                  onBlur={(e) => handleBlur("fullName", e.target.value)}
                  className={`w-full py-2.5 px-3 border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 ${
                    errors.fullName ? "border-red-500 ring-1 ring-red-200" : "border-slate-200"
                  }`}
                  placeholder="Your full name"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="mobileEmail" className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="mobileEmail"
                  autoComplete="username"
                  value={userData?.email || ""}
                  disabled
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-slate-500 text-sm bg-slate-100 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Email address is verified and permanently linked to your profile.
                </p>
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full mt-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition duration-150 disabled:opacity-50 text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{updatingProfile ? "Saving Changes..." : "Save Profile Changes"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Mobile Section 2: Dedicated Password & Security */}
        {mobileTab === MobileProfileTab.SECURITY && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Lock className="h-4 w-4 text-purple-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Change Password</h4>
                <p className="text-[11px] text-slate-500">Update your account credentials safely</p>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-3.5">
              <div>
                <label
                  htmlFor="mobileCurrentPassword"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="mobileCurrentPassword"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full py-2.5 pl-3 pr-10 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="mobileNewPassword"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="mobileNewPassword"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => handleChange("newPassword", e.target.value, setNewPassword)}
                    onBlur={(e) => handleBlur("newPassword", e.target.value)}
                    className={`w-full py-2.5 pl-3 pr-10 border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 ${
                      errors.newPassword ? "border-red-500 ring-1 ring-red-200" : "border-slate-200"
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.newPassword}</p>
                )}

                {/* Password Criteria Checklist */}
                {newPassword.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px]">
                    <div
                      className={`flex items-center space-x-1 ${
                        newHasMinLength ? "text-emerald-600 font-semibold" : "text-slate-400"
                      }`}
                    >
                      {newHasMinLength ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                      <span>8+ Chars</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        newHasUppercase ? "text-emerald-600 font-semibold" : "text-slate-400"
                      }`}
                    >
                      {newHasUppercase ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                      <span>Uppercase</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        newHasNumber ? "text-emerald-600 font-semibold" : "text-slate-400"
                      }`}
                    >
                      {newHasNumber ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                      <span>1 Number</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        newHasSpecial ? "text-emerald-600 font-semibold" : "text-slate-400"
                      }`}
                    >
                      {newHasSpecial ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">•</span>}
                      <span>1 Symbol</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="mobileConfirmPassword"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="mobileConfirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-2.5 pl-3 pr-10 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p
                    className={`text-xs mt-1 font-medium ${
                      newPassword === confirmPassword ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {newPassword === confirmPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full mt-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition duration-150 disabled:opacity-50 text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{updatingPassword ? "Updating Password..." : "Update Password"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Mobile Section 3: App Tour & Preferences */}
        {mobileTab === MobileProfileTab.PREFERENCES && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">App Tour &amp; Guide</h4>
                <p className="text-[11px] text-slate-500">Walkthrough features and tools</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Replay the full onboarding tour to explore the AI Resume Builder, AI Mock Interview
              Coach, and Scholarship Matcher.
            </p>

            <button
              type="button"
              onClick={() => setShowTourModal(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 rounded-xl font-bold text-xs border border-indigo-150 transition active:scale-[0.98] min-h-[48px]"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-indigo-600" />
                <span>Replay Walkthrough</span>
              </div>
              <ChevronRight className="h-4 w-4 text-indigo-400" />
            </button>
          </div>
        )}
      </div>

      {/* Shared Replayable Full Screen Tour Modal */}
      {showTourModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center animate-fade-in">
          <div className="w-full max-w-md h-full md:h-[88vh] md:max-h-[760px] bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
            <IntroScreens isReplayModal onCloseModal={() => setShowTourModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
