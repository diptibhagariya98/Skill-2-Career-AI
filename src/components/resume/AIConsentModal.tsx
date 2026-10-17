"use client";

import React from "react";
import { ShieldCheck, Lock, ExternalLink, X } from "lucide-react";

interface AIConsentModalProps {
  onAgree: () => void;
  onDecline: () => void;
}

export const CONSENT_STORAGE_KEY = "resumentor_ai_ats_consent_v1";

export default function AIConsentModal({ onAgree, onDecline }: AIConsentModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 to-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <ShieldCheck className="h-6 w-6 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Resume AI Analysis Notice</h2>
              <p className="text-xs text-indigo-200">Privacy & Data Handling</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDecline}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <p>
            Before proceeding with AI ATS Analysis, please review how your information is processed:
          </p>

          <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs">
            <div className="flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900">What is sent: </strong>
                Your resume text, layout measurements (page count, font sizes, section order), and optional job description.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900">Third-party processing: </strong>
                Data is securely processed by Google Gemini AI solely for screening evaluation. It is not used to train models or sold to third parties.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900">Zero retention: </strong>
                Your resume content is not stored in persistent server logs or external databases. Results are cached ephemerally for your session.
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Declining keeps our local, rule-based ATS scorecard fully available without sending data over the network.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition min-h-[42px]"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={onAgree}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs min-h-[42px]"
          >
            Agree and Analyze
          </button>
        </div>
      </div>
    </div>
  );
}
