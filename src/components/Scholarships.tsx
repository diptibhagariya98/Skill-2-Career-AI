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

type ActiveTab = "wizard" | "results" | "directory" | "scholars" | "admin";

const LOCAL_STORAGE_PROFILE_KEY = "resumentor_scholarship_student_profile";

interface ScholarshipsProps {
  user?: { id?: string; name?: string; email?: string; [key: string]: any } | null;
}

export default function Scholarships({ user }: ScholarshipsProps = {}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("wizard");
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

  // Load saved profile from localStorage if exists for this user
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as StudentProfile;
        setStudentProfile(parsed);
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, [storageKey]);

  // Run evaluation
  const handleEvaluate = (profile: StudentProfile) => {
    setStudentProfile(profile);
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
    } catch {
      // Ignore storage errors
    }

    const results = evaluateAllSchemes(profile, schemes);
    setEvaluationResults(results);
    setActiveTab("results");
    toast.success(
      `Evaluated ${results.totalEvaluated} schemes: ${results.eligible.length} matched!`
    );
  };

  const handleRetake = () => {
    setActiveTab("wizard");
  };

  const handleConnectScholar = (schemeName: string) => {
    setScholarFilterScheme(schemeName);
    setActiveTab("scholars");
  };

  const handleClearSavedData = () => {
    localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
    setStudentProfile(null);
    setEvaluationResults(null);
    setActiveTab("wizard");
    toast.success("Saved eligibility profile deleted completely.");
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveTab("wizard")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "wizard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Eligibility Check
          </button>

          {evaluationResults && (
            <button
              onClick={() => setActiveTab("results")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "results"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> My Results ({evaluationResults.eligible.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab("directory")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "directory"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <BookOpen className="w-4 h-4" /> All Schemes ({schemes.length})
          </button>

          <button
            onClick={() => {
              setScholarFilterScheme(undefined);
              setActiveTab("scholars");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "scholars"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Verified Mentors ({scholars.length})
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "admin"
                ? "bg-gray-800 text-white shadow-md"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <Terminal className="w-4 h-4" /> Console
          </button>
        </div>

        {/* Clear Data Policy button */}
        {studentProfile && (
          <button
            onClick={handleClearSavedData}
            title="Clear all saved eligibility data from this device"
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 min-h-[44px] px-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Saved Data
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="pt-2">
        {activeTab === "wizard" && (
          <EligibilityWizard
            onEvaluate={handleEvaluate}
            initialProfile={studentProfile || undefined}
          />
        )}

        {activeTab === "results" && evaluationResults && (
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

        {activeTab === "directory" && (
          <SchemeDirectory
            schemes={schemes}
            onCheckEligibilityForScheme={(scheme) => {
              setActiveTab("wizard");
              toast(`Enter your details to check fit for ${scheme.shortName}`);
            }}
            onAskScholar={handleConnectScholar}
          />
        )}

        {activeTab === "scholars" && (
          <ScholarDirectory
            scholars={scholars}
            filterSchemeName={scholarFilterScheme}
          />
        )}

        {activeTab === "admin" && <AdminConsole schemes={schemes} />}
      </div>
    </div>
  );
}
