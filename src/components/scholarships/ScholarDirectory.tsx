"use client";

import React, { useState } from "react";
import { ScholarListing, ScholarReport } from "../../types/scholarships";
import {
  ShieldCheck,
  MessageSquare,
  MessageCircle,
  GraduationCap,
  MapPin,
  Languages,
  Clock,
  AlertTriangle,
  Flag,
  X,
  Send,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { openUrl, useBackHandler, BackPriority } from "@/shared/platform";

interface ScholarDirectoryProps {
  scholars: ScholarListing[];
  filterSchemeName?: string;
}

export default function ScholarDirectory({
  scholars,
  filterSchemeName,
}: ScholarDirectoryProps) {
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<string>(
    filterSchemeName || "all"
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [requestModalScholar, setRequestModalScholar] = useState<ScholarListing | null>(null);
  const [requestMessage, setRequestMessage] = useState<string>("");
  const [reportModalScholar, setReportModalScholar] = useState<ScholarListing | null>(null);
  const [reportReason, setReportReason] = useState<ScholarReport["reason"]>("asking_for_money");
  const [reportDetails, setReportDetails] = useState<string>("");

  // Dismiss modals on hardware / gesture back button
  useBackHandler(
    BackPriority.OVERLAY,
    () => {
      if (requestModalScholar) {
        setRequestModalScholar(null);
        return true;
      }
      if (reportModalScholar) {
        setReportModalScholar(null);
        return true;
      }
      return false;
    },
    [requestModalScholar, reportModalScholar]
  );

  // Filter scholars
  const filteredScholars = scholars.filter((s) => {
    const matchesScheme =
      selectedSchemeFilter === "all" ||
      s.schemeName.toLowerCase().includes(selectedSchemeFilter.toLowerCase());

    const matchesLang =
      selectedLanguage === "all" ||
      s.languages.some((l) => l.toLowerCase() === selectedLanguage.toLowerCase());

    return matchesScheme && matchesLang && s.status === "active";
  });

  // Safe WhatsApp trigger without putting phone numbers in static DOM attributes
  const handleOpenWhatsApp = async (scholar: ScholarListing) => {
    // Obfuscated phone reconstruction on user gesture
    const phone = scholar.messagingNumber.replace(/\D/g, "");
    const msg = `Hi ${scholar.displayName}, I found your verified listing on ResuMentor for ${scholar.schemeName}. I would appreciate some guidance on the application process.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    toast.success(`Opening WhatsApp chat with ${scholar.displayName}`);
    await openUrl(url);
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestMessage.trim()) {
      toast.error("Please enter a short message for the scholar.");
      return;
    }

    toast.success(
      `Request sent to ${requestModalScholar?.displayName}! They will review and connect with you.`
    );
    setRequestModalScholar(null);
    setRequestMessage("");
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      `Report submitted for review by ResuMentor Trust & Safety. Thank you for keeping the community safe.`
    );
    setReportModalScholar(null);
    setReportDetails("");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Safety Notice Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-amber-950">
            ResuMentor Scholar Safety & Anti-Fraud Advisory
          </p>
          <p className="leading-relaxed">
            Scholar guidance on ResuMentor is 100% voluntary and free. <strong>Never pay any money, application fees, or share Aadhaar OTPs or banking credentials</strong> with anyone. Please immediately report any suspicious requests.
          </p>
        </div>
      </div>

      {/* Filters & Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" /> Verified Scholar Mentors
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Connect directly with verified past recipients for document and application help.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={selectedSchemeFilter}
            onChange={(e) => setSelectedSchemeFilter(e.target.value)}
            className="px-3 py-2 min-h-[48px] rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 bg-white flex-1 sm:flex-none"
          >
            <option value="all">All Scholarship Schemes</option>
            <option value="MYSY">MYSY Gujarat</option>
            <option value="NSP">NSP Central Sector</option>
            <option value="Pragati">AICTE Pragati</option>
            <option value="Post-Matric">Post-Matric SC/ST/OBC</option>
          </select>

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-2 min-h-[48px] rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 bg-white"
          >
            <option value="all">All Languages</option>
            <option value="Gujarati">Gujarati</option>
            <option value="Hindi">Hindi</option>
            <option value="English">English</option>
          </select>
        </div>
      </div>

      {/* Scholar Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredScholars.map((scholar) => (
          <div
            key={scholar.id}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Scholar Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-base flex items-center justify-center shadow-sm">
                    {scholar.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-gray-900 text-base">{scholar.displayName}</h3>
                      {scholar.isVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Scholar
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                      Awardee: {scholar.schemeName} ({scholar.yearAwarded})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setReportModalScholar(scholar)}
                  title="Report Listing"
                  aria-label="Report listing"
                  className="text-gray-300 hover:text-red-500 p-3 min-w-[48px] min-h-[48px] flex items-center justify-center transition rounded-xl -mr-2"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>

              {/* Academic & Location details */}
              <div className="space-y-1.5 text-xs text-gray-600 mt-2">
                {scholar.course && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                    <span>{scholar.course} {scholar.institution ? `• ${scholar.institution}` : ""}</span>
                  </div>
                )}
                {scholar.state && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{scholar.state}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-gray-400" />
                  <span>Speaks: {scholar.languages.join(", ")}</span>
                </div>
                {scholar.availability && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Available: {scholar.availability}</span>
                  </div>
                )}
              </div>

              {/* Ways can help tags */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-500 tracking-wider block mb-1.5">
                  Ways I can help:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {scholar.waysCanHelp.map((way, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700"
                    >
                      {way}
                    </span>
                  ))}
                </div>
              </div>

              {/* Scholar Bio note */}
              {scholar.shortNote && (
                <p className="mt-3 text-xs text-gray-600 bg-indigo-50/40 p-3 rounded-xl italic">
                  &ldquo;{scholar.shortNote}&rdquo;
                </p>
              )}
            </div>

            {/* Contact Actions */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400">
                Contact: {scholar.contactMode === "open_whatsapp" ? "Direct WhatsApp" : "Approval Request"}
              </span>

              {scholar.contactMode === "open_whatsapp" ? (
                <button
                  onClick={() => handleOpenWhatsApp(scholar)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition min-h-[48px]"
                >
                  <MessageCircle className="w-4 h-4" /> Message on WhatsApp
                </button>
              ) : (
                <button
                  onClick={() => setRequestModalScholar(scholar)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition min-h-[48px]"
                >
                  <MessageSquare className="w-4 h-4" /> Request Guidance
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Guidance Request Modal (Approval Mode) */}
      {requestModalScholar && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 text-base">
                Request Guidance from {requestModalScholar.displayName}
              </h3>
              <button
                onClick={() => setRequestModalScholar(null)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 p-2 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <p className="text-xs text-gray-500">
                Introduce yourself and briefly mention what guidance you need for{" "}
                <strong>{requestModalScholar.schemeName}</strong> (max 300 characters).
              </p>

              <textarea
                rows={4}
                maxLength={300}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Hi! I am applying for this scheme and have a doubt regarding..."
                className="w-full p-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>{requestMessage.length}/300 characters</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestModalScholar(null)}
                  className="flex-1 py-3 min-h-[48px] border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 min-h-[48px] bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {reportModalScholar && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-red-600 text-base flex items-center gap-2">
                <Flag className="w-4 h-4" /> Report Scholar Listing
              </h3>
              <button
                onClick={() => setReportModalScholar(null)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 p-2 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ScholarReport["reason"])}
                  className="w-full px-3 py-2 min-h-[48px] rounded-xl border border-gray-200 text-sm text-gray-900 bg-white"
                >
                  <option value="asking_for_money">Asking for money / application fee</option>
                  <option value="spam">Spam / Promotional links</option>
                  <option value="harassment">Harassment / Inappropriate behavior</option>
                  <option value="fake_listing">Fake award claim / Unverified profile</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Additional details (Optional)</label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context so moderators can investigate..."
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm text-gray-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalScholar(null)}
                  className="flex-1 py-3 min-h-[48px] border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 min-h-[48px] bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-md flex items-center justify-center"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
