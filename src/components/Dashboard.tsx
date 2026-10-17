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
  MoreHorizontal,
  ChevronLeft,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
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
    { id: "interview", label: "AI Mock Interview", icon: MessageSquare },
    { id: "learn", label: "Practice Hub", icon: BookOpen },
    { id: "scholarships", label: "Scholarships", icon: Award },
    { id: "jobs", label: "Job Finder", icon: Briefcase },
    { id: "profile", label: "Profile", icon: User },
  ];

  // Mobile Bottom Navigation (5 distinct >=44px touch targets)
  const mobileNavItems = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "resume", label: "Resume", icon: FileText },
    { id: "interview", label: "Interview", icon: MessageSquare },
    { id: "learn", label: "Practice", icon: BookOpen },
    { id: "more", label: "More", icon: MoreHorizontal },
  ];

  const moreMenuItems = [
    { id: "scholarships", label: "Scholarships & Grants", icon: Award, desc: "Instant eligibility match" },
    { id: "jobs", label: "Job Finder", icon: Briefcase, desc: "Explore matching roles" },
    { id: "profile", label: "Profile Settings", icon: User, desc: "Manage personal details" },
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
        return "AI Mock Interview";
      case "scholarships":
        return "Scholarships";
      case "learn":
        return "Practice Hub";
      default:
        return "Dashboard";
    }
  };

  const isMoreItemActive = ["scholarships", "jobs", "profile"].includes(activePage);

  // Skeleton Loading State Shaped Like Final Content (UX-40)
  if (loading) {
    return (
      <div className="flex min-h-dvh bg-gray-50 flex-col md:flex-row antialiased">
        <aside className="hidden md:flex w-60 bg-white border-r border-gray-100 flex-col p-4 gap-3">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="mt-6 space-y-2 flex-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </aside>
        <main className="flex-1 p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full">
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-28 bg-indigo-100/60 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const displayName = userData?.name || auth.currentUser?.displayName || "Student";
  const initials = getInitials(displayName);

  return (
    <div className="flex min-h-dvh bg-gray-50 text-gray-800 flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Floating Offline / Online Status Pill with Safe Area clearance (UX-05, UX-41) */}
      {!isOnline && (
        <div className="fixed top-[calc(0.5rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-amber-300 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-amber-500/30 flex items-center gap-1.5 animate-bounce">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Offline • Local features ready</span>
        </div>
      )}

      {isOnline && wasOffline && (
        <div className="fixed top-[calc(0.5rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-50 bg-emerald-900/95 text-emerald-200 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-emerald-500/30 flex items-center gap-1.5 animate-fade-in">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back Online • Sync Active</span>
        </div>
      )}

      {/* Desktop Sidebar (Compact 240px, hidden on mobile) */}
      <aside className="hidden md:flex w-60 bg-white shadow-xs flex-shrink-0 flex-col border-r border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div
            className="flex items-center cursor-pointer transition hover:opacity-85"
            onClick={() => setActivePage("dashboard")}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="ml-2.5">
              <span className="font-extrabold text-lg text-gray-900 tracking-tight leading-none block">
                ResuMentor
              </span>
              <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
                Career AI
              </span>
            </div>
          </div>
        </div>

        <nav className="mt-3 flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center px-3 py-2.5 text-xs sm:text-sm rounded-xl transition-all duration-150 font-medium ${
                  isActive
                    ? "bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-200"
                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                <IconComponent className={`mr-2.5 h-4 w-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-xs sm:text-sm font-semibold text-red-500 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-150"
          >
            <LogOut className="mr-2.5 h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col min-w-0 overflow-hidden">
        {/* Compact Sticky Top App Header (56px, Safe Area Inset) */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 pt-safe px-3 sm:px-6 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            {activePage !== "dashboard" ? (
              <button
                onClick={() => setActivePage("dashboard")}
                aria-label="Back to dashboard"
                className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition active:scale-95 flex items-center min-w-[36px] min-h-[36px]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <div
                className="md:hidden flex items-center cursor-pointer mr-1"
                onClick={() => setActivePage("dashboard")}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <GraduationCap className="h-4 w-4" />
                </div>
              </div>
            )}
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="hidden sm:block text-right">
              <span className="block font-semibold text-gray-800 text-xs sm:text-sm leading-tight">
                {displayName}
              </span>
              <span className="block text-[11px] text-gray-400 font-medium truncate max-w-[150px]">
                {auth.currentUser?.email}
              </span>
            </div>
            {userData?.photoURL ? (
              <img
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full ring-2 ring-offset-1 ring-indigo-400 object-cover cursor-pointer hover:opacity-90 transition shadow-xs"
                src={userData.photoURL}
                alt={`${displayName}'s avatar`}
                title="View Profile Settings"
                onClick={() => setActivePage("profile")}
              />
            ) : (
              <div
                onClick={() => setActivePage("profile")}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full ring-2 ring-offset-1 ring-indigo-400 bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm cursor-pointer hover:opacity-90 transition shadow-xs tracking-wide"
                title="View Profile Settings"
              >
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Page Body with Safe Bottom Offset (pb-24 ensures clearance above mobile nav) */}
        <div className="flex-1 p-3 sm:p-5 md:p-6 pb-24 md:pb-8 overflow-y-auto min-w-0">
          <div className="animate-fade-in">
            {activePage === "dashboard" && (
              <div className="space-y-4 sm:space-y-6">
                {/* Compact Modern Greeting Banner */}
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md border border-indigo-700/60 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-200">
                        Workspace Overview
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      {greeting}, {displayName}!
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-indigo-100/90 max-w-xl leading-relaxed">
                      Build ATS resumes offline, practice AI mock interviews, track verified scholarships, and master roadmaps.
                    </p>
                  </div>
                  {/* Subtle background glow */}
                  <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                </div>

                {/* Dense Action Cards Grid (UX-01, UX-13, UX-20) */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
                      Quick Access
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                    <div
                      onClick={() => setActivePage("resume")}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-150 shadow-xs hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1.5">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">Resume Builder</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">100% Offline A4 PDF</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setActivePage("interview")}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-150 shadow-xs hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-1.5">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">AI Interview</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">Mock simulator & scoring</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setActivePage("learn")}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-150 shadow-xs hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1.5">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">Practice Hub</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">Roadmaps & quizzes</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setActivePage("scholarships")}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-150 shadow-xs hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 mb-1.5">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">Scholarships</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">Instant rule matcher</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setActivePage("jobs")}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-150 shadow-xs hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 mb-1.5">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">Job Finder</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">Tailored opportunities</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setActivePage("profile")}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-150 shadow-xs hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 mb-1.5">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">Profile</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">Manage data & avatar</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePage === "profile" && <Profile userData={userData} onUpdateUserData={setUserData} />}
            {activePage === "resume" && <ResumeBuilder />}
            {activePage === "jobs" && <JobFinder />}
            {activePage === "interview" && (
              <AIInterview
                onGoToDashboard={() => setActivePage("dashboard")}
                onNavigateToTab={(tabId) => setActivePage(tabId)}
              />
            )}
            {activePage === "scholarships" && <Scholarships />}
            {activePage === "learn" && <LearnPractice />}
          </div>
        </div>
      </main>

      {/* Mobile "More" Sheet Modal (UX-62: Bottom sheet with smooth backdrop & safe areas) */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="relative bg-white rounded-t-2xl shadow-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-gray-150 animate-fade-in z-10">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">More Tools & Settings</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-50 mt-1">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center justify-between py-3 px-2 rounded-xl text-left transition ${
                      isActive ? "bg-indigo-50 text-indigo-600" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="text-[11px] text-gray-400">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 py-3 px-2 text-red-600 hover:bg-red-50 rounded-xl text-left transition"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <LogOut className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold">Logout from Account</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* True Native Mobile Bottom Navigation Bar (Fixed with Safe Area Inset UX-05, UX-20, UX-35) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-2xl">
        {mobileNavItems.map((item) => {
          const IconComponent = item.icon;
          const isMore = item.id === "more";
          const isActive = isMore ? isMoreItemActive : activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isMore) {
                  setShowMoreMenu(!showMoreMenu);
                } else {
                  setActivePage(item.id);
                  setShowMoreMenu(false);
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] rounded-xl transition-all ${
                isActive
                  ? "text-indigo-600 font-bold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div
                className={`p-1 rounded-full transition-all ${
                  isActive ? "bg-indigo-50 text-indigo-600 scale-105" : ""
                }`}
              >
                <IconComponent className="h-4.5 w-4.5" />
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
