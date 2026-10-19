"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
  ShieldCheck,
} from "lucide-react";
import ResuMentorBrandLogo from "@/shared/ui/ResuMentorBrandLogo";

// Sub-components
import Profile from "./Profile";
import ResumeBuilder from "./ResumeBuilder";
import JobFinder from "./JobFinder";
import AIInterview from "./AIInterview";
import Scholarships from "./Scholarships";
import LearnPractice from "./LearnPractice";
import AdminDashboard from "./admin/AdminDashboard";
import { UserData } from "../types/user";
import { UserRole, isUserAdmin, DashboardSection } from "@/constants/roles";
import { getInitials } from "../lib/imageUtils";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useBackHandler, dispatchBack, hapticLight } from "@/shared/platform";

export default function Dashboard() {
  const [activePage, setActivePage] = useState<DashboardSection | string>(DashboardSection.DASHBOARD);
  const [learnSubPage, setLearnSubPage] = useState("hub");
  const [interviewTab, setInterviewTab] = useState<"setup" | "session" | "scorecard" | "history">("setup");
  const [scholarshipTab, setScholarshipTab] = useState<"wizard" | "results" | "directory" | "scholars" | "admin">("wizard");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [greeting, setGreeting] = useState("Good Day");
  const [loading, setLoading] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { isOnline, wasOffline } = useNetworkStatus();

  // Tab navigation history stack
  const tabHistoryRef = React.useRef<string[]>([]);

  const navigateToSection = (pageId: string) => {
    if (pageId !== activePage) {
      tabHistoryRef.current.push(activePage);
      setActivePage(pageId);
    }
    if (pageId === "learn") setLearnSubPage("hub");
    if (pageId === "interview") setInterviewTab("setup");
    if (pageId === "scholarships") setScholarshipTab("wizard");
  };

  // Register Unified Back Handlers per Implementation Guide
  // Priority 2: Overlay (More menu)
  useBackHandler("overlay", () => {
    if (showMoreMenu) {
      setShowMoreMenu(false);
      return true;
    }
    return false;
  }, [showMoreMenu]);

  // Priority 5: Sub-navigation in Learn, Interview, Scholarships
  useBackHandler("in_screen", () => {
    // Sub-navigation within Learn & Practice
    if (activePage === "learn" && learnSubPage !== "hub") {
      if (learnSubPage === "resources-detail") {
        setLearnSubPage("resources-category");
      } else {
        setLearnSubPage("hub");
      }
      return true;
    }
    // Sub-navigation within Interview simulator
    if (activePage === "interview" && interviewTab !== "setup") {
      setInterviewTab("setup");
      return true;
    }
    // Sub-navigation within Scholarships
    if (activePage === "scholarships" && scholarshipTab !== "wizard") {
      setScholarshipTab("wizard");
      return true;
    }
    return false;
  }, [activePage, learnSubPage, interviewTab, scholarshipTab]);

  // Priority 7: Screen pop to previous tab or Home Dashboard
  useBackHandler("screen_pop", () => {
    if (activePage !== DashboardSection.DASHBOARD && activePage !== "dashboard") {
      while (tabHistoryRef.current.length > 0) {
        const prev = tabHistoryRef.current.pop();
        if (prev && prev !== activePage) {
          setActivePage(prev);
          return true;
        }
      }
      setActivePage(DashboardSection.DASHBOARD);
      return true;
    }
    return false;
  }, [activePage]);

  // Unified top bar back button trigger
  const handleTopBarBack = () => {
    dispatchBack();
  };

  // Fetch Supabase user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Guest User mode
          setUserData({
            id: "guest-user",
            name: "Guest Explorer",
            email: "guest@resumentor.app",
            photoURL: "",
            role: UserRole.STUDENT,
          } as UserData);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const rawRole = (profile?.role || user.user_metadata?.role || UserRole.STUDENT) as string;
        const isAdminUser = isUserAdmin(rawRole, user.email);
        const resolvedRole = isAdminUser ? UserRole.ADMIN : (rawRole as UserRole);

        setUserData({
          id: user.id,
          name: profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || (isAdminUser ? "Super Admin" : "Student"),
          email: profile?.email || user.email || "",
          photoURL: profile?.photo_url || "",
          role: resolvedRole,
          ...profile,
        } as UserData);

        if (isAdminUser) {
          setActivePage((prev) => (prev === "dashboard" ? "admin" : prev));
        }
      } catch (error: unknown) {
        // Fallback to guest user on any unexpected error
        setUserData({
          id: "guest-user",
          name: "Guest Explorer",
          email: "guest@resumentor.app",
          photoURL: "",
          role: UserRole.STUDENT,
        } as UserData);
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
      if (typeof window !== "undefined") {
        localStorage.removeItem("resumentor_guest_mode");
        sessionStorage.removeItem("resumentor_guest_mode");
        localStorage.removeItem("resumentor_resume_current");
        localStorage.removeItem("resumentor_resume_revisions");
        localStorage.removeItem("resumentor_scholarship_profile");
        localStorage.removeItem("resumentor_interview_history");
      }
      await supabase.auth.signOut();
      toast.success("Successfully logged out!");
      window.location.href = "/auth";
    } catch (error: unknown) {
      window.location.href = "/auth";
    }
  };

  const isAdmin = isUserAdmin(userData?.role, userData?.email);

  const menuItems = [
    ...(isAdmin
      ? [{ id: "admin", label: "Admin Hub", icon: ShieldCheck, badge: "SUPER" }]
      : []),
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
    { id: isAdmin ? "admin" : "dashboard", label: isAdmin ? "Admin" : "Home", icon: isAdmin ? ShieldCheck : LayoutDashboard },
    { id: "resume", label: "Resume", icon: FileText },
    { id: "interview", label: "Interview", icon: MessageSquare },
    { id: "learn", label: "Practice", icon: BookOpen },
    { id: "more", label: "More", icon: MoreHorizontal },
  ];

  const moreMenuItems = [
    ...(isAdmin
      ? [
          { id: "admin", label: "Admin Control Center", icon: ShieldCheck, desc: "Simulator & Compliance" },
          { id: "dashboard", label: "Student Home", icon: LayoutDashboard, desc: "Student Dashboard View" },
        ]
      : []),
    { id: "scholarships", label: "Scholarships & Grants", icon: Award, desc: "Instant eligibility match" },
    { id: "jobs", label: "Job Finder", icon: Briefcase, desc: "Explore matching roles" },
    { id: "profile", label: "Profile Settings", icon: User, desc: "Manage personal details" },
  ];

  const getPageTitle = () => {
    switch (activePage) {
      case "admin":
        return "Super Admin Control Center";
      case "dashboard":
        return "Dashboard";
      case "profile":
        return "Profile Settings";
      case "resume":
        return "Resume";
      case "jobs":
        return "Job Finder";
      case "interview":
        if (interviewTab === "session") return "Live Interview";
        if (interviewTab === "scorecard") return "Interview Scorecard";
        if (interviewTab === "history") return "Past Sessions";
        return "AI Mock Interview";
      case "scholarships":
        if (scholarshipTab === "results") return "Scholarship Matches";
        if (scholarshipTab === "directory") return "All Scholarships";
        if (scholarshipTab === "scholars") return "Verified Mentors";
        if (scholarshipTab === "admin") return "Admin Console";
        return "Scholarships & Grants";
      case "learn":
        if (learnSubPage === "roadmaps") return "Career Roadmaps";
        if (learnSubPage === "notes") return "Downloadable Notes";
        if (learnSubPage === "quizzes") return "Practice Quizzes";
        if (learnSubPage === "resources-category") return "Learning Resources";
        if (learnSubPage === "resources-detail") return "Course Modules";
        return "Practice Hub";
      default:
        return "Dashboard";
    }
  };

  const isMoreItemActive = ["scholarships", "jobs", "profile", "admin"].includes(activePage);

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

  const displayName = userData?.name || "Student";
  const initials = getInitials(displayName);

  const isLiveInterviewSession =
    (activePage === DashboardSection.INTERVIEW || activePage === "interview") &&
    interviewTab === "session";

  return (
    <div className="flex min-h-dvh bg-gray-50 text-gray-800 flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Desktop Sidebar (Compact 240px, hidden on mobile) */}
      <aside className="hidden md:flex w-60 bg-white shadow-xs flex-shrink-0 flex-col border-r border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div
            className="flex items-center cursor-pointer transition hover:opacity-85"
            onClick={() => setActivePage("dashboard")}
          >
            <ResuMentorBrandLogo variant="ready" colorScheme="indigo" size="md" showWordmark={true} theme="light" />
          </div>
        </div>

        <nav className="mt-3 flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm rounded-xl transition-all duration-150 font-medium ${
                  isActive
                    ? item.id === "admin"
                      ? "bg-purple-900 text-white font-bold shadow-xs shadow-purple-200"
                      : "bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-200"
                    : item.id === "admin"
                    ? "text-purple-700 bg-purple-50/80 hover:bg-purple-100 font-semibold border border-purple-200"
                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <IconComponent className={`mr-2.5 h-4 w-4 flex-shrink-0 ${
                    isActive ? "text-white" : item.id === "admin" ? "text-purple-600" : "text-gray-400"
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {"badge" in item && item.badge ? (
                  <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                    isActive ? "bg-white/20 text-white" : "bg-purple-200 text-purple-800"
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 ${
              userData?.id === "guest-user"
                ? "text-indigo-600 hover:bg-indigo-50"
                : "text-red-500 hover:bg-red-50 hover:text-red-700"
            }`}
          >
            <LogOut className="mr-2.5 h-4 w-4" />{" "}
            {userData?.id === "guest-user" ? "Sign In / Register" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col min-w-0 overflow-x-hidden">
        {/* Compact Sticky Top App Header with Safe Area Notch padding */}
        <header className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 sm:px-6 min-h-[56px] pt-[max(env(safe-area-inset-top,0px),0.5rem)] pb-2 ${activePage === "resume" ? "hidden md:flex" : "flex"} items-center justify-between shadow-xs`}>
          <div className="flex items-center gap-2 min-w-0">
            {activePage !== "dashboard" ? (
              <button
                onClick={() => dispatchBack()}
                aria-label="Back"
                className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition active:scale-95 flex items-center min-w-[36px] min-h-[36px]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : null}
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={() => navigateToSection(activePage === "admin" ? "dashboard" : "admin")}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-xs active:scale-95 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                title={activePage === "admin" ? "Switch to Student View" : "Open Super Admin Portal"}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>{activePage === "admin" ? "Preview Student View" : "Admin Hub"}</span>
              </button>
            )}

            <div className="hidden sm:block text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="block font-semibold text-gray-800 text-xs sm:text-sm leading-tight">
                  {displayName}
                </span>
                <span
                  className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    isAdmin
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : userData?.id === "guest-user"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : userData?.role === UserRole.CANDIDATE
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}
                >
                  {isAdmin
                    ? "Super Admin"
                    : userData?.id === "guest-user"
                    ? "Guest Mode"
                    : userData?.role || "Student"}
                </span>
              </div>
              <span className="block text-[11px] text-gray-400 font-medium truncate max-w-[150px]">
                {userData?.email || ""}
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

        {/* Scrollable Page Body with Compact Mobile Edge-to-Edge Margins & Safe Bottom Offset */}
        <div className={`flex-1 min-w-0 ${isLiveInterviewSession ? "p-0 sm:p-4 pb-0 overflow-hidden" : activePage === "resume" ? "p-0 sm:p-4 md:p-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8 overflow-y-auto overflow-x-hidden" : "p-1 sm:p-4 md:p-6 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 overflow-y-auto overflow-x-hidden"}`}>
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
                      onClick={() => navigateToSection("resume")}
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
                      onClick={() => navigateToSection("interview")}
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
                      onClick={() => navigateToSection("learn")}
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
                      onClick={() => navigateToSection("scholarships")}
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
                      onClick={() => navigateToSection("jobs")}
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
                      onClick={() => navigateToSection("profile")}
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

            {activePage === "admin" && (
              <AdminDashboard user={userData} onNavigateToSection={navigateToSection} />
            )}
            {activePage === "profile" && <Profile userData={userData} onUpdateUserData={setUserData} />}
            {activePage === "resume" && <ResumeBuilder user={userData} />}
            {activePage === "jobs" && <JobFinder />}
            {activePage === "interview" && (
              <AIInterview
                user={userData}
                onGoToDashboard={() => navigateToSection("dashboard")}
                onNavigateToTab={(tabId) => navigateToSection(tabId)}
                tab={interviewTab}
                onTabChange={setInterviewTab}
              />
            )}
            {activePage === "scholarships" && (
              <Scholarships
                user={userData}
                tab={scholarshipTab}
                onTabChange={setScholarshipTab}
              />
            )}
            {activePage === "learn" && (
              <LearnPractice
                subPage={learnSubPage}
                onChangeSubPage={setLearnSubPage}
              />
            )}
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
                      navigateToSection(item.id);
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

      {/* True Native Mobile Bottom Navigation Bar (Hidden during active live interview session) */}
      {!isLiveInterviewSession && (
        <nav
          data-hide-on-keyboard="true"
          className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-2xl transition-all duration-200"
        >
        {mobileNavItems.map((item) => {
          const IconComponent = item.icon;
          const isMore = item.id === "more";
          const isActive = isMore ? isMoreItemActive : activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                hapticLight();
                if (isMore) {
                  setShowMoreMenu(!showMoreMenu);
                } else {
                  navigateToSection(item.id);
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
      )}
    </div>
  );
}
