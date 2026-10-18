"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Calendar, Camera, Trash2, Loader2, Sparkles, Smartphone, ChevronRight } from "lucide-react";
import { processAvatarImage, getInitials } from "../lib/imageUtils";
import { UserData } from "../types/user";
import IntroScreens from "./mobile/IntroScreens";

interface ProfileProps {
  userData: UserData | null;
  onUpdateUserData: (data: UserData) => void;
}

export default function Profile({ userData, onUpdateUserData }: ProfileProps) {
  const [showTourModal, setShowTourModal] = useState(false);
  const [fullName, setFullName] = useState(userData?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (userData?.name) {
      setFullName(userData.name);
    }
  }, [userData]);

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
      if (field === "newPassword") {
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateField("fullName", fullName);
    if (!isNameValid) {
      toast.error("Please provide a valid full name.");
      return;
    }

    setUpdatingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You are not logged in.");
        return;
      }

      const cleanName = fullName.trim();
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
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile name.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to update your profile photo.");
        return;
      }

      const compressedDataUrl = await processAvatarImage(file, 256, 0.85);

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
    } catch (err: any) {
      toast.error(err.message || "Failed to process and upload profile image.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
    } catch (err: any) {
      toast.error(err.message || "Failed to remove photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPasswordValid = validateField("newPassword", newPassword);
    if (!isPasswordValid) {
      toast.error("Please enter a valid strong password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(
        error.message || "Failed to change password. You may need to log in again."
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  const enrollmentDateStr = (userData?.created_at || userData?.createdAt)
    ? new Date(userData.created_at || userData.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });

  const userDisplayName = userData?.name || "Student";
  const avatarInitials = getInitials(userDisplayName);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Profile Information</h2>
            <p className="text-sm text-gray-500 mt-1">Update your personal details here.</p>
          </div>
          <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => handleChange("fullName", e.target.value, setFullName)}
                onBlur={(e) => handleBlur("fullName", e.target.value)}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${
                  errors.fullName ? "border-red-500 ring-1 ring-red-200" : "border-gray-300"
                }`}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.fullName}</p>}
            </div>
            <div>
              <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="emailAddress"
                value={userData?.email || ""}
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 focus:outline-none cursor-not-allowed"
              />
            </div>
            <div className="pt-2 text-right">
              <button
                type="submit"
                disabled={updatingProfile}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {updatingProfile ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
            <p className="text-sm text-gray-500 mt-1">For your security, we recommend using a strong password.</p>
          </div>
          <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value, setNewPassword)}
                onBlur={(e) => handleBlur("newPassword", e.target.value)}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${
                  errors.newPassword ? "border-red-500 ring-1 ring-red-200" : "border-gray-300"
                }`}
                placeholder="••••••••"
              />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.newPassword}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="••••••••"
              />
            </div>
            <div className="pt-2 text-right">
              <button
                type="submit"
                disabled={updatingPassword}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {updatingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          {/* Avatar Container with Upload Trigger */}
          <div className="relative group mx-auto h-28 w-28 rounded-full">
            {userData?.photoURL ? (
              <img
                className="h-28 w-28 rounded-full ring-4 ring-indigo-200 mx-auto object-cover shadow-sm"
                src={userData.photoURL}
                alt={`${userDisplayName}'s profile avatar`}
              />
            ) : (
              <div className="h-28 w-28 rounded-full ring-4 ring-indigo-200 mx-auto bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-sm tracking-wider">
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

            {/* Hidden file input */}
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
                userData?.role === "admin"
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : userData?.role === "candidate"
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
              }`}
            >
              Role: {userData?.role || "Student"}
            </span>
          </div>
          <div className="mt-6 text-left space-y-3 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <strong>Enrolled Since:</strong> {enrollmentDateStr}
            </p>
          </div>
        </div>

        {/* App Tour & Mobile Features Card */}
        <div className="mt-6 bg-white p-6 rounded-xl shadow-md text-left">
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
            Replay the introductory walkthrough to discover how the AI Resume Builder, Mock Interview Coach, and Scholarships work.
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

      {/* Replayable Full Screen Tour Modal */}
      {showTourModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center animate-fade-in">
          <div className="w-full max-w-md h-full md:h-[88vh] md:max-h-[760px] bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
            <IntroScreens
              isReplayModal
              onCloseModal={() => setShowTourModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
