"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import {
  GraduationCap,
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  MessageSquare,
  Award,
  BookOpen,
  LogOut,
  WifiOff,
  Wifi,
} from "lucide-react";

// Sub-components
import Profile from "./Profile";
import ResumeBuilder from "./ResumeBuilder";
import JobFinder from "./JobFinder";
import AIInterview from "./AIInterview";
import Scholarships from "./Scholarships";
import LearnPractice from "./LearnPractice";
import { UserData } from "../types/user";
import { getInitials } from "../lib/imageUtils";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [greeting, setGreeting] = useState("Good Day");
  const [loading, setLoading] = useState(true);
  const { isOnline, wasOffline } = useNetworkStatus();

  // Fetch Firestore user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          setUserData({ name: user.displayName || "Student", email: user.email || "" });
        }
      } catch (error) {
        // user profile fetch error
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Successfully logged out!");
    } catch (error) {
      toast.error("Error logging out.");
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "resume", label: "Resume Builder", icon: FileText },
    { id: "scholarships", label: "Scholarships", icon: Award },
    { id: "learn", label: "Practice Hub", icon: BookOpen },
    { id: "jobs", label: "Job Finder", icon: Briefcase },
    { id: "interview", label: "AI Interview", icon: MessageSquare },
    { id: "profile", label: "Profile", icon: User },
  ];

  // Mobile Bottom Navigation items (5 key touch destinations)
  const mobileNavItems = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "resume", label: "Resume", icon: FileText },
    { id: "scholarships", label: "Grants", icon: Award },
    { id: "learn", label: "Practice", icon: BookOpen },
    { id: "profile", label: "Profile", icon: User },
  ];

  const getPageTitle = () => {
    switch (activePage) {
      case "dashboard":
        return "Dashboard";
      case "profile":
        return "Profile Settings";
      case "resume":
        return "Resume Builder";
      case "jobs":
        return "Job Finder";
      case "interview":
        return "AI Interview Practice";
      case "scholarships":
        return "Scholarships";
      case "learn":
        return "Learn & Practice";
      default:
        return "Dashboard";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-500 font-semibold text-sm">Loading ResuMentor...</p>
        </div>
      </div>
    );
  }

  const displayName = userData?.name || auth.currentUser?.displayName || "Student";
  const initials = getInitials(displayName);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Floating Offline / Online Status Pill */}
      {!isOnline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-amber-300 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-amber-500/30 flex items-center gap-2 animate-bounce">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Offline Mode • Resume & Quizzes work 100% locally</span>
        </div>
      )}

      {isOnline && wasOffline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/90 text-emerald-200 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-emerald-500/30 flex items-center gap-2 animate-fade-in">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>Back Online • Cloud Sync Active</span>
        </div>
      )}

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-white shadow-md flex-shrink-0 flex-col border-r border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center cursor-pointer" onClick={() => setActivePage("dashboard")}>
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            <span className="ml-3 font-bold text-xl text-gray-900">ResuMentor</span>
          </div>
        </div>

        <nav className="mt-4 flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-150 font-medium ${
                  isActive
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-100"
                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                <IconComponent className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-semibold text-red-500 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-150"
          >
            <LogOut className="mr-3 h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 overflow-y-auto max-h-screen">
        {/* Mobile Top App Header */}
        <header className="flex justify-between items-center mb-6 md:mb-8 border-b pb-4 border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="md:hidden flex items-center cursor-pointer" onClick={() => setActivePage("dashboard")}>
              <GraduationCap className="h-7 w-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <span className="block font-bold text-gray-800 text-sm">{displayName}</span>
              <span className="block text-xs text-gray-400 font-medium">{auth.currentUser?.email}</span>
            </div>
            {userData?.photoURL ? (
              <img
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-offset-2 ring-indigo-400 object-cover cursor-pointer hover:opacity-90 transition shadow-sm"
                src={userData.photoURL}
                alt={`${displayName}'s avatar`}
                title="View Profile Settings"
                onClick={() => setActivePage("profile")}
              />
            ) : (
              <div
                onClick={() => setActivePage("profile")}
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-offset-2 ring-indigo-400 bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-90 transition shadow-sm tracking-wide"
                title="View Profile Settings"
              >
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Content Views */}
        <div className="animate-fade-in">
          {activePage === "dashboard" && (
            <div className="space-y-6">
              {/* Greeting Card */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-indigo-700">
                <h2 className="text-2xl sm:text-3xl font-bold">{greeting}, {displayName}!</h2>
                <p className="mt-2 opacity-90 text-xs sm:text-sm font-medium leading-relaxed">
                  Welcome to ResuMentor. Build offline resumes, check verified scholarships, and practice mock tests seamlessly on mobile.
                </p>
              </div>

              {/* Mobile Quick Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-6 pt-2">
                <div
                  onClick={() => setActivePage("resume")}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-500 transition-all active:scale-[0.98]"
                >
                  <FileText className="h-7 w-7 text-indigo-500 mb-2" />
                  <h3 className="font-bold text-sm sm:text-base text-gray-800">Resume Builder</h3>
                  <p className="text-xs text-gray-500 mt-1">100% Offline PDF Builder.</p>
                </div>

                <div
                  onClick={() => setActivePage("scholarships")}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-500 transition-all active:scale-[0.98]"
                >
                  <Award className="h-7 w-7 text-indigo-500 mb-2" />
                  <h3 className="font-bold text-sm sm:text-base text-gray-800">Scholarships</h3>
                  <p className="text-xs text-gray-500 mt-1">Instant rule matcher.</p>
                </div>

                <div
                  onClick={() => setActivePage("learn")}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-500 transition-all active:scale-[0.98]"
                >
                  <BookOpen className="h-7 w-7 text-indigo-500 mb-2" />
                  <h3 className="font-bold text-sm sm:text-base text-gray-800">Practice Hub</h3>
                  <p className="text-xs text-gray-500 mt-1">Offline Roadmaps & Quizzes.</p>
                </div>

                <div
                  onClick={() => setActivePage("jobs")}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-500 transition-all active:scale-[0.98]"
                >
                  <Briefcase className="h-7 w-7 text-indigo-500 mb-2" />
                  <h3 className="font-bold text-sm sm:text-base text-gray-800">Job Search</h3>
                  <p className="text-xs text-gray-500 mt-1">Tailored opportunities.</p>
                </div>

                <div
                  onClick={() => setActivePage("interview")}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-500 transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="h-7 w-7 text-indigo-500 mb-2" />
                  <h3 className="font-bold text-sm sm:text-base text-gray-800">AI Interview</h3>
                  <p className="text-xs text-gray-500 mt-1">Practice mock answers.</p>
                </div>

                <div
                  onClick={() => setActivePage("profile")}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-500 transition-all active:scale-[0.98]"
                >
                  <User className="h-7 w-7 text-indigo-500 mb-2" />
                  <h3 className="font-bold text-sm sm:text-base text-gray-800">Profile</h3>
                  <p className="text-xs text-gray-500 mt-1">Manage personal data.</p>
                </div>
              </div>
            </div>
          )}

          {activePage === "profile" && <Profile userData={userData} onUpdateUserData={setUserData} />}
          {activePage === "resume" && <ResumeBuilder />}
          {activePage === "jobs" && <JobFinder />}
          {activePage === "interview" && <AIInterview onGoToDashboard={() => setActivePage("dashboard")} />}
          {activePage === "scholarships" && <Scholarships />}
          {activePage === "learn" && <LearnPractice />}
        </div>
      </main>

      {/* True Native Mobile Bottom Navigation Bar (Fixed on mobile screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {mobileNavItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] rounded-xl transition-all ${
                isActive
                  ? "text-indigo-600 font-bold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div
                className={`p-1 rounded-full transition-all ${
                  isActive ? "bg-indigo-50 text-indigo-600 scale-110" : ""
                }`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
