"use client";

import React, { useState } from "react";
import { ScholarshipScheme, SchemeLevel } from "../../types/scholarships";
import {
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Building,
  CheckCircle2,
  ChevronRight,
  X,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { openUrl, useBackHandler, BackPriority } from "@/shared/platform";

interface SchemeDirectoryProps {
  schemes: ScholarshipScheme[];
  onCheckEligibilityForScheme: (scheme: ScholarshipScheme) => void;
  onAskScholar: (schemeName: string) => void;
}

export default function SchemeDirectory({
  schemes,
  onCheckEligibilityForScheme,
  onAskScholar,
}: SchemeDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SchemeLevel | "all">("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [activeModalScheme, setActiveModalScheme] = useState<ScholarshipScheme | null>(null);

  useBackHandler(BackPriority.OVERLAY, () => {
    if (activeModalScheme) {
      setActiveModalScheme(null);
      return true;
    }
    return false;
  }, [activeModalScheme]);

  // Filter schemes
  const filteredSchemes = schemes.filter((scheme) => {
    // 1. Text search
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      scheme.name.toLowerCase().includes(q) ||
      scheme.shortName.toLowerCase().includes(q) ||
      scheme.issuingBody.toLowerCase().includes(q) ||
      (scheme.state && scheme.state.toLowerCase().includes(q));

    // 2. Level filter
    const matchesLevel = selectedLevel === "all" || scheme.level === selectedLevel;

    // 3. State filter
    const matchesState = selectedState === "all" || scheme.state === selectedState;

    // 4. Open now filter
    const matchesOpen = !onlyOpenNow || scheme.applicationWindow.status === "open";

    return matchesSearch && matchesLevel && matchesState && matchesOpen;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scheme name (e.g. MYSY, Pragati, Post-Matric)..."
              className="w-full pl-11 pr-4 py-3 min-h-[44px] rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as SchemeLevel | "all")}
              className="px-3 py-3 min-h-[44px] rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 bg-white"
            >
              <option value="all">All Levels</option>
              <option value="central">Central Schemes</option>
              <option value="state">State Schemes</option>
            </select>

            <button
              onClick={() => setOnlyOpenNow(!onlyOpenNow)}
              className={`px-4 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold border transition ${
                onlyOpenNow
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              🟢 Open Now
            </button>
          </div>
        </div>

        {/* Quick Tag Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 font-medium">Quick Filters:</span>
          <button
            onClick={() => {
              setSearchQuery("Gujarat");
              setSelectedLevel("state");
            }}
            className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition whitespace-nowrap"
          >
            Gujarat Schemes (MYSY)
          </button>
          <button
            onClick={() => setSearchQuery("Girls")}
            className="px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 font-semibold hover:bg-pink-100 transition whitespace-nowrap"
          >
            Girl Student Quota (Pragati)
          </button>
          <button
            onClick={() => setSearchQuery("SC")}
            className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 transition whitespace-nowrap"
          >
            Post-Matric (SC/ST/OBC)
          </button>
          {(searchQuery || selectedLevel !== "all" || onlyOpenNow) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedLevel("all");
                setOnlyOpenNow(false);
              }}
              className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition whitespace-nowrap"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 font-medium px-1">
        <span>Showing {filteredSchemes.length} verified scholarship schemes</span>
      </div>

      {/* Grid of Scheme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSchemes.map((scheme) => (
          <div
            key={scheme.id}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 uppercase">
                    {scheme.level}
                  </span>
                  {scheme.state && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                      {scheme.state}
                    </span>
                  )}
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                    Verified
                  </span>
                </div>

                <span className="text-[11px] text-gray-400 font-medium">v{scheme.version}.0</span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition">
                {scheme.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{scheme.issuingBody}</p>

              {/* Benefit Highlights */}
              <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/60">
                <span className="text-xs font-bold text-indigo-900 block">Benefit / Support:</span>
                <span className="text-xs text-indigo-700 font-medium mt-0.5 block">
                  {scheme.benefit.description}
                </span>
              </div>

              {/* Application Window */}
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Deadline: {scheme.applicationWindow.closes ? new Date(scheme.applicationWindow.closes).toLocaleDateString() : "Always Open"}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveModalScheme(scheme)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 min-h-[44px]"
              >
                Full Details <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCheckEligibilityForScheme(scheme)}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm min-h-[44px]"
                >
                  Check My Fit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scheme Detail Modal */}
      {activeModalScheme && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
                    {activeModalScheme.level} Scheme
                  </span>
                  {activeModalScheme.state && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                      {activeModalScheme.state}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{activeModalScheme.name}</h3>
                <p className="text-xs text-gray-500">{activeModalScheme.issuingBody}</p>
              </div>
              <button
                onClick={() => setActiveModalScheme(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-sm text-gray-700">
              {/* Benefit Box */}
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Scholarship Award Details
                </h4>
                <p className="text-indigo-800 text-xs leading-relaxed">
                  {activeModalScheme.benefit.description}
                </p>
              </div>

              {/* Required Documents */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Mandatory Documents
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeModalScheme.requiredDocuments.map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How to Apply */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Step-by-Step Application Guide:</h4>
                <ol className="space-y-2 text-xs text-gray-600 list-decimal list-inside bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {activeModalScheme.howToApply.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Notes */}
              {activeModalScheme.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800">
                  <strong>Important Notes:</strong> {activeModalScheme.notes}
                </div>
              )}

              {/* Verification Info */}
              <div className="text-[11px] text-gray-400 border-t pt-3 flex justify-between">
                <span>Verified by: {activeModalScheme.verifiedBy}</span>
                <span>Last Verified: {new Date(activeModalScheme.lastVerifiedDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
              <button
                onClick={() => {
                  const s = activeModalScheme;
                  setActiveModalScheme(null);
                  onAskScholar(s.name);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition min-h-[44px]"
              >
                💬 Ask a Verified Scholar
              </button>

              <button
                type="button"
                onClick={() => openUrl(activeModalScheme.officialSourceLink)}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 min-h-[48px]"
              >
                Visit Official Application Portal <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
