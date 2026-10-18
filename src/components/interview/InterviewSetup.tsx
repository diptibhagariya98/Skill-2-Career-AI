"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  ExperienceLevel,
  FeedbackTiming,
  InterviewDifficulty,
  InterviewMode,
  InterviewSetupConfig,
  InterviewType,
} from "../../types/interview";
import { extractJobDescriptionSkills } from "../../lib/interview/engine";
import { ROLE_PROFILES } from "../../constants/interviewData";
import { PickerSelect, PickerOption, BottomSheet } from "@/shared/ui";

const EXPERIENCE_OPTIONS: readonly PickerOption<ExperienceLevel>[] = [
  { value: "fresher", label: "Student / Fresher (0 years)", description: "Core concepts, academic projects & fundamentals" },
  { value: "junior", label: "Junior (1 - 2 years)", description: "Practical tools, execution & foundational experience" },
  { value: "mid", label: "Mid-Level (3 - 5 years)", description: "Independent problem solving & feature ownership" },
  { value: "senior", label: "Senior (5 - 8 years)", description: "Architecture, system trade-offs & technical guidance" },
  { value: "lead", label: "Lead / Architect (8+ years)", description: "Cross-team impact, tech strategy & leadership" },
];

const INTERVIEW_TYPE_OPTIONS: readonly PickerOption<InterviewType>[] = [
  { value: "mixed", label: "Mixed (Technical & Behavioural)", description: "Balanced assessment of practical skill and collaboration" },
  { value: "technical", label: "Technical & Role Knowledge", description: "In-depth engineering, domain tools and system design" },
  { value: "behavioral", label: "Behavioural & Situational (STAR)", description: "Team dynamics, conflict resolution and leadership" },
  { value: "hr", label: "HR & Culture Fit", description: "Values, career motivations and workplace alignment" },
];

const DIFFICULTY_OPTIONS: readonly PickerOption<InterviewDifficulty>[] = [
  { value: "friendly", label: "Friendly (Gentle prompts)", description: "Supportive tone with forgiving evaluations and helpful hints" },
  { value: "standard", label: "Standard (Industry standard)", description: "Realistic interview bar expected at modern companies" },
  { value: "tough", label: "Tough (Rigorous follow-ups)", description: "Challenging edge cases, deep probes and stricter rubric" },
];

const FEEDBACK_TIMING_OPTIONS: readonly PickerOption<FeedbackTiming>[] = [
  { value: "instant", label: "Practice Mode (Instant Feedback)", description: "Instant scores and coaching after every question" },
  { value: "deferred", label: "Realistic Mode (Scorecard at End)", description: "True mock interview; comprehensive scorecard upon completion" },
];


interface InterviewSetupProps {
  onStartSession: (config: InterviewSetupConfig) => void;
  initialRole?: string;
}

export default function InterviewSetup({ onStartSession, initialRole = "" }: InterviewSetupProps) {
  const [targetJobTitle, setTargetJobTitle] = useState(initialRole || "Frontend Developer");
  const [jobDescription, setJobDescription] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("junior");
  const [interviewType, setInterviewType] = useState<InterviewType>("mixed");
  const [questionCount, setQuestionCount] = useState<5 | 8 | 10>(8);
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("standard");
  const [feedbackTiming, setFeedbackTiming] = useState<FeedbackTiming>("instant");
  const [interviewMode, setInterviewMode] = useState<InterviewMode>("full_ai");
  const [useResume, setUseResume] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  // Check consent from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("resumentor_ai_interview_consent");
      if (stored === "true") {
        setHasConsented(true);
      }
    } catch {
      // localStorage guard
    }
  }, []);

  // Live extract skills when JD changes
  useEffect(() => {
    if (jobDescription.trim().length > 10) {
      const skills = extractJobDescriptionSkills(jobDescription);
      setExtractedSkills(skills);
    } else {
      setExtractedSkills([]);
    }
  }, [jobDescription]);

  const handleStartClick = () => {
    if (!targetJobTitle.trim()) {
      alert("Please enter a target job title.");
      return;
    }

    const config: InterviewSetupConfig = {
      targetJobTitle: targetJobTitle.trim(),
      jobDescription: jobDescription.trim() || undefined,
      experienceLevel,
      interviewType,
      questionCount,
      difficulty,
      language: "en",
      feedbackTiming,
      interviewMode,
      useResume,
    };

    if (interviewMode === "full_ai" && !hasConsented) {
      setShowConsentModal(true);
      return;
    }

    onStartSession(config);
  };

  const handleAgreeConsent = () => {
    try {
      localStorage.setItem("resumentor_ai_interview_consent", "true");
    } catch {
      // guard
    }
    setHasConsented(true);
    setShowConsentModal(false);

    const config: InterviewSetupConfig = {
      targetJobTitle: targetJobTitle.trim(),
      jobDescription: jobDescription.trim() || undefined,
      experienceLevel,
      interviewType,
      questionCount,
      difficulty,
      language: "en",
      feedbackTiming,
      interviewMode,
      useResume,
    };
    onStartSession(config);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Smart AI Mock Interview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Realistic Interview Practice
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Practice role-tailored questions one at a time, receive instant feedback across Accuracy,
            Confidence, and Context, and download your final scorecard with hiring recommendations.
          </p>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full AI Mode */}
        <div
          onClick={() => setInterviewMode("full_ai")}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
            interviewMode === "full_ai"
              ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
              : "border-gray-200 bg-white hover:border-indigo-300"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Smart Interview
              </span>
              {interviewMode === "full_ai" && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
            </div>
            <h3 className="text-base font-bold text-gray-900">Gemini AI Powered</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Dynamic question planning from your role and job description. Real-time rubric evaluation,
              targeted follow-ups, and comprehensive AI hiring scorecard.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-indigo-600 font-medium">
            <span>Requires Internet Connection</span>
            <span className="text-gray-400">Gemini 3.8 Flash</span>
          </div>
        </div>

        {/* Quick Practice / Question Bank Mode */}
        <div
          onClick={() => setInterviewMode("quick_practice")}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
            interviewMode === "quick_practice"
              ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
              : "border-gray-200 bg-white hover:border-indigo-300"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                <Zap className="w-3.5 h-3.5" />
                Quick Practice
              </span>
              {interviewMode === "quick_practice" && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
            </div>
            <h3 className="text-base font-bold text-gray-900">Curated Question Bank</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Zero-AI base mode. Instant keyword checking, model answer comparisons, and self-checks.
              100% offline-ready with zero token usage.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-600 font-medium">
            <span>Works 100% Offline</span>
            <span className="text-gray-400">Zero AI Required</span>
          </div>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
        {/* Target Role & Quick Pills */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Target Job Title <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Briefcase className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={targetJobTitle}
              onChange={(e) => setTargetJobTitle(e.target.value)}
              placeholder="e.g. Frontend Developer, Backend Engineer, Data Analyst..."
              maxLength={100}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900"
            />
          </div>
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-gray-500 self-center mr-1">Popular roles:</span>
            {ROLE_PROFILES.slice(0, 5).map((rp) => (
              <button
                key={rp.id}
                type="button"
                onClick={() => setTargetJobTitle(rp.title)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  targetJobTitle === rp.title
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {rp.title}
              </button>
            ))}
          </div>
        </div>

        {/* Job Description (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-gray-800">
              Job Description <span className="text-xs font-normal text-gray-500">(Optional but recommended)</span>
            </label>
            <span className="text-xs text-gray-400">{jobDescription.length}/8000</span>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting text here for sharper, highly targeted interview questions..."
            rows={4}
            maxLength={8000}
            className="w-full p-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 font-mono"
          />

          {/* Extracted Skills Chips */}
          {extractedSkills.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <span className="text-xs font-semibold text-indigo-800 mr-1">Skills detected from JD:</span>
              {extractedSkills.map((sk) => (
                <span
                  key={sk}
                  className="px-2 py-0.5 bg-white text-indigo-700 text-xs font-medium rounded-md border border-indigo-200 shadow-2xs"
                >
                  {sk}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Experience Level & Interview Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PickerSelect<ExperienceLevel>
            label="Experience Level"
            title="Select Experience Level"
            value={experienceLevel}
            options={EXPERIENCE_OPTIONS}
            onChange={setExperienceLevel}
          />

          <PickerSelect<InterviewType>
            label="Interview Focus"
            title="Select Interview Focus"
            value={interviewType}
            options={INTERVIEW_TYPE_OPTIONS}
            onChange={setInterviewType}
          />
        </div>

        {/* Question Count, Difficulty & Feedback Timing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Number of Questions</label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num as 5 | 8 | 10)}
                  className={`py-2.5 rounded-xl border font-bold text-sm transition-colors ${
                    questionCount === num
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {num} Qs
                </button>
              ))}
            </div>
          </div>

          <PickerSelect<InterviewDifficulty>
            label="Difficulty"
            title="Select Difficulty"
            value={difficulty}
            options={DIFFICULTY_OPTIONS}
            onChange={setDifficulty}
          />

          <PickerSelect<FeedbackTiming>
            label="Feedback Timing"
            title="Select Feedback Timing"
            value={feedbackTiming}
            options={FEEDBACK_TIMING_OPTIONS}
            onChange={setFeedbackTiming}
          />
        </div>

        {/* Toggle: Resume integration */}
        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={useResume}
              onChange={(e) => setUseResume(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <div>
                <span className="text-xs font-bold text-gray-800 block">Use My Saved Resume</span>
                <span className="text-2xs text-gray-500">Ground questions in your portfolio projects and experience</span>
              </div>
            </div>
          </label>
        </div>

        {/* Start Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleStartClick}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Start Mock Interview ({questionCount} Questions)
          </button>
          <p className="text-center text-xs text-gray-500 mt-2">
            Practice aid only. Takes ~{questionCount * 2} minutes. You can pause or stop at any time.
          </p>
        </div>
      </div>

      {/* AI Privacy & Consent Modal: Mobile Bottom Sheet */}
      <BottomSheet
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        title="AI Interview Privacy Notice"
        maxHeightClass="max-h-[85vh]"
      >
        <div className="space-y-4 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-xs text-gray-600 space-y-2.5 leading-relaxed">
            <p>
              To conduct your simulated interview, your target role, job description, and submitted answers
              are processed securely by our AI service (Gemini).
            </p>
            <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
              <li>No personal identification numbers or financial data are accepted.</li>
              <li>Your answers are processed as text directly for evaluation; no audio or biometric data is captured.</li>
              <li>The evaluations and scorecards are <strong>practice aids</strong>, not hiring decisions.</li>
              <li>You can delete your session data at any time from your history.</li>
            </ul>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setShowConsentModal(false)}
              className="flex-1 py-3.5 border border-gray-300 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 active:bg-gray-100 min-h-[48px] transition"
            >
              Not Now
            </button>
            <button
              type="button"
              onClick={handleAgreeConsent}
              className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 active:bg-indigo-800 shadow-md min-h-[48px] transition"
            >
              Agree & Start
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
