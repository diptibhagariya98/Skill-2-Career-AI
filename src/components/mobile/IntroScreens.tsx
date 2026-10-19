"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  Briefcase,
  MessageSquare,
  Award,
  Compass,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Volume2,
  X,
} from "lucide-react";
import ResuMentorBrandLogo from "@/shared/ui/ResuMentorBrandLogo";
import { hapticLight, useBackHandler, BackPriority } from "@/shared/platform";
import { APP_ROUTES } from "@/constants/endpoints";

export interface IntroScreensProps {
  /**
   * Called when the user finishes the intro (taps "Get Started", "Skip", or "I already have an account")
   */
  onFinish?: (action: "signup" | "login" | "guest") => void;
  /**
   * When true, renders inside a closeable modal overlay (e.g. when replayed from Profile / Settings)
   */
  isReplayModal?: boolean;
  /**
   * Close callback when in modal mode
   */
  onCloseModal?: () => void;
}

export const INTRO_STORAGE_KEY = "resumentor_intro_seen";

export default function IntroScreens({
  onFinish,
  isReplayModal = false,
  onCloseModal,
}: IntroScreensProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // In-screen back navigation for Intro slide tour
  useBackHandler(BackPriority.IN_SCREEN, () => {
    if (isReplayModal && onCloseModal) {
      onCloseModal();
      return true;
    }
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      return true;
    }
    return false;
  }, [currentStep, isReplayModal, onCloseModal]);

  const screens = [
    {
      id: "resume-jobs",
      badge: "AI Resume & Smart Matching",
      headline: "Accelerate Your Tech Career",
      body: "Craft ATS-optimized resumes in seconds and discover curated hidden jobs matched to your verified skills.",
      accent: "from-indigo-600 to-blue-600",
      pillBg: "bg-indigo-50 text-indigo-700 border-indigo-100",
      themeColor: "#4f46e5",
      renderIllustration: () => (
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/4.5] flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/15 via-blue-400/20 to-teal-400/10 rounded-3xl blur-2xl -z-10" />

          {/* Main Card (Resume Preview Mock) */}
          <div className="w-[88%] bg-white rounded-2xl shadow-xl border border-gray-150 p-4 relative overflow-hidden transition-all duration-300 transform">
            {/* Header / Avatar row */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="h-3 w-28 bg-gray-800 rounded-full mb-1.5" />
                <div className="h-2 w-20 bg-indigo-300 rounded-full" />
              </div>
            </div>

            {/* Resume Skeleton Lines */}
            <div className="mt-3.5 space-y-2">
              <div className="h-2.5 w-full bg-gray-100 rounded-full" />
              <div className="h-2.5 w-5/6 bg-gray-100 rounded-full" />
              <div className="h-2.5 w-4/6 bg-gray-100 rounded-full" />
            </div>

            {/* Skills Pills */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-150">
                React.js
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-150">
                Python
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-150">
                AI / ML
              </span>
            </div>

            {/* Floating ATS Badge */}
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-bl-xl rounded-tr-xl shadow-md flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 animate-spin text-amber-200" style={{ animationDuration: "4s" }} />
              ATS Score 98%
            </div>
          </div>

          {/* Floating Job Match Pill */}
          <div className="absolute -bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-indigo-100 flex items-center gap-2.5 animate-bounce" style={{ animationDuration: "3s" }}>
            <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-900 leading-none">Off-Portal Role Matched</p>
              <p className="text-[9px] text-teal-600 font-medium mt-0.5">₹12 LPA · Full-time</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ai-interview",
      badge: "Real-time AI Mock Coach",
      headline: "Ace Realistic AI Interviews",
      body: "Practice HR and technical rounds with live rubric scoring, voice evaluations, and actionable feedback.",
      accent: "from-teal-600 to-cyan-600",
      pillBg: "bg-teal-50 text-teal-700 border-teal-100",
      themeColor: "#0d9488",
      renderIllustration: () => (
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/4.5] flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/15 via-cyan-400/20 to-indigo-400/10 rounded-3xl blur-2xl -z-10" />

          {/* Main Interview Coach Card */}
          <div className="w-[88%] bg-white rounded-2xl shadow-xl border border-gray-150 p-4 relative overflow-hidden transition-all duration-300">
            {/* Live Session Status */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-[11px] font-bold text-gray-800">Live AI Mock Round</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                03:45
              </span>
            </div>

            {/* AI Question Prompt */}
            <div className="mt-3 bg-teal-50/60 p-2.5 rounded-xl border border-teal-100/70">
              <div className="flex items-center gap-1.5 text-teal-700 text-[10px] font-bold">
                <MessageSquare className="h-3 w-3" />
                <span>AI Interviewer Question</span>
              </div>
              <p className="text-[11px] text-gray-700 mt-1 font-medium leading-snug">
                &ldquo;Walk me through your optimization of database queries for scale.&rdquo;
              </p>
            </div>

            {/* Speech Waveform Visual */}
            <div className="mt-3.5 flex items-center justify-center gap-1.5 py-2 bg-gray-50 rounded-lg">
              <Volume2 className="h-3.5 w-3.5 text-teal-600 mr-1" />
              {[12, 24, 16, 32, 20, 28, 14, 22].map((height, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-teal-500 to-cyan-400 rounded-full"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            {/* Instant Rubric Score */}
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-medium">Clarity & Confidence</span>
              <span className="text-xs font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                92 / 100
              </span>
            </div>
          </div>

          {/* Floating Tip Badge */}
          <div className="absolute -bottom-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-teal-100 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span className="text-[10px] font-bold text-gray-800">Rubric Feedback Generated</span>
          </div>
        </div>
      ),
    },
    {
      id: "scholarships-roadmaps",
      badge: "Eligibility & Career Roadmaps",
      headline: "Unlock Scholarships & Roadmaps",
      body: "Instant eligibility checker for schemes like MYSY with document checklists and step-by-step career roadmaps.",
      accent: "from-amber-500 to-orange-500",
      pillBg: "bg-amber-50 text-amber-700 border-amber-100",
      themeColor: "#f59e0b",
      renderIllustration: () => (
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/4.5] flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/15 via-orange-400/20 to-indigo-400/10 rounded-3xl blur-2xl -z-10" />

          {/* Main Card */}
          <div className="w-[88%] bg-white rounded-2xl shadow-xl border border-gray-150 p-4 relative overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-200">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">MYSY Grant Verified</h4>
                <p className="text-[10px] text-amber-600 font-semibold">100% Eligible · Up to ₹50,000/yr</p>
              </div>
            </div>

            {/* Checklist items */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-150">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-900">Income Certificate Validated</span>
              </div>
              <div className="flex items-center gap-2 bg-sky-50/70 p-1.5 rounded-lg border border-sky-150">
                <TrendingUp className="h-3.5 w-3.5 text-sky-600" />
                <span className="text-[10px] font-semibold text-sky-900">80+ Percentile Benchmark Met</span>
              </div>
            </div>

            {/* Career Track Pill */}
            <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-[10px] font-bold text-gray-700">Full-Stack Roadmap</span>
              </div>
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Step 3 of 6
              </span>
            </div>
          </div>

          {/* Floating Mentor Verified */}
          <div className="absolute -bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-amber-100 flex items-center gap-2 animate-pulse" style={{ animationDuration: "2.5s" }}>
            <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-gray-900 leading-none">Verified Scholar Mentors</p>
              <p className="text-[8px] text-gray-400 font-medium mt-0.5">1-on-1 Guidance Available</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = screens[currentStep];
  const isLastStep = currentStep === screens.length - 1;

  const markIntroSeen = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(INTRO_STORAGE_KEY, "true");
      } catch {
        // Safe fallback if local storage restricted
      }
    }
  };

  const handleNext = () => {
    hapticLight();
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete("signup");
    }
  };

  const handleSkip = () => {
    hapticLight();
    // Skipping saves intro seen and proceeds to get started
    markIntroSeen();
    if (onFinish) {
      onFinish("signup");
    } else if (onCloseModal) {
      onCloseModal();
    } else {
      router.replace(APP_ROUTES.AUTH);
    }
  };

  const handleComplete = (action: "signup" | "login" | "guest") => {
    hapticLight();
    markIntroSeen();
    if (onFinish) {
      onFinish(action);
    } else if (onCloseModal) {
      onCloseModal();
    } else {
      if (action === "login") {
        router.replace(`${APP_ROUTES.AUTH}?mode=login`);
      } else if (action === "guest") {
        router.replace(`${APP_ROUTES.DASHBOARD}?guest=true`);
      } else {
        router.replace(APP_ROUTES.AUTH);
      }
    }
  };

  // Touch Swipe Gesture Handlers (Smooth native swipe left/right)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diffX = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45; // dp threshold

    if (diffX > minSwipeDistance) {
      // Swiped Left -> Next
      if (!isLastStep) {
        hapticLight();
        setCurrentStep((prev) => prev + 1);
      }
    } else if (diffX < -minSwipeDistance) {
      // Swiped Right -> Previous
      if (currentStep > 0) {
        hapticLight();
        setCurrentStep((prev) => prev - 1);
      }
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && !isLastStep) {
        setCurrentStep((prev) => prev + 1);
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, isLastStep]);

  return (
    <div
      className={`min-h-dvh bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900 flex flex-col justify-between select-none relative overflow-hidden ${
        isReplayModal ? "p-0" : "w-full"
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="App Introduction"
    >
      {/* Top Safe Area & Top Bar (~8% height) */}
      <header className="w-full pt-[calc(var(--sat,env(safe-area-inset-top,0px))+0.75rem)] px-5 pb-2 flex items-center justify-between z-20">
        {/* Brand Logo & Name */}
        <ResuMentorBrandLogo variant="ready" colorScheme="indigo" size="sm" showWordmark={true} theme="light" />

        {/* Skip or Close Button */}
        {isReplayModal ? (
          <button
            onClick={onCloseModal}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center transition"
            aria-label="Close Tour"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          !isLastStep && (
            <button
              onClick={handleSkip}
              className="text-xs font-bold text-gray-500 hover:text-indigo-600 px-3 py-1.5 rounded-full hover:bg-gray-100 transition min-h-[44px] flex items-center justify-center"
              aria-label="Skip Introduction"
            >
              Skip
            </button>
          )
        )}
      </header>

      {/* Middle Zone: Illustration Area (~50 to 55% height) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 relative z-10">
        <div
          key={current.id}
          className="w-full flex flex-col items-center justify-center transition-all duration-300 ease-out animate-fade-in"
        >
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border mb-4 shadow-2xs ${current.pillBg}`}
          >
            <Sparkles className="h-3 w-3" />
            <span>{current.badge}</span>
          </div>

          {/* Illustration Container (4:5 / 1:1 box, scaled smoothly) */}
          <div className="w-full flex items-center justify-center my-1">
            {current.renderIllustration()}
          </div>
        </div>
      </main>

      {/* Lower Zone: Text, Page Dots & Primary Actions (~35% height) */}
      <footer className="w-full px-5 pb-[calc(var(--sab,env(safe-area-inset-bottom,0px))+1.25rem)] pt-2 flex flex-col items-center z-20">
        {/* Text Block (~20% height): Headline (max 6 words) + Body */}
        <div className="w-full text-center max-w-sm mb-5 transition-all duration-300">
          <h2 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-gray-900 leading-tight mb-2">
            {current.headline}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed line-clamp-2 px-1">
            {current.body}
          </p>
        </div>

        {/* Page Dots Indicator (~4% height) */}
        <div
          className="flex items-center justify-center gap-1.5 mb-5"
          role="tablist"
          aria-label="Screen page indicators"
        >
          {screens.map((screen, idx) => {
            const isActive = idx === currentStep;
            return (
              <button
                key={screen.id}
                onClick={() => {
                  hapticLight();
                  setCurrentStep(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 min-h-[32px] flex items-center justify-center px-1 ${
                  isActive ? "w-7 bg-indigo-600" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
                aria-selected={isActive}
                role="tab"
              >
                <span className="sr-only">Slide {idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Primary Call-to-Action Buttons (~10% height) */}
        <div className="w-full max-w-sm space-y-2.5">
          {!isLastStep ? (
            <button
              onClick={handleNext}
              className="w-full h-13 sm:h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all min-h-[52px]"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="space-y-2">
              {/* Primary Action: Get Started */}
              <button
                onClick={() => handleComplete("signup")}
                className="w-full h-13 sm:h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all min-h-[52px]"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Secondary Options */}
              <div className="flex items-center justify-between pt-1 px-1">
                <button
                  onClick={() => handleComplete("login")}
                  className="text-xs font-bold text-gray-600 hover:text-indigo-600 transition min-h-[44px] flex items-center"
                >
                  I already have an account
                </button>

                <button
                  onClick={() => handleComplete("guest")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition min-h-[44px] flex items-center"
                >
                  Explore as Guest &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
