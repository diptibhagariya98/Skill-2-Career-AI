"use client";

import React, { useRef, useState } from "react";
import {
  Award,
  Download,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  FileText,
  Trash2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { InterviewScorecardData } from "../../types/interview";
import { savePdfAndShare, hapticSuccess } from "@/shared/platform";
import { toast } from "react-hot-toast";

interface InterviewScorecardProps {
  scorecard: InterviewScorecardData;
  onRetake: () => void;
  onNewSession: () => void;
  onDeleteSession?: () => void;
  onNavigateToTab?: (tabId: string) => void;
}

export default function InterviewScorecard({
  scorecard,
  onRetake,
  onNewSession,
  onDeleteSession,
  onNavigateToTab,
}: InterviewScorecardProps) {
  const [expandedTurnId, setExpandedTurnId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const getRecommendationBadge = () => {
    switch (scorecard.recommendation) {
      case "Strong hire":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Hire":
        return "bg-green-100 text-green-800 border-green-300";
      case "Lean hire":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Lean no hire":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "No hire":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    setIsExportingPdf(true);
    const toastId = toast.loading("Generating scorecard PDF…");

    try {
      // Dynamic client-side import for Capacitor & static export compatibility
      const html2pdf = (await import("html2pdf.js")).default;
      const safeJobTitle = scorecard.targetJobTitle.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "Role";
      const filename = `Scorecard_${safeJobTitle}.pdf`;

      const opt = {
        margin: [10, 10, 10, 10],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      const worker = html2pdf().set(opt).from(printableRef.current);
      const pdfBlob = (await worker.outputPdf("blob")) as Blob;

      if (!pdfBlob || pdfBlob.size < 500) {
        throw new Error("Generated PDF was empty or incomplete.");
      }

      const res = await savePdfAndShare(pdfBlob, filename, {
        shareText: `Official Mock Interview Scorecard - ${scorecard.targetJobTitle} (Score: ${scorecard.overallScore}/100)`,
        dialogTitle: `Save or share ${filename}`,
      });

      if (res.ok && res.delivered) {
        hapticSuccess();
        toast.success(res.message, { id: toastId });
      } else if (res.ok) {
        toast.dismiss(toastId);
      } else {
        toast.error(res.message || "Failed to deliver scorecard PDF", { id: toastId });
      }
    } catch (err: unknown) {
      console.error("Scorecard PDF export failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to generate scorecard PDF";
      toast.error(msg, { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-extrabold text-gray-900">Official Interview Scorecard</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRetake}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            Retake Setup
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            {isExportingPdf ? "Generating PDF…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Main Printable Scorecard Container */}
      <div
        ref={printableRef}
        className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-8 space-y-8"
      >
        {/* Header Hero Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
                ResuMentor Mock Simulator
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 font-medium">{scorecard.date}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {scorecard.targetJobTitle}
            </h1>
            <p className="text-xs text-gray-500 mt-1 capitalize font-medium">
              Level: {scorecard.experienceLevel} • Mode: {scorecard.interviewMode.replace("_", " ")} •{" "}
              {scorecard.answeredCount} of {scorecard.totalQuestions} questions answered
            </p>
          </div>

          {/* Overall Score Badge */}
          <div className="flex items-center gap-4 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-black shadow-md">
              <span className="text-2xl leading-none">{scorecard.overallScore}</span>
              <span className="text-3xs uppercase tracking-wider text-indigo-200">/ 100</span>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 block uppercase">Overall Rating</span>
              <span className="text-base font-extrabold text-indigo-900">{scorecard.ratingWord}</span>
            </div>
          </div>
        </div>

        {/* Hiring Recommendation & Disclaimer Banner (Spec 6.3) */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Simulated Hiring Recommendation
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getRecommendationBadge()}`}
            >
              {scorecard.recommendation}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-sans">
            {scorecard.recommendationReasoning}
          </p>
          <div className="pt-2 border-t border-gray-200/60 flex items-start gap-2 text-2xs text-gray-500 italic">
            <ShieldAlert className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <span>{scorecard.disclaimer}</span>
          </div>
        </div>

        {/* 3 Dimension Scores Grid (Spec 5.1 & 6.2) */}
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 mb-3 uppercase tracking-wider">
            Evaluation Dimensions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Accuracy */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">Answer Accuracy</span>
                <span className="font-black text-indigo-600">
                  {scorecard.dimensionAverages.accuracy}/10
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${scorecard.dimensionAverages.accuracy * 10}%` }}
                />
              </div>
              <p className="text-2xs text-gray-500 leading-tight">
                Technical completeness and sound reasoning.
              </p>
            </div>

            {/* Confidence */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">Confidence (Wording)</span>
                <span className="font-black text-purple-600">
                  {scorecard.dimensionAverages.confidence}/10
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${scorecard.dimensionAverages.confidence * 10}%` }}
                />
              </div>
              <p className="text-2xs text-gray-500 leading-tight">
                Decisive wording, clear ownership (&quot;I did&quot;, &quot;I built&quot;).
              </p>
            </div>

            {/* Context Correctness */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">Context-Correctness</span>
                <span className="font-black text-emerald-600">
                  {scorecard.dimensionAverages.context}/10
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${scorecard.dimensionAverages.context * 10}%` }}
                />
              </div>
              <p className="text-2xs text-gray-500 leading-tight">
                Relevance to role, level, and situation context.
              </p>
            </div>
          </div>
        </div>

        {/* Strengths & Areas to Improve */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Key Strengths
            </div>
            <ul className="list-disc pl-4 space-y-1.5 text-xs text-emerald-950 font-medium">
              {scorecard.strengths.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Areas to Improve
            </div>
            <ul className="list-disc pl-4 space-y-1.5 text-xs text-amber-950 font-medium">
              {scorecard.areasToImprove.map((area, idx) => (
                <li key={idx}>{area}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Skills Coverage Matrix (Spec 6.2) */}
        {scorecard.skillsCoverage.length > 0 && (
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 mb-3 uppercase tracking-wider">
              Tested Competency Coverage
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {scorecard.skillsCoverage.map((sc) => (
                <div
                  key={sc.skill}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex flex-col justify-between"
                >
                  <span className="font-bold text-gray-800 block truncate">{sc.skill}</span>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                    <span className="text-2xs text-gray-500 font-medium">{sc.testedCount} Qs</span>
                    <span
                      className={`text-2xs font-extrabold px-2 py-0.5 rounded-md ${
                        sc.status === "strong"
                          ? "bg-emerald-100 text-emerald-700"
                          : sc.status === "adequate"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {sc.averageScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question-by-Question Review (Collapsible Accordion) */}
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 mb-3 uppercase tracking-wider">
            Detailed Question Review ({scorecard.turns.length})
          </h2>
          <div className="space-y-3">
            {scorecard.turns.map((turn, idx) => {
              const isExpanded = expandedTurnId === turn.id;
              return (
                <div
                  key={turn.id}
                  className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedTurnId(isExpanded ? null : turn.id)}
                    className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-gray-900 line-clamp-1">
                          {turn.questionText}
                        </span>
                        <span className="text-2xs text-gray-500 capitalize">
                          {turn.targetSkill || "Core Topic"} • Score:{" "}
                          {turn.isSkipped ? "Skipped (0)" : `${turn.evaluation?.answerScore || 0}/100`}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-gray-600 uppercase text-2xs block mb-1">
                          Your Answer:
                        </span>
                        <div className="p-3 bg-white rounded-xl border border-gray-200 font-sans leading-relaxed text-gray-800">
                          {turn.userAnswer}
                        </div>
                      </div>

                      {turn.evaluation && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-white rounded-lg border border-gray-200">
                            <span className="text-3xs text-gray-500 block">Accuracy</span>
                            <span className="font-extrabold text-indigo-600">
                              {turn.evaluation.accuracyScore}/10
                            </span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-gray-200">
                            <span className="text-3xs text-gray-500 block">Confidence</span>
                            <span className="font-extrabold text-purple-600">
                              {turn.evaluation.confidenceScore}/10
                            </span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-gray-200">
                            <span className="text-3xs text-gray-500 block">Context</span>
                            <span className="font-extrabold text-emerald-600">
                              {turn.evaluation.contextScore}/10
                            </span>
                          </div>
                        </div>
                      )}

                      {turn.evaluation?.reasons && (
                        <div className="space-y-1 text-2xs text-gray-600">
                          <div>
                            <strong>Accuracy Reason:</strong> {turn.evaluation.reasons.accuracy}
                          </div>
                          <div>
                            <strong>Context Reason:</strong> {turn.evaluation.reasons.context}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Next Steps (Spec 11: Links to Modules) */}
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 mb-3 uppercase tracking-wider">
            Recommended Next Steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => onNavigateToTab?.("learn")}
              className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 cursor-pointer hover:border-indigo-300 transition-all flex items-start gap-3"
            >
              <div className="p-2 bg-indigo-600 text-white rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-gray-900">Learn & Practice Hub</h3>
                <p className="text-2xs text-gray-600 mt-0.5">
                  Review roadmaps and take technical quizzes on topics you missed.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-600 mt-1" />
            </div>

            <div
              onClick={() => onNavigateToTab?.("resume")}
              className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 cursor-pointer hover:border-blue-300 transition-all flex items-start gap-3"
            >
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-gray-900">ATS Resume Builder</h3>
                <p className="text-2xs text-gray-600 mt-0.5">
                  Incorporate the stronger answers into your bullet points for interview alignment.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="flex items-center justify-between pt-2">
        {onDeleteSession && (
          <button
            type="button"
            onClick={onDeleteSession}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Session Record
          </button>
        )}
        <button
          type="button"
          onClick={onNewSession}
          className="ml-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
        >
          Start New Mock Interview
        </button>
      </div>
    </div>
  );
}
