"use client";

import React from "react";
import { AnalysisResponse, ActionStep, CategoryScore } from "@/types/analysis";
import { SectionKey } from "@/types/resume";
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  RotateCw,
  X,
  Clock,
  KeyRound,
  Info,
} from "lucide-react";

interface AIAnalysisReportProps {
  analysis: AnalysisResponse;
  isOutOfDate: boolean;
  isAnalyzing: boolean;
  onReanalyze: () => void;
  onExportPDF: () => void;
  onNavigateToSection: (section: SectionKey) => void;
  onClose: () => void;
}

export default function AIAnalysisReport({
  analysis,
  isOutOfDate,
  isAnalyzing,
  onReanalyze,
  onExportPDF,
  onNavigateToSection,
  onClose,
}: AIAnalysisReportProps) {
  const {
    overallScore,
    rating,
    categoryScores,
    strengths,
    improvements,
    actionSteps,
    missingKeywords,
    summary,
    analyzedAt,
    source,
    remainingQuota,
  } = analysis;

  // Rating badge styling
  const getRatingStyle = (r: string) => {
    switch (r) {
      case "excellent":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          bar: "bg-emerald-600",
          label: "Excellent",
        };
      case "good":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          bar: "bg-blue-600",
          label: "Good",
        };
      case "fair":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          bar: "bg-amber-600",
          label: "Fair",
        };
      default:
        return {
          bg: "bg-red-50 text-red-800 border-red-200",
          bar: "bg-red-600",
          label: "Needs Work",
        };
    }
  };

  const ratingStyle = getRatingStyle(rating);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Sparkles className="h-5 w-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                AI ATS Analysis Report
              </h2>
              <p className="text-xs text-indigo-200">
                {source === "ai" ? "Gemini Recruiter & ATS Engine" : "Rule-Based Deterministic Engine"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
            aria-label="Close report"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Out of Date Banner */}
        {isOutOfDate && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>Resume has been modified since this analysis.</span>
            </div>
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={onReanalyze}
              className="font-bold underline hover:text-amber-950 flex items-center gap-1 disabled:opacity-50"
            >
              <RotateCw className={`h-3 w-3 ${isAnalyzing ? "animate-spin" : ""}`} />
              Re-analyze now
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800 text-sm">
          {/* Top Scorecard & Rating */}
          <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl p-5 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-md ${ratingStyle.bar}`}
                >
                  <span className="text-3xl leading-none">{overallScore}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">/ 100</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${ratingStyle.bg}`}
                  >
                    {ratingStyle.label}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">ATS Score</span>
                </div>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed max-w-md">
                  {summary}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={onReanalyze}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-2xs disabled:opacity-50 min-h-[38px]"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                Re-analyze
              </button>
              <button
                type="button"
                onClick={onExportPDF}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-xs min-h-[38px]"
              >
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Category Breakdown (Section 3.4 & 3.9) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Scoring Category Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {categoryScores.map((cat, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-2xs hover:border-gray-200 transition"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-800 mb-1.5">
                    <span className="font-bold">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">Weight: {cat.weight}%</span>
                      <span className="font-bold text-indigo-700">{cat.score}/100</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.score >= 80
                          ? "bg-emerald-500"
                          : cat.score >= 60
                          ? "bg-indigo-500"
                          : cat.score >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">{cat.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Three Headed Bulleted Sections: Strengths, Improvements, Action Steps */}

          {/* 1. Strengths */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Key Strengths ({strengths.length})
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700">
              {strengths.map((str, idx) => (
                <li
                  key={idx}
                  className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-3 leading-relaxed flex items-start gap-2"
                >
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Improvements */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Prioritized Improvement Areas ({improvements.length})
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700">
              {improvements.map((imp, idx) => (
                <li
                  key={idx}
                  className="bg-amber-50/50 border border-amber-100/80 rounded-xl p-3 leading-relaxed flex items-start gap-2"
                >
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Action Steps (Interactive Navigation to Form Fields) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRight className="h-4 w-4 text-indigo-600" />
              Interactive Action Steps (Tap to Fix)
            </h3>
            <div className="space-y-2">
              {actionSteps.map((step, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onNavigateToSection(step.targetSection)}
                  className="w-full text-left bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/30 p-3.5 rounded-xl transition shadow-2xs flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-gray-900 group-hover:text-indigo-700 transition">
                        {step.title}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          step.expectedImpact === "high"
                            ? "bg-red-100 text-red-800"
                            : step.expectedImpact === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {step.expectedImpact} Impact
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 pl-7 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                    <span className="capitalize">{step.targetSection}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Missing Keywords (if job description was provided) */}
          {missingKeywords && missingKeywords.length > 0 && (
            <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <KeyRound className="h-4 w-4 text-purple-600" />
                Target Keywords to Consider
              </div>
              <p className="text-[11px] text-purple-700 italic">
                * Note: Add these terms only if true for your background and experience. Never fabricate credentials.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {missingKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="bg-white border border-purple-200 text-purple-900 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs"
                  >
                    +{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Analyzed on {new Date(analyzedAt).toLocaleString()}
            </span>
            {remainingQuota && (
              <span>
                Quota: {remainingQuota.hourly}/5 remaining this hour ({remainingQuota.daily}/20 today)
              </span>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
