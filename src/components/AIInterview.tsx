"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
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
import InterviewSetup from "./interview/InterviewSetup";
import InterviewThread from "./interview/InterviewThread";
import InterviewScorecard from "./interview/InterviewScorecard";
import InterviewHistory from "./interview/InterviewHistory";

interface AIInterviewProps {
  user?: { id?: string; name?: string; email?: string; [key: string]: any } | null;
  onGoToDashboard?: () => void;
  onNavigateToTab?: (tabId: string) => void;
}

export default function AIInterview({ user, onGoToDashboard, onNavigateToTab }: AIInterviewProps) {
  const [activeTab, setActiveTab] = useState<"setup" | "session" | "scorecard" | "history">("setup");
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
        const aiPlan = await generateAIInterviewPlan(config);
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
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onGoToDashboard && (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">
                  AI Mock Interview
                </h1>
                <span className="text-2xs text-gray-400 font-medium">Phase 4 Simulator</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("setup")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "setup"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Setup
            </button>
            {currentQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("session")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "session"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Live
              </button>
            )}
            {currentScorecard && (
              <button
                type="button"
                onClick={() => setActiveTab("scorecard")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "scorecard"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Scorecard
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "history"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              History ({sessions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
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
