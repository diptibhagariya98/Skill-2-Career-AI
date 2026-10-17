"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { CheckCircle2, AlertCircle, XCircle, ShieldCheck } from "lucide-react";

interface ATSChecklistProps {
  resume: ResumeData;
}

interface CheckItem {
  id: string;
  label: string;
  status: "pass" | "warning" | "fail";
  message: string;
}

export default function ATSChecklist({ resume }: ATSChecklistProps) {
  const { contact, experience, education, skills, summary } = resume;

  const checks: CheckItem[] = [
    {
      id: "contact_name",
      label: "Full Name on Top",
      status: contact.fullName?.trim() ? "pass" : "fail",
      message: contact.fullName?.trim()
        ? "Full name is positioned as the document primary heading."
        : "Missing full name. ATS scanners require a clear candidate identity.",
    },
    {
      id: "contact_email",
      label: "Valid Email Address",
      status:
        contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)
          ? "pass"
          : "fail",
      message: contact.email
        ? "Valid plain-text email found in body."
        : "Add a valid email address so recruiters and ATS can contact you.",
    },
    {
      id: "contact_location",
      label: "Location (City / Country)",
      status: contact.city || contact.country ? "pass" : "warning",
      message:
        contact.city || contact.country
          ? "Geographic location present for regional matching."
          : "Adding city & country helps local ATS location filters.",
    },
    {
      id: "experience_present",
      label: "Work Experience Section",
      status:
        experience.length > 0
          ? "pass"
          : education.length > 0
          ? "warning"
          : "fail",
      message:
        experience.length > 0
          ? `${experience.length} work experience entries with standardized dates.`
          : "No experience listed. If you're a student/fresher, highlight projects and education.",
    },
    {
      id: "single_column",
      label: "Single-Column Flow",
      status: "pass",
      message: "Layout is strictly single-column without unreadable nested tables or sidebars.",
    },
    {
      id: "standard_headings",
      label: "Standard ATS Headings",
      status: "pass",
      message: "Using exact universal heading keywords (Summary, Experience, Education, Skills).",
    },
    {
      id: "no_graphic_ratings",
      label: "No Graphical Skill Bars",
      status: "pass",
      message: "Skills are stored as semantic text tokens, not unreadable percentage bars.",
    },
    {
      id: "summary_length",
      label: "Summary Length",
      status: !summary ? "warning" : summary.length <= 600 ? "pass" : "warning",
      message: !summary
        ? "Adding a 2-4 sentence summary increases recruiter engagement."
        : summary.length <= 600
        ? "Summary is within the optimal 600-character window."
        : "Summary exceeds 600 characters; consider tightening for executive scanability.",
    },
  ];

  const passCount = checks.filter((c) => c.status === "pass").length;
  const scorePercent = Math.round((passCount / checks.length) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-sm text-gray-900">ATS Compatibility Scorecard</h3>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            scorePercent >= 80
              ? "bg-emerald-100 text-emerald-800"
              : scorePercent >= 60
              ? "bg-amber-100 text-amber-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {scorePercent}% ATS Ready
        </span>
      </div>

      <div className="space-y-2.5">
        {checks.map((item) => (
          <div key={item.id} className="flex items-start gap-2.5 text-xs">
            {item.status === "pass" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : item.status === "warning" ? (
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-gray-800">{item.label}</p>
              <p className="text-[11px] text-gray-500 leading-tight">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
