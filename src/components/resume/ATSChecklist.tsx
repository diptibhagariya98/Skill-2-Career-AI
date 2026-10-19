"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { CheckCircle2, AlertCircle, XCircle, ShieldCheck } from "lucide-react";
import { isValidHttpUrl } from "@/lib/resume/validation";

interface ATSChecklistProps {
  resume: ResumeData;
}

type CheckStatus = "pass" | "warning" | "fail";

interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
}

export default function ATSChecklist({ resume }: ATSChecklistProps) {
  const { contact, experience, education, skills, summary, projects, certifications } = resume;

  // ── Helper: does any experience have quantified bullets? ─────────────
  const hasQuantifiedBullets = experience.some((exp) =>
    (exp.bullets || []).some((b) => /\d/.test(b))
  );

  // ── Helper: are skills actually present? ─────────────────────────────
  const hasSkills =
    (skills.isGrouped && skills.groups.some((g) => g.skills.length > 0)) ||
    (!skills.isGrouped && (skills.flatList || []).length > 0);

  // ── Helper: are all experience dates internally consistent? ──────────
  const hasBadDates = experience.some((exp) => {
    if (exp.isCurrent || !exp.startYear || !exp.endYear) return false;
    return parseInt(exp.endYear, 10) < parseInt(exp.startYear, 10);
  });

  // ── Helper: are contact links valid? ─────────────────────────────────
  const hasValidLink = isValidHttpUrl(contact.linkedin) || isValidHttpUrl(contact.website);

  // ── Summary length: ATS-optimal range is 50–600 chars ────────────────
  const summaryLen = (summary || "").trim().length;
  const summaryStatus: CheckStatus = !summary?.trim()
    ? "warning"
    : summaryLen < 50
    ? "warning"   // present but too short to be useful
    : summaryLen <= 600
    ? "pass"
    : "warning";  // too long
  const summaryMessage = !summary?.trim()
    ? "Add a 2–4 sentence professional summary to increase recruiter engagement."
    : summaryLen < 50
    ? `Summary is only ${summaryLen} chars — expand to 50–600 for ATS impact.`
    : summaryLen <= 600
    ? `Summary is ${summaryLen} chars — within the optimal 50–600 character window.`
    : `Summary is ${summaryLen} chars — trim to under 600 for scannability.`;

  const checks: CheckItem[] = [
    {
      id: "contact_name",
      label: "Full name present",
      status: contact.fullName?.trim() ? "pass" : "fail",
      message: contact.fullName?.trim()
        ? "Full name is the document's primary heading."
        : "Missing full name — ATS scanners require a clear candidate identity.",
    },
    {
      id: "contact_email",
      label: "Valid email address",
      status:
        contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ? "pass" : "fail",
      message: contact.email
        ? "Valid plain-text email found."
        : "Add a valid email so recruiters and ATS can contact you.",
    },
    {
      id: "contact_location",
      label: "Location (city / country)",
      status: contact.city || contact.country ? "pass" : "warning",
      message:
        contact.city || contact.country
          ? "Geographic location present for regional matching."
          : "Adding city & country helps ATS location filters.",
    },
    {
      id: "contact_link",
      label: "Professional link (LinkedIn / website)",
      status: hasValidLink ? "pass" : "warning",
      message: hasValidLink
        ? "At least one professional link is present and valid."
        : "Add a LinkedIn or portfolio URL to strengthen recruiter trust.",
    },
    {
      id: "experience_present",
      label: "Work experience section",
      status:
        experience.length > 0
          ? "pass"
          : education.length > 0
          ? "warning"
          : "fail",
      message:
        experience.length > 0
          ? `${experience.length} work experience ${experience.length === 1 ? "entry" : "entries"} with standardised dates.`
          : "No experience listed — highlight projects and education if you're a student.",
    },
    {
      id: "quantified_bullets",
      label: "Quantified impact in bullets",
      status: experience.length === 0 ? "warning" : hasQuantifiedBullets ? "pass" : "warning",
      message:
        experience.length === 0
          ? "Add work experience entries first."
          : hasQuantifiedBullets
          ? "Bullets contain numbers — great for ATS keyword scoring."
          : "Add metrics (%, $, numbers) to at least one bullet point for stronger ATS match.",
    },
    {
      id: "skills_present",
      label: "Skills section populated",
      status: hasSkills ? "pass" : "fail",
      message: hasSkills
        ? "Skills section is populated as plain-text tokens — ATS-friendly."
        : "Skills section is empty. Add relevant skills so ATS can match keywords.",
    },
    {
      id: "projects_or_certs",
      label: "Projects or certifications",
      status:
        (projects || []).length > 0 || (certifications || []).length > 0 ? "pass" : "warning",
      message:
        (projects || []).length > 0 || (certifications || []).length > 0
          ? "Projects or certifications are present — adds credibility and keyword surface."
          : "Consider adding projects or certifications to improve ATS keyword coverage.",
    },
    {
      id: "date_consistency",
      label: "Date consistency",
      status: hasBadDates ? "fail" : "pass",
      message: hasBadDates
        ? "One or more experience entries has an end date before the start date."
        : "Experience dates are internally consistent.",
    },
    {
      id: "summary_length",
      label: "Summary length (50–600 chars)",
      status: summaryStatus,
      message: summaryMessage,
    },
    {
      id: "single_column",
      label: "Single-column layout",
      status: "pass",
      message: "Layout is strictly single-column — no sidebars or tables that confuse ATS parsers.",
    },
    {
      id: "no_graphic_ratings",
      label: "No graphical skill bars",
      status: "pass",
      message: "Skills are stored as semantic text tokens, not percentage bars.",
    },
  ];

  // Sort: fails first, then warnings, then passes
  const prioritised = [...checks].sort((a, b) => {
    const rank: Record<CheckStatus, number> = { fail: 0, warning: 1, pass: 2 };
    return rank[a.status] - rank[b.status];
  });

  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const total = checks.length;
  const badgeColor =
    failCount > 0
      ? "bg-red-100 text-red-800"
      : passCount / total >= 0.8
      ? "bg-emerald-100 text-emerald-800"
      : "bg-amber-100 text-amber-800";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-sm text-gray-900">ATS Compatibility</h3>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
          {passCount} of {total} checks passed
        </span>
      </div>

      <div className="space-y-2.5">
        {prioritised.map((item) => (
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
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
