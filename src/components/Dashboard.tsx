"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  MessageSquare,
  Award,
  BookOpen,
  LogOut,
  MoreHorizontal,
  ChevronLeft,
  X,
  Sparkles,
  ChevronRight,
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
import { 
  UserRole, 
  isUserAdmin, 
  DashboardSection, 
  InterviewTabState, 
  ScholarshipTabState, 
  LearnSubPageState, 
  STORAGE_KEYS 
} from "@/constants/roles";
import { APP_ROUTES } from "@/constants/endpoints";
import { getInitials } from "../lib/imageUtils";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useBackHandler, dispatchBack, hapticLight } from "@/shared/platform";

export default function Dashboard() {
  const [activePage, setActivePage] = useState<DashboardSection>(DashboardSection.DASHBOARD);
  const [learnSubPage, setLearnSubPage] = useState<LearnSubPageState | string>(LearnSubPageState.HUB);
  const [interviewTab, setInterviewTab] = useState<InterviewTabState | "setup" | "session" | "scorecard" | "history">(InterviewTabState.SETUP);
  const [scholarshipTab, setScholarshipTab] = useState<ScholarshipTabState | "wizard" | "results" | "directory" | "scholars" | "admin">(ScholarshipTabState.WIZARD);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [greeting, setGreeting] = useState("Good day");
  const [loading, setLoading] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { isOnline, wasOffline } = useNetworkStatus();

  // Tab navigation history stack
  const tabHistoryRef = React.useRef<DashboardSection[]>([]);

  const navigateToSection = (pageId: DashboardSection | string) => {
    const targetSection = pageId as DashboardSection;
    if (targetSection !== activePage) {
      tabHistoryRef.current.push(activePage);
      setActivePage(targetSection);
    }
    if (targetSection === DashboardSection.LEARN) setLearnSubPage(LearnSubPageState.HUB);
    if (targetSection === DashboardSection.INTERVIEW) setInterviewTab(InterviewTabState.SETUP);
    if (targetSection === DashboardSection.SCHOLARSHIPS) setScholarshipTab(ScholarshipTabState.WIZARD);
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
    if (activePage === DashboardSection.LEARN && learnSubPage !== LearnSubPageState.HUB) {
      if (learnSubPage === LearnSubPageState.RESOURCES_DETAIL) {
        setLearnSubPage(LearnSubPageState.RESOURCES_CATEGORY);
      } else {
        setLearnSubPage(LearnSubPageState.HUB);
      }
      return true;
    }
    // Sub-navigation within Interview simulator
    if (activePage === DashboardSection.INTERVIEW && interviewTab !== InterviewTabState.SETUP) {
      setInterviewTab(InterviewTabState.SETUP);
      return true;
    }
    // Sub-navigation within Scholarships
    if (activePage === DashboardSection.SCHOLARSHIPS && scholarshipTab !== ScholarshipTabState.WIZARD) {
      setScholarshipTab(ScholarshipTabState.WIZARD);
      return true;
    }
    return false;
  }, [activePage, learnSubPage, interviewTab, scholarshipTab]);

  // Priority 7: Screen pop to previous tab or Home Dashboard
  useBackHandler("screen_pop", () => {
    if (activePage !== DashboardSection.DASHBOARD) {
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
          setActivePage((prev) => (prev === DashboardSection.DASHBOARD ? DashboardSection.ADMIN : prev));
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

  // Set greeting based on time of day (sentence case)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.GUEST_MODE);
        sessionStorage.removeItem(STORAGE_KEYS.GUEST_MODE);
        localStorage.removeItem(STORAGE_KEYS.RESUME_CURRENT);
        localStorage.removeItem(STORAGE_KEYS.RESUME_REVISIONS);
        localStorage.removeItem(STORAGE_KEYS.SCHOLARSHIP_PROFILE);
        localStorage.removeItem(STORAGE_KEYS.INTERVIEW_HISTORY);
      }
      await supabase.auth.signOut();
      toast.success("Successfully logged out!");
      window.location.href = APP_ROUTES.AUTH;
    } catch (error: unknown) {
      window.location.href = APP_ROUTES.AUTH;
    }
  };

  const isAdmin = isUserAdmin(userData?.role, userData?.email);

  const menuItems = [
    ...(isAdmin
      ? [{ id: DashboardSection.ADMIN, label: "Admin Hub", icon: ShieldCheck, badge: "Super" }]
      : []),
    { id: DashboardSection.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
    { id: DashboardSection.RESUME, label: "Resume Builder", icon: FileText },
    { id: DashboardSection.INTERVIEW, label: "AI Mock Interview", icon: MessageSquare },
    { id: DashboardSection.LEARN, label: "Practice Hub", icon: BookOpen },
    { id: DashboardSection.SCHOLARSHIPS, label: "Scholarships", icon: Award },
    { id: DashboardSection.JOBS, label: "Job Finder", icon: Briefcase },
    { id: DashboardSection.PROFILE, label: "Profile", icon: User },
  ];

  // Mobile Bottom Navigation (5 distinct >=48px touch targets)
  const mobileNavItems = [
    { 
      id: isAdmin ? DashboardSection.ADMIN : DashboardSection.DASHBOARD, 
      label: isAdmin ? "Admin" : "Home", 
      icon: isAdmin ? ShieldCheck : LayoutDashboard 
    },
    { id: DashboardSection.RESUME, label: "Resume", icon: FileText },
    { id: DashboardSection.INTERVIEW, label: "Interview", icon: MessageSquare },
    { id: DashboardSection.LEARN, label: "Practice", icon: BookOpen },
    { id: "more", label: "More", icon: MoreHorizontal },
  ];

  const moreMenuItems = [
    ...(isAdmin
      ? [
          { id: DashboardSection.ADMIN, label: "Admin Control Center", icon: ShieldCheck, desc: "Simulator & compliance" },
          { id: DashboardSection.DASHBOARD, label: "Student Home", icon: LayoutDashboard, desc: "Student dashboard view" },
        ]
      : []),
    { id: DashboardSection.SCHOLARSHIPS, label: "Scholarships & Grants", icon: Award, desc: "Instant eligibility match" },
    { id: DashboardSection.JOBS, label: "Job Finder", icon: Briefcase, desc: "Explore matching roles" },
    { id: DashboardSection.PROFILE, label: "Profile Settings", icon: User, desc: "Manage personal details" },
  ];

  const getPageTitle = () => {
    switch (activePage) {
      case DashboardSection.ADMIN:
        return "Super Admin Control Center";
      case DashboardSection.DASHBOARD:
        return "Dashboard";
      case DashboardSection.PROFILE:
        return "Profile Settings";
      case DashboardSection.RESUME:
        return "Resume";
      case DashboardSection.JOBS:
        return "Job Finder";
      case DashboardSection.INTERVIEW:
        if (interviewTab === InterviewTabState.SESSION) return "Live Interview";
        if (interviewTab === InterviewTabState.SCORECARD) return "Interview Scorecard";
        if (interviewTab === InterviewTabState.HISTORY) return "Past Sessions";
        return "AI Mock Interview";
      case DashboardSection.SCHOLARSHIPS:
        if (scholarshipTab === ScholarshipTabState.RESULTS) return "Scholarship Matches";
        if (scholarshipTab === ScholarshipTabState.DIRECTORY) return "All Scholarships";
        if (scholarshipTab === ScholarshipTabState.SCHOLARS) return "Verified Mentors";
        if (scholarshipTab === ScholarshipTabState.ADMIN) return "Admin Console";
        return "Scholarships & Grants";
      case DashboardSection.LEARN:
        if (learnSubPage === LearnSubPageState.ROADMAPS) return "Career Roadmaps";
        if (learnSubPage === LearnSubPageState.NOTES) return "Downloadable Notes";
        if (learnSubPage === LearnSubPageState.QUIZZES) return "Practice Quizzes";
        if (learnSubPage === LearnSubPageState.RESOURCES_CATEGORY) return "Learning Resources";
        if (learnSubPage === LearnSubPageState.RESOURCES_DETAIL) return "Course Modules";
        return "Practice Hub";
      default:
        return "Dashboard";
    }
  };

  const isMoreItemActive = [
    DashboardSection.SCHOLARSHIPS, 
    DashboardSection.JOBS, 
    DashboardSection.PROFILE, 
    DashboardSection.ADMIN
  ].includes(activePage);

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
    activePage === DashboardSection.INTERVIEW &&
    interviewTab === InterviewTabState.SESSION;

  return (
    <div className="flex min-h-dvh bg-gray-50 text-gray-800 flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Desktop Sidebar (Compact 240px, hidden on mobile) */}
      <aside className="hidden md:flex w-60 bg-white shadow-sm flex-shrink-0 flex-col border-r border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div
            className="flex items-center cursor-pointer transition hover:opacity-85"
            onClick={() => setActivePage(DashboardSection.DASHBOARD)}
          >
            <ResuMentorBrandLogo variant="ready" colorScheme="indigo" size="md" showWordmark={true} theme="light" />
          </div>
        </div>

        <nav className="mt-3 flex-1 px-3 space-y-1" aria-label="Sidebar Navigation">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl transition-all duration-150 font-medium ${
                  isActive
                    ? item.id === DashboardSection.ADMIN
                      ? "bg-purple-900 text-white font-bold shadow-sm shadow-purple-200"
                      : "bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-200"
                    : item.id === DashboardSection.ADMIN
                    ? "text-purple-700 bg-purple-50/80 hover:bg-purple-100 font-semibold border border-purple-200"
                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <IconComponent className={`mr-2.5 h-4 w-4 flex-shrink-0 ${
                    isActive ? "text-white" : item.id === DashboardSection.ADMIN ? "text-purple-600" : "text-gray-400"
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {"badge" in item && item.badge ? (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
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
            className={`flex items-center w-full px-3 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 ${
              userData?.id === "guest-user"
                ? "text-indigo-600 hover:bg-indigo-50"
                : "text-red-500 hover:bg-red-50 hover:text-red-700"
            }`}
          >
            <LogOut className="mr-2.5 h-4 w-4" />{" "}
            {userData?.id === "guest-user" ? "Sign in / Register" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col min-w-0 overflow-x-hidden">
        {/* Compact Sticky Top App Header with Safe Area Notch padding */}
        <header className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 sm:px-6 min-h-[56px] pt-[calc(var(--sat,env(safe-area-inset-top,0px))+0.625rem)] pb-2 ${activePage === DashboardSection.RESUME || isLiveInterviewSession ? "hidden md:flex" : "flex"} items-center justify-between shadow-sm`}>
          <div className="flex items-center gap-2 min-w-0">
            {activePage !== DashboardSection.DASHBOARD ? (
              <button
                type="button"
                onClick={() => dispatchBack()}
                aria-label="Back"
                className="md:hidden p-2 -ml-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition active:scale-95 flex items-center justify-center min-w-[48px] min-h-[48px]"
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
                type="button"
                onClick={() => navigateToSection(activePage === DashboardSection.ADMIN ? DashboardSection.DASHBOARD : DashboardSection.ADMIN)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold border transition shadow-sm active:scale-95 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                title={activePage === DashboardSection.ADMIN ? "Switch to student view" : "Open super admin portal"}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>{activePage === DashboardSection.ADMIN ? "Student view" : "Admin hub"}</span>
              </button>
            )}

            <div className="hidden sm:block text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="block font-semibold text-gray-800 text-xs sm:text-sm leading-tight">
                  {displayName}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
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
              <span className="block text-xs text-gray-400 font-medium truncate max-w-[150px]">
                {userData?.email || ""}
              </span>
            </div>
            {!isLiveInterviewSession && (
              <button
                type="button"
                onClick={() => setActivePage(DashboardSection.PROFILE)}
                aria-label="View profile settings"
                className="min-w-[48px] min-h-[48px] p-1 flex items-center justify-center rounded-full hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                title="View profile settings"
              >
                {userData?.photoURL ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    width={40}
                    height={40}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full ring-2 ring-offset-1 ring-indigo-400 object-cover shadow-sm"
                    src={userData.photoURL}
                    alt={`${displayName}'s avatar`}
                  />
                ) : (
                  <div
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full ring-2 ring-offset-1 ring-indigo-400 bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm tracking-wide"
                  >
                    {initials}
                  </div>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Page Body with Compact Mobile Edge-to-Edge Margins & Safe Bottom Offset */}
        <div className={`flex-1 min-w-0 ${isLiveInterviewSession ? "p-0 sm:p-4 pb-0 overflow-hidden" : activePage === DashboardSection.RESUME ? "p-0 sm:p-4 md:p-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8 overflow-y-auto overflow-x-hidden" : "p-1 sm:p-4 md:p-6 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 overflow-y-auto overflow-x-hidden"}`}>
          <div className="animate-fade-in">
            {activePage === DashboardSection.DASHBOARD && (
              <div className="space-y-4 sm:space-y-6">
                {/* Compact Modern Greeting Banner */}
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md border border-indigo-700/60 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span className="text-xs font-semibold text-indigo-200">
                        Workspace overview
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
                    <h3 className="text-xs sm:text-sm font-bold text-gray-500">
                      Quick access
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                    <div
                      onClick={() => navigateToSection(DashboardSection.RESUME)}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1.5">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">Resume Builder</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">100% Offline A4 PDF</p>
                      </div>
                    </div>

                    <div
                      onClick={() => navigateToSection(DashboardSection.INTERVIEW)}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-1.5">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">AI Interview</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">Mock simulator & scoring</p>
                      </div>
                    </div>

                    <div
                      onClick={() => navigateToSection(DashboardSection.LEARN)}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1.5">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">Practice Hub</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">Roadmaps & quizzes</p>
                      </div>
                    </div>

                    <div
                      onClick={() => navigateToSection(DashboardSection.SCHOLARSHIPS)}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 mb-1.5">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">Scholarships</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">Instant rule matcher</p>
                      </div>
                    </div>

                    <div
                      onClick={() => navigateToSection(DashboardSection.JOBS)}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 mb-1.5">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">Job Finder</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">Tailored opportunities</p>
                      </div>
                    </div>

                    <div
                      onClick={() => navigateToSection(DashboardSection.PROFILE)}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98] min-h-[96px] flex flex-col justify-between"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 mb-1.5">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">Profile</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">Manage data & avatar</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePage === DashboardSection.ADMIN && (
              <AdminDashboard user={userData} onNavigateToSection={navigateToSection} />
            )}
            {activePage === DashboardSection.PROFILE && <Profile userData={userData} onUpdateUserData={setUserData} />}
            {activePage === DashboardSection.RESUME && <ResumeBuilder user={userData} />}
            {activePage === DashboardSection.JOBS && <JobFinder />}
            {activePage === DashboardSection.INTERVIEW && (
              <AIInterview
                user={userData}
                onGoToDashboard={() => navigateToSection(DashboardSection.DASHBOARD)}
                onNavigateToTab={(tabId) => navigateToSection(tabId)}
                tab={interviewTab as "setup" | "session" | "scorecard" | "history"}
                onTabChange={setInterviewTab}
              />
            )}
            {activePage === DashboardSection.SCHOLARSHIPS && (
              <Scholarships
                user={userData}
                tab={scholarshipTab as "wizard" | "results" | "directory" | "scholars" | "admin"}
                onTabChange={setScholarshipTab}
              />
            )}
            {activePage === DashboardSection.LEARN && (
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="relative bg-white rounded-t-2xl shadow-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-gray-200 animate-fade-in z-10">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">More tools and settings</span>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                aria-label="Close menu"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl min-h-[48px] min-w-[48px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <X className="h-5 w-5" />
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
                    className={`w-full min-h-[48px] flex items-center justify-between py-3 px-2 rounded-xl text-left transition ${
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
                        <div className="text-xs text-gray-400">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  handleLogout();
                }}
                className="w-full min-h-[48px] flex items-center gap-3 py-3 px-2 text-red-600 hover:bg-red-50 rounded-xl text-left transition"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <LogOut className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold">Log out of account</div>
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
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
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
