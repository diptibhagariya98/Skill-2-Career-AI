"use client";

import React from "react";
import { AlertCircle, Download, ArrowRight, X } from "lucide-react";
import { SectionKey } from "@/types/resume";

export interface PreflightWarning {
  field: string;
  message: string;
  section: SectionKey;
  isBlocking?: boolean;
}

interface PDFPreflightModalProps {
  warnings: PreflightWarning[];
  onDownloadAnyway: () => void;
  onFixSection: (section: SectionKey) => void;
  onCancel: () => void;
}

export default function PDFPreflightModal({
  warnings,
  onDownloadAnyway,
  onFixSection,
  onCancel,
}: PDFPreflightModalProps) {
  const hasBlocking = warnings.some((w) => w.isBlocking);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            hasBlocking
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle
              className={`h-5 w-5 ${
                hasBlocking ? "text-red-600" : "text-amber-600"
              }`}
            />
            <h3
              className={`font-bold text-sm sm:text-base ${
                hasBlocking ? "text-red-950" : "text-amber-950"
              }`}
            >
              {hasBlocking
                ? "Required Details Missing"
                : "Pre-Export Quality Check"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close Preflight Modal"
            className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Warnings List */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            {hasBlocking
              ? "Your resume cannot be exported with blank or placeholder candidate credentials. Please fill in your real contact information:"
              : "Your resume is missing a few recommended details before exporting to PDF. You can fix them now or download as-is:"}
          </p>

          <div className="space-y-2">
            {warnings.map((w, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl text-xs border ${
                  w.isBlocking
                    ? "bg-red-50/60 border-red-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div>
                  <span
                    className={`font-bold ${
                      w.isBlocking ? "text-red-900" : "text-gray-800"
                    }`}
                  >
                    {w.field}:{" "}
                  </span>
                  <span className="text-gray-600">{w.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onFixSection(w.section)}
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-2 flex-shrink-0"
                >
                  Fix <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            Review Form
          </button>

          <div className="flex items-center gap-2">
            {hasBlocking && (
              <button
                type="button"
                onClick={onDownloadAnyway}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-indigo-700 bg-white border border-gray-200 rounded-xl transition shadow-2xs hover:border-indigo-300"
                title="Download draft PDF with missing credentials"
              >
                <Download className="h-3.5 w-3.5 text-gray-500" />
                <span>Download Draft</span>
              </button>
            )}

            {hasBlocking ? (
              <button
                type="button"
                onClick={() => {
                  const firstBlocking = warnings.find((w) => w.isBlocking);
                  if (firstBlocking) onFixSection(firstBlocking.section);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
              >
                <span>Fix Required Fields</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onDownloadAnyway}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Anyway</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
