"use client";

import React, { useState } from "react";
import { CheckCircle2, Star, Sparkles, BookOpen, AlertCircle, ArrowRight } from "lucide-react";
import { BankQuestion, KeyPoint } from "../../types/interview";

interface OpenAnswerCompareProps {
  question: BankQuestion;
  candidateAnswer: string;
  initialAutomatedTicks: string[];
  onConfirmEvaluation: (selectedKpIds: string[], confidenceRating: number) => void;
}

export default function OpenAnswerCompare({
  question,
  candidateAnswer,
  initialAutomatedTicks,
  onConfirmEvaluation,
}: OpenAnswerCompareProps) {
  const [currentStep, setCurrentStep] = useState<"compare" | "self_check">("compare");
  const [selectedKpIds, setSelectedKpIds] = useState<string[]>(initialAutomatedTicks);
  const [confidenceRating, setConfidenceRating] = useState<number>(3);

  const toggleKeyPoint = (id: string) => {
    setSelectedKpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const keyPoints = question.keyPoints || [];
  const automatedScore =
    keyPoints.length > 0 ? Math.round((initialAutomatedTicks.length / keyPoints.length) * 100) : 100;
  const userScore =
    keyPoints.length > 0 ? Math.round((selectedKpIds.length / keyPoints.length) * 100) : 100;
  const blendedScore = Math.round((automatedScore + userScore) / 2);

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-md p-5 space-y-5 animate-in fade-in duration-300">
      {/* Step Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            {currentStep === "compare" ? "1" : "2"}
          </span>
          <span className="text-sm font-bold text-gray-800">
            {currentStep === "compare" ? "Step 1: Model Answer Comparison" : "Step 2: Self-Evaluation & Confidence"}
          </span>
        </div>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
          Quick Practice Base Mode
        </span>
      </div>

      {currentStep === "compare" ? (
        <div className="space-y-4">
          {/* Candidate answer recall */}
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Your Answer:
            </span>
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-800 border border-gray-200 max-h-32 overflow-y-auto font-sans leading-relaxed">
              {candidateAnswer}
            </div>
          </div>

          {/* Model Answer */}
          {question.modelAnswer && (
            <div>
              <div className="flex items-center gap-1.5 mb-1 text-emerald-700">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Reference Model Answer:</span>
              </div>
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed font-sans">
                {question.modelAnswer}
              </div>
            </div>
          )}

          {/* Automated Key Point Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">
                Automated Key Concept Analysis:
              </span>
              <span className="text-xs font-bold text-indigo-600">
                Found {initialAutomatedTicks.length} of {keyPoints.length} points
              </span>
            </div>

            <div className="space-y-2">
              {keyPoints.map((kp) => {
                const isAutoFound = initialAutomatedTicks.includes(kp.id);
                return (
                  <div
                    key={kp.id}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs transition-colors ${
                      isAutoFound
                        ? "bg-indigo-50/50 border-indigo-200 text-indigo-950"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isAutoFound ? "text-indigo-600" : "text-gray-300"
                      }`}
                    />
                    <div className="flex-1">
                      <span className="font-semibold block">{kp.point}</span>
                      <span className="text-2xs text-gray-500">
                        {isAutoFound ? "✓ Matched automatically from your keywords" : "Not detected in keywords"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-2xs text-gray-500 italic">
            Automatic checks look for key words and cannot judge quality. Next, you will verify the checklist against your actual meaning.
          </p>

          <button
            type="button"
            onClick={() => setCurrentStep("self_check")}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            Proceed to Self-Check
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Self Check step */
        <div className="space-y-5">
          <div>
            <span className="text-xs font-bold text-gray-800 block mb-1">
              Confirm which key points you effectively explained:
            </span>
            <div className="space-y-2 mt-2">
              {keyPoints.map((kp) => {
                const isChecked = selectedKpIds.includes(kp.id);
                return (
                  <label
                    key={kp.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? "bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleKeyPoint(kp.id)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium leading-relaxed">{kp.point}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Delivery Confidence Rating */}
          <div>
            <span className="text-xs font-bold text-gray-800 block mb-1">
              Rate your own delivery confidence (1 - 5):
            </span>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setConfidenceRating(star)}
                  className={`p-2.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                    confidenceRating === star
                      ? "bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-xs"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      confidenceRating >= star ? "fill-amber-400 text-amber-500" : "text-gray-300"
                    }`}
                  />
                  <span className="text-xs">{star}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Score Card */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500 block">50/50 Blended Open Score</span>
              <span className="font-extrabold text-indigo-600 text-sm">
                {blendedScore}/100
              </span>
            </div>
            <div className="text-right text-2xs text-gray-500">
              <div>Auto Key-Points: {automatedScore}%</div>
              <div>Self-Confirmed: {userScore}%</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep("compare")}
              className="py-3 px-4 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => onConfirmEvaluation(selectedKpIds, confidenceRating)}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Evaluation & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
