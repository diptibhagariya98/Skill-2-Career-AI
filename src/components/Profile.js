"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { Calendar } from "lucide-react";

export default function Profile({ userData, onUpdateUserData }) {
  const [fullName, setFullName] = useState(userData?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userData?.name) {
      setFullName(userData.name);
    }
  }, [userData]);

  const validateField = (field, value) => {
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

  const handleBlur = (field, value) => {
    validateField(field, value);
  };

  const handleChange = (field, value, setter) => {
    setter(value);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      toast.error("You are not logged in.");
      return;
    }
    const isNameValid = validateField("fullName", fullName);
    if (!isNameValid) {
      toast.error("Please provide a valid full name.");
      return;
    }
    setUpdatingProfile(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: fullName,
      });
      onUpdateUserData({ ...userData, name: fullName });
      toast.success("Profile name updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile name.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      toast.error("You are not logged in.");
      return;
    }
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
      await updatePassword(user, newPassword);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(
        error.message || "Failed to change password. Sensitive actions may require you to re-authenticate."
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  const enrollmentDateStr = auth.currentUser?.metadata?.creationTime
    ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "Nov 01, 2025";

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
                value={auth.currentUser?.email || ""}
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
          <img
            className="h-24 w-24 rounded-full ring-4 ring-indigo-200 mx-auto object-cover"
            src="/Images/Photo.png"
            alt="Student avatar"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256";
            }}
          />
          <h3 className="mt-4 text-xl font-bold text-gray-900">{userData?.name || "Saikiran"}</h3>
          <p className="text-sm text-gray-500">{auth.currentUser?.email || "saikiran@bmu.edu.in"}</p>
          <div className="mt-6 text-left space-y-3 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <strong>Enrolled Since:</strong> {enrollmentDateStr}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
