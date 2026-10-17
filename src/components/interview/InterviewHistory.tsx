"use client";

import React from "react";
import {
  History,
  RotateCcw,
  Eye,
  Trash2,
  TrendingUp,
  Award,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { InterviewScorecardData, InterviewSessionRecord } from "../../types/interview";

interface InterviewHistoryProps {
  sessions: InterviewSessionRecord[];
  onViewScorecard: (scorecard: InterviewScorecardData) => void;
  onRetakeSession: (session: InterviewSessionRecord) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
}

export default function InterviewHistory({
  sessions,
  onViewScorecard,
  onRetakeSession,
  onDeleteSession,
  onClearAll,
}: InterviewHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 max-w-xl mx-auto shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <History className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-extrabold text-gray-900">No Past Sessions Yet</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Completed mock interviews will be saved here so you can track score trends over time,
          review weak dimensions, and download past scorecards.
        </p>
      </div>
    );
  }

  // Calculate trends
  const completedSessions = sessions.filter((s) => s.scorecard);
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.scorecard?.overallScore || 0), 0) /
            completedSessions.length
        )
      : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Stats Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Interview History & Score Trends
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Track your performance progress and review previous simulator scorecards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 px-4 py-2 rounded-xl text-center border border-indigo-100">
            <span className="text-2xs text-gray-500 block uppercase font-bold">Average Score</span>
            <span className="text-lg font-black text-indigo-600">{avgScore}/100</span>
          </div>

          <button
            type="button"
            onClick={onClearAll}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Clear all session history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Session Cards List */}
      <div className="space-y-4">
        {sessions.map((sess) => {
          const sc = sess.scorecard;
          return (
            <div
              key={sess.id}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-gray-900">
                    {sess.config.targetJobTitle}
                  </span>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                    {sess.config.experienceLevel}
                  </span>
                  <span
                    className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                      sess.config.interviewMode === "full_ai"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {sess.config.interviewMode === "full_ai" ? "Smart AI" : "Quick Practice"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-2xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{sc?.date || new Date(sess.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{sess.turns.length} Questions</span>
                  {sc && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-indigo-600">{sc.recommendation}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side: Score & Actions */}
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                {sc && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-500 block">Score</span>
                    <span className="text-lg font-black text-indigo-600">{sc.overallScore}/100</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {sc && (
                    <button
                      type="button"
                      onClick={() => onViewScorecard(sc)}
                      className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      title="View scorecard"
                    >
                      <Eye className="w-4 h-4 text-indigo-600" />
                      <span className="hidden sm:inline">Scorecard</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRetakeSession(sess)}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    title="Retake session"
                  >
                    <RotateCcw className="w-4 h-4 text-purple-600" />
                    <span className="hidden sm:inline">Retake</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(sess.id)}
                    className="p-2.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
