"use client";

import React, { useState, useEffect } from "react";
import {
  StudentProfile,
  ScholarshipScheme,
  SchemeEvaluationResult,
  ScholarListing,
} from "../types/scholarships";
import {
  SEED_SCHOLARSHIP_SCHEMES,
  SEED_SCHOLARS,
} from "../constants/seedScholarships";
import { evaluateAllSchemes } from "../lib/scholarships/engine";
import EligibilityWizard from "./scholarships/EligibilityWizard";
import EvaluationResults from "./scholarships/EvaluationResults";
import SchemeDirectory from "./scholarships/SchemeDirectory";
import ScholarDirectory from "./scholarships/ScholarDirectory";
import AdminConsole from "./scholarships/AdminConsole";
import { UserRole, isUserAdmin } from "@/constants/roles";
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Terminal,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getPreference, setPreference, removePreference, useStatusBarStyle, AppStatusBarStyle } from "@/shared/platform";

export enum ScholarshipTab {
  WIZARD = "wizard",
  RESULTS = "results",
  DIRECTORY = "directory",
  SCHOLARS = "scholars",
  ADMIN = "admin",
}

export type ActiveTab = ScholarshipTab | "wizard" | "results" | "directory" | "scholars" | "admin";

const LOCAL_STORAGE_PROFILE_KEY = "resumentor_scholarship_student_profile";

interface ScholarshipsProps {
  user?: { id?: string; name?: string; email?: string; role?: UserRole | string; [key: string]: unknown } | null;
  tab?: ActiveTab;
  onTabChange?: (tab: ActiveTab) => void;
}

export default function Scholarships({
  user,
  tab: controlledTab,
  onTabChange,
}: ScholarshipsProps = {}) {
  const [internalActiveTab, setInternalActiveTab] = useState<ActiveTab>(ScholarshipTab.WIZARD);
  // Light surface → dark icons on status bar
  useStatusBarStyle(AppStatusBarStyle.DARK_CONTENT);
  const activeTab = controlledTab !== undefined ? controlledTab : internalActiveTab;
  const setActiveTab = (newTab: ActiveTab) => {
    if (onTabChange) onTabChange(newTab);
    setInternalActiveTab(newTab);
  };
  const [schemes, setSchemes] = useState<ScholarshipScheme[]>(SEED_SCHOLARSHIP_SCHEMES);
  const [scholars, setScholars] = useState<ScholarListing[]>(SEED_SCHOLARS);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<{
    eligible: SchemeEvaluationResult[];
    checkDetails: SchemeEvaluationResult[];
    notEligible: SchemeEvaluationResult[];
    totalEvaluated: number;
    evaluatedAt: string;
  } | null>(null);
  const [scholarFilterScheme, setScholarFilterScheme] = useState<string | undefined>(undefined);

  const storageKey = user?.id ? `resumentor_scholarship_student_profile_${user.id}` : LOCAL_STORAGE_PROFILE_KEY;

  // Load saved profile from persistent preference (Capacitor Preferences on native, localStorage on web)
  useEffect(() => {
    let isCancelled = false;
    getPreference(storageKey)
      .then((saved) => {
        if (!isCancelled && saved) {
          try {
            const parsed = JSON.parse(saved) as StudentProfile;
            setStudentProfile(parsed);
          } catch {
            // Ignore invalid JSON
          }
        }
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [storageKey]);

  // Run evaluation
  const handleEvaluate = (profile: StudentProfile) => {
    setStudentProfile(profile);
    void setPreference(storageKey, JSON.stringify(profile));

    const results = evaluateAllSchemes(profile, schemes);
    setEvaluationResults(results);
    setActiveTab(ScholarshipTab.RESULTS);
    toast.success(
      `Evaluated ${results.totalEvaluated} schemes: ${results.eligible.length} matched!`
    );
  };

  const handleRetake = () => {
    setActiveTab(ScholarshipTab.WIZARD);
  };

  const handleConnectScholar = (schemeName: string) => {
    setScholarFilterScheme(schemeName);
    setActiveTab(ScholarshipTab.SCHOLARS);
  };

  const handleClearSavedData = () => {
    void removePreference(storageKey);
    setStudentProfile(null);
    setEvaluationResults(null);
    setActiveTab(ScholarshipTab.WIZARD);
    toast.success("Saved eligibility profile deleted completely.");
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
          <button
            onClick={() => setActiveTab(ScholarshipTab.WIZARD)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[48px] transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === ScholarshipTab.WIZARD
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Eligibility Check
          </button>

          {evaluationResults && (
            <button
              onClick={() => setActiveTab(ScholarshipTab.RESULTS)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[48px] transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === ScholarshipTab.RESULTS
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> My Results ({evaluationResults.eligible.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab(ScholarshipTab.DIRECTORY)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[48px] transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === ScholarshipTab.DIRECTORY
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <BookOpen className="w-4 h-4" /> All Schemes ({schemes.length})
          </button>

          <button
            onClick={() => {
              setScholarFilterScheme(undefined);
              setActiveTab(ScholarshipTab.SCHOLARS);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[48px] transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === ScholarshipTab.SCHOLARS
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Verified Mentors ({scholars.length})
          </button>

          {isUserAdmin(user?.role, user?.email) && (
            <button
              onClick={() => setActiveTab(ScholarshipTab.ADMIN)}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[48px] transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === ScholarshipTab.ADMIN
                  ? "bg-purple-800 text-white shadow-md shadow-purple-200"
                  : "text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              <Terminal className="w-4 h-4" /> Admin Console
            </button>
          )}
        </div>

        {/* Clear Data Policy button */}
        {studentProfile && (
          <button
            onClick={handleClearSavedData}
            title="Clear all saved eligibility data from this device"
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 min-h-[48px] px-3 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Saved Data
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="pt-2">
        {activeTab === ScholarshipTab.WIZARD && (
          <EligibilityWizard
            onEvaluate={handleEvaluate}
            initialProfile={studentProfile || undefined}
          />
        )}

        {activeTab === ScholarshipTab.RESULTS && evaluationResults && (
          <EvaluationResults
            eligible={evaluationResults.eligible}
            checkDetails={evaluationResults.checkDetails}
            notEligible={evaluationResults.notEligible}
            totalEvaluated={evaluationResults.totalEvaluated}
            evaluatedAt={evaluationResults.evaluatedAt}
            onRetake={handleRetake}
            onConnectScholar={handleConnectScholar}
          />
        )}

        {activeTab === ScholarshipTab.DIRECTORY && (
          <SchemeDirectory
            schemes={schemes}
            onCheckEligibilityForScheme={(scheme) => {
              setActiveTab(ScholarshipTab.WIZARD);
              toast(`Enter your details to check fit for ${scheme.shortName}`);
            }}
            onAskScholar={handleConnectScholar}
          />
        )}

        {activeTab === ScholarshipTab.SCHOLARS && (
          <ScholarDirectory
            scholars={scholars}
            filterSchemeName={scholarFilterScheme}
          />
        )}

        {activeTab === ScholarshipTab.ADMIN && <AdminConsole schemes={schemes} />}
      </div>
    </div>
  );
}
