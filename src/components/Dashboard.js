"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

// Sub-components
import Profile from "./Profile";
import ResumeBuilder from "./ResumeBuilder";
import JobFinder from "./JobFinder";
import AIInterview from "./AIInterview";
import Scholarships from "./Scholarships";
import LearnPractice from "./LearnPractice";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("dashboard"); // dashboard, profile, resume, jobs, interview, scholarships, learn
  const [userData, setUserData] = useState(null);
  const [greeting, setGreeting] = useState("Good Day");
  const [loading, setLoading] = useState(true);

  // Fetch Firestore user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData({ name: "Student", email: user.email });
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
    { id: "profile", label: "Profile", icon: User },
    { id: "resume", label: "Resume Builder", icon: FileText },
    { id: "jobs", label: "Job Finder", icon: Briefcase },
    { id: "interview", label: "AI Interview", icon: MessageSquare },
    { id: "scholarships", label: "Scholarships", icon: Award },
    { id: "learn", label: "Learn & Practice", icon: BookOpen },
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
          <p className="mt-2 text-gray-500 font-semibold">Loading ResuMentor...</p>
        </div>
      </div>
    );
  }

  const displayName = userData?.name || "Student";

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-md flex-shrink-0 flex flex-col border-r border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-indigo-500" />
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
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-150 font-medium ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-100"
                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                <IconComponent className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-indigo-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-semibold text-red-500 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-150"
          >
            <LogOut className="mr-3 h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <header className="flex justify-between items-center mb-8 border-b pb-4 border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block font-bold text-gray-800 text-base">{displayName}</span>
              <span className="block text-xs text-gray-400 font-medium">{auth.currentUser?.email}</span>
            </div>
            <img
              className="h-12 w-12 rounded-full ring-2 ring-offset-2 ring-indigo-400 object-cover"
              src="/Images/Photo.png"
              alt="Student avatar"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256";
              }}
            />
          </div>
        </header>

        {/* Content Views */}
        <div className="animate-fade-in">
          {activePage === "dashboard" && (
            <div className="space-y-6">
              {/* Greeting Card */}
              <div className="bg-indigo-600 text-white p-8 rounded-2xl shadow-lg border border-indigo-700">
                <h2 className="text-3xl font-bold">{greeting}, {displayName}!</h2>
                <p className="mt-2 opacity-90 text-sm font-medium">
                  Here&apos;s your career snapshot. Access resources, build resumes, prepare for interviews, and find jobs.
                </p>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div
                  onClick={() => setActivePage("resume")}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-500 transition-all"
                >
                  <FileText className="h-8 w-8 text-indigo-500 mb-3" />
                  <h3 className="font-bold text-lg text-gray-800">Resume Builder</h3>
                  <p className="text-sm text-gray-500 mt-1">Create or update your resume and download as PDF.</p>
                </div>
                <div
                  onClick={() => setActivePage("jobs")}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-500 transition-all"
                >
                  <Briefcase className="h-8 w-8 text-indigo-500 mb-3" />
                  <h3 className="font-bold text-lg text-gray-800">Job Search</h3>
                  <p className="text-sm text-gray-500 mt-1">Search real-time jobs tailored to your skills.</p>
                </div>
                <div
                  onClick={() => setActivePage("interview")}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-500 transition-all"
                >
                  <MessageSquare className="h-8 w-8 text-indigo-500 mb-3" />
                  <h3 className="font-bold text-lg text-gray-800">AI Mock Interview</h3>
                  <p className="text-sm text-gray-500 mt-1">Practice interview answers with Gemini feedback.</p>
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
    </div>
  );
}
