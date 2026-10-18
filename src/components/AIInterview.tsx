"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  History,
  Award,
  Zap,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  BankQuestion,
  InterviewScorecardData,
  InterviewSessionRecord,
  InterviewSetupConfig,
  InterviewTurn,
} from "../types/interview";
import {
  generateScorecard,
  selectQuestionsForSession,
} from "../lib/interview/engine";
import { generateAIInterviewPlan } from "../lib/interview/geminiService";
import { loadLocalResume } from "@/lib/resume/storage";
import InterviewSetup from "./interview/InterviewSetup";
import InterviewThread from "./interview/InterviewThread";
import InterviewScorecard from "./interview/InterviewScorecard";
import InterviewHistory from "./interview/InterviewHistory";

interface AIInterviewProps {
  user?: { id?: string; name?: string; email?: string; [key: string]: any } | null;
  onGoToDashboard?: () => void;
  onNavigateToTab?: (tabId: string) => void;
  tab?: "setup" | "session" | "scorecard" | "history";
  onTabChange?: (tab: "setup" | "session" | "scorecard" | "history") => void;
}

export default function AIInterview({
  user,
  onGoToDashboard,
  onNavigateToTab,
  tab: controlledTab,
  onTabChange,
}: AIInterviewProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<"setup" | "session" | "scorecard" | "history">("setup");
  const activeTab = controlledTab !== undefined ? controlledTab : internalActiveTab;
  const setActiveTab = (newTab: "setup" | "session" | "scorecard" | "history") => {
    if (onTabChange) onTabChange(newTab);
    setInternalActiveTab(newTab);
  };
  const [currentConfig, setCurrentConfig] = useState<InterviewSetupConfig | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<BankQuestion[]>([]);
  const [currentScorecard, setCurrentScorecard] = useState<InterviewScorecardData | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [sessions, setSessions] = useState<InterviewSessionRecord[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  const historyKey = user?.id ? `resumentor_interview_history_${user.id}` : "resumentor_interview_history";

  // Load past history from localStorage for this user
  useEffect(() => {
    try {
      const stored = localStorage.getItem(historyKey);
      if (stored) {
        setSessions(JSON.parse(stored));
      } else {
        setSessions([]);
      }
    } catch (e) {
      console.warn("Failed to read session history from localStorage", e);
    }
  }, [historyKey]);

  const saveSessions = (updated: InterviewSessionRecord[]) => {
    setSessions(updated);
    try {
      localStorage.setItem(historyKey, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist session history", e);
    }
  };

  // Start new interview session
  const handleStartSession = async (config: InterviewSetupConfig) => {
    setIsInitializing(true);
    setCurrentConfig(config);
    const sessionId = `mock-${Date.now()}`;
    setCurrentSessionId(sessionId);

    let preparedQuestions: BankQuestion[] = [];

    // Full AI Dynamic Planning
    if (config.interviewMode === "full_ai") {
      try {
        let resumeSnippet = "";
        if (config.useResume && user?.id) {
          const userResume = loadLocalResume(user.id);
          if (userResume?.contact?.fullName) {
            resumeSnippet = `Candidate: ${userResume.contact.fullName}. Headline: ${userResume.contact.headline}. Experience: ${userResume.experience.map((e) => `${e.title} at ${e.employer}`).join("; ")}. Skills: ${(userResume.skills.flatList || []).join(", ")}`;
          }
        }

        const aiPlan = await generateAIInterviewPlan({
          ...config,
          resumeContext: resumeSnippet || undefined,
        });
        if (aiPlan.length >= 3) {
          preparedQuestions = aiPlan.map((item, idx) => ({
            id: `ai-q-${idx + 1}`,
            type: "open_answer",
            roles: ["custom"],
            levels: [config.experienceLevel],
            skills: [item.targetSkill || "Core Skill"],
            difficulty: config.difficulty,
            questionText: item.questionText,
            contextOrScenario: item.contextOrRequirement,
            explanation: "Evaluated by AI against target role criteria.",
            estimatedSeconds: 120,
          }));
        }
      } catch (err) {
        console.warn("Falling back to local bank", err);
      }
    }

    // Fallback or Quick Practice base mode
    if (preparedQuestions.length === 0) {
      preparedQuestions = selectQuestionsForSession(config, Date.now());
    }

    setCurrentQuestions(preparedQuestions);
    setIsInitializing(false);
    setActiveTab("session");
  };

  // Finish session & compute scorecard
  const handleFinishSession = (turns: InterviewTurn[]) => {
    if (!currentConfig) return;

    const scorecard = generateScorecard(currentSessionId, currentConfig, turns);
    setCurrentScorecard(scorecard);

    // Save into history
    const sessionRecord: InterviewSessionRecord = {
      id: currentSessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: turns.some((t) => t.isSkipped) && turns.length < currentConfig.questionCount ? "ended_early" : "completed",
      config: currentConfig,
      turns,
      scorecard,
    };

    saveSessions([sessionRecord, ...sessions]);
    setActiveTab("scorecard");
  };

  // Pause session
  const handlePauseSession = (turns: InterviewTurn[]) => {
    if (!currentConfig) return;

    const sessionRecord: InterviewSessionRecord = {
      id: currentSessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "in_progress",
      config: currentConfig,
      turns,
    };

    saveSessions([sessionRecord, ...sessions.filter((s) => s.id !== currentSessionId)]);
    alert("Interview paused. Your progress has been saved to History.");
    setActiveTab("history");
  };

  // Retake with same setup
  const handleRetake = (record?: InterviewSessionRecord) => {
    const configToUse = record?.config || currentConfig;
    if (configToUse) {
      handleStartSession(configToUse);
    } else {
      setActiveTab("setup");
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    const filtered = sessions.filter((s) => s.id !== sessionId);
    saveSessions(filtered);
    if (currentScorecard?.sessionId === sessionId) {
      setCurrentScorecard(null);
      setActiveTab("setup");
    }
  };

  const handleClearAllHistory = () => {
    if (confirm("Are you sure you want to clear all past interview history?")) {
      saveSessions([]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("setup")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "setup"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Setup & Role
          </button>
          {currentQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("session")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "session"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              <Play className="w-4 h-4" /> Live Session
            </button>
          )}
          {currentScorecard && (
            <button
              type="button"
              onClick={() => setActiveTab("scorecard")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "scorecard"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              <Award className="w-4 h-4" /> Scorecard
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "history"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <History className="w-4 h-4" /> Past Sessions ({sessions.length})
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div>
        {isInitializing && (
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-gray-200 shadow-sm animate-pulse space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-600 mx-auto animate-spin" />
            <h3 className="text-base font-bold text-gray-900">Preparing Your Interview Session…</h3>
            <p className="text-xs text-gray-500">
              Generating tailored questions and aligning scoring rubrics with your role.
            </p>
          </div>
        )}

        {!isInitializing && activeTab === "setup" && (
          <InterviewSetup
            onStartSession={handleStartSession}
            initialRole={currentConfig?.targetJobTitle}
          />
        )}

        {!isInitializing && activeTab === "session" && currentConfig && (
          <InterviewThread
            config={currentConfig}
            questions={currentQuestions}
            onFinishSession={handleFinishSession}
            onPauseSession={handlePauseSession}
          />
        )}

        {!isInitializing && activeTab === "scorecard" && currentScorecard && (
          <InterviewScorecard
            scorecard={currentScorecard}
            onRetake={() => handleRetake()}
            onNewSession={() => setActiveTab("setup")}
            onDeleteSession={() => handleDeleteSession(currentScorecard.sessionId)}
            onNavigateToTab={onNavigateToTab}
          />
        )}

        {!isInitializing && activeTab === "history" && (
          <InterviewHistory
            sessions={sessions}
            onViewScorecard={(sc) => {
              setCurrentScorecard(sc);
              setActiveTab("scorecard");
            }}
            onRetakeSession={(s) => handleRetake(s)}
            onDeleteSession={handleDeleteSession}
            onClearAll={handleClearAllHistory}
          />
        )}
      </div>
    </div>
  );
}
