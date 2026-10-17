"use client";

import React, { useState } from "react";
import {
  SchemeEvaluationResult,
  SchemeClassification,
} from "../../types/scholarships";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Calendar,
  MessageCircle,
  Clock,
  RotateCcw,
} from "lucide-react";

interface EvaluationResultsProps {
  eligible: SchemeEvaluationResult[];
  checkDetails: SchemeEvaluationResult[];
  notEligible: SchemeEvaluationResult[];
  totalEvaluated: number;
  evaluatedAt: string;
  onRetake: () => void;
  onConnectScholar: (schemeName: string) => void;
}

export default function EvaluationResults({
  eligible,
  checkDetails,
  notEligible,
  totalEvaluated,
  evaluatedAt,
  onRetake,
  onConnectScholar,
}: EvaluationResultsProps) {
  const [activeTab, setActiveTab] = useState<SchemeClassification | "all">("eligible");
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(
    eligible.length > 0 ? eligible[0].scheme.id : null
  );

  const toggleExpand = (id: string) => {
    setExpandedSchemeId(expandedSchemeId === id ? null : id);
  };

  const formattedDate = new Date(evaluatedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getFilteredList = (): SchemeEvaluationResult[] => {
    if (activeTab === "all") {
      return [...eligible, ...checkDetails, ...notEligible];
    }
    if (activeTab === "eligible") return eligible;
    if (activeTab === "check_details") return checkDetails;
    return notEligible;
  };

  const listToRender = getFilteredList();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Top Summary Banner */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-indigo-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Instant Rule Engine Evaluation
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Eligibility Results</h2>
            <p className="mt-1 text-xs sm:text-sm text-indigo-200">
              Evaluated against {totalEvaluated} verified scholarship schemes at {formattedDate}.
            </p>
          </div>
          <button
            onClick={onRetake}
            className="self-start sm:self-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-white/20"
          >
            <RotateCcw className="w-4 h-4" /> Edit Profile / Re-evaluate
          </button>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-indigo-700/60">
          <button
            onClick={() => setActiveTab("eligible")}
            className={`p-3 rounded-xl text-left transition ${
              activeTab === "eligible" ? "bg-white/20 ring-2 ring-white/50" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="text-2xl font-black text-emerald-400">{eligible.length}</div>
            <div className="text-xs font-semibold text-indigo-100 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Eligible
            </div>
          </button>

          <button
            onClick={() => setActiveTab("check_details")}
            className={`p-3 rounded-xl text-left transition ${
              activeTab === "check_details" ? "bg-white/20 ring-2 ring-white/50" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="text-2xl font-black text-amber-300">{checkDetails.length}</div>
            <div className="text-xs font-semibold text-indigo-100 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> Check Details
            </div>
          </button>

          <button
            onClick={() => setActiveTab("not_eligible")}
            className={`p-3 rounded-xl text-left transition ${
              activeTab === "not_eligible" ? "bg-white/20 ring-2 ring-white/50" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="text-2xl font-black text-slate-300">{notEligible.length}</div>
            <div className="text-xs font-semibold text-indigo-100 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-slate-300" /> Ineligible
            </div>
          </button>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm font-semibold border-b border-gray-200">
        <button
          onClick={() => setActiveTab("eligible")}
          className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
            activeTab === "eligible"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Eligible Schemes ({eligible.length})
        </button>

        <button
          onClick={() => setActiveTab("check_details")}
          className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
            activeTab === "check_details"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Check Details ({checkDetails.length})
        </button>

        <button
          onClick={() => setActiveTab("not_eligible")}
          className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
            activeTab === "not_eligible"
              ? "bg-gray-700 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <XCircle className="w-4 h-4" /> Not Eligible ({notEligible.length})
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap min-h-[44px] ${
            activeTab === "all" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Show All ({totalEvaluated})
        </button>
      </div>

      {/* List of Results */}
      {listToRender.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
          <p className="font-semibold text-base text-gray-700">No schemes found under this filter.</p>
          <p className="text-xs text-gray-400 mt-1">Select another filter or re-evaluate your profile.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listToRender.map((res) => {
            const isExpanded = expandedSchemeId === res.scheme.id;
            const isEligible = res.classification === "eligible";
            const isCheckDetails = res.classification === "check_details";

            const badgeStyles = isEligible
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : isCheckDetails
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-gray-100 text-gray-600 border-gray-200";

            return (
              <div
                key={res.scheme.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-indigo-200 transition-all"
              >
                {/* Header card summary */}
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeStyles}`}
                        >
                          {isEligible && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {isCheckDetails && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                          {!isEligible && !isCheckDetails && <XCircle className="w-3.5 h-3.5 text-gray-500" />}
                          {isEligible ? "Fully Eligible" : isCheckDetails ? "Check Details" : "Not Eligible"}
                        </span>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 capitalize">
                          {res.scheme.level} Scheme
                        </span>

                        {res.scheme.state && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                            {res.scheme.state}
                          </span>
                        )}

                        {res.isStale && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100">
                            ⚠️ Verification past 90 days
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{res.scheme.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{res.scheme.issuingBody}</p>

                      {/* Benefit and deadline */}
                      <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs">
                        <div className="text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">
                          🎁 {res.scheme.benefit.description}
                        </div>

                        {res.scheme.applicationWindow.closes && (
                          <div className="text-gray-500 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" /> Closes:{" "}
                            {new Date(res.scheme.applicationWindow.closes).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 pt-2 sm:pt-0">
                      <a
                        href={res.scheme.officialSourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        Official Portal <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => onConnectScholar(res.scheme.name)}
                        className="min-h-[44px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Ask Scholar
                      </button>
                    </div>
                  </div>

                  {/* "What would change this?" callout */}
                  {res.whatWouldChangeThis && (
                    <div className="mt-4 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                      <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">What would change this: </span>
                        <span>{res.whatWouldChangeThis}</span>
                      </div>
                    </div>
                  )}

                  {/* Expand / Collapse Rule Breakdown */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => toggleExpand(res.scheme.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 min-h-[44px]"
                    >
                      {isExpanded ? (
                        <>
                          Hide Rule Breakdown <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          View Detailed Rule Breakdown ({res.ruleResults.length} criteria) <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-gray-400">
                      Verified: {new Date(res.scheme.lastVerifiedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Expanded Accordion: Rule Details & Requirements */}
                {isExpanded && (
                  <div className="bg-gray-50/80 border-t border-gray-100 p-6 space-y-4 animate-fade-in">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                      Evaluation Breakdown
                    </h4>

                    <div className="space-y-2">
                      {res.ruleResults.map((rule) => {
                        const isMet = rule.status === "met";
                        const isUnk = rule.status === "unknown";

                        return (
                          <div
                            key={rule.ruleId}
                            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 bg-white ${
                              isMet
                                ? "border-emerald-200"
                                : isUnk
                                ? "border-amber-200"
                                : "border-rose-200"
                            }`}
                          >
                            {isMet ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            ) : isUnk ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">{rule.label}</span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    isMet
                                      ? "bg-emerald-100 text-emerald-800"
                                      : isUnk
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {rule.status}
                                </span>
                              </div>
                              <p className="text-gray-600 mt-1">{rule.reason}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Required Documents */}
                    {res.scheme.requiredDocuments.length > 0 && (
                      <div className="pt-2">
                        <h5 className="text-xs font-bold text-gray-700 mb-2">Mandatory Documents:</h5>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-gray-600">
                          {res.scheme.requiredDocuments.map((doc, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Official Disclaimer */}
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-[11px] text-amber-800">
                      ℹ️ <strong>Official Notice:</strong> This eligibility check is a deterministic guide based on information verified by ResuMentor on {new Date(res.scheme.lastVerifiedDate).toLocaleDateString()}. Confirm final rules and apply only on the official government website ({res.scheme.issuingBody}).
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
