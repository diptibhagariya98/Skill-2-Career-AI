"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ResumeData, SectionKey, TemplateId, PageSize } from "@/types/resume";
import { AnalysisResponse } from "@/types/analysis";
import { loadLocalResume, saveLocalResume } from "@/lib/resume/storage";
import { generateContentFingerprint } from "@/lib/resume/scoring";
import { API_ROUTES } from "@/constants/endpoints";
import { toast } from "react-hot-toast";

// Modular Section Components
import StepIndicator from "./resume/StepIndicator";
import MobileBottomNav, { MobileTab } from "./resume/MobileBottomNav";
import ContactSection from "./resume/ContactSection";
import SummarySection from "./resume/SummarySection";
import ExperienceSection from "./resume/ExperienceSection";
import EducationSection from "./resume/EducationSection";
import SkillsSection from "./resume/SkillsSection";
import ProjectsSection from "./resume/ProjectsSection";
import CertificationsSection from "./resume/CertificationsSection";
import AdditionalSections from "./resume/AdditionalSections";
import ATSChecklist from "./resume/ATSChecklist";
import DataManagementModal from "./resume/DataManagementModal";
import AIAnalysisReport from "./resume/AIAnalysisReport";
import AIConsentModal, { CONSENT_STORAGE_KEY } from "./resume/AIConsentModal";
import PDFPreflightModal, { PreflightWarning } from "./resume/PDFPreflightModal";
import { ResumePreview } from "./resume/ResumePreview";
import { hapticSuccess, hapticLight } from "@/shared/platform";

import {
  Download,
  Database,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Palette,
  Loader2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  RotateCw,
} from "lucide-react";

const ACCENT_COLORS = [
  { name: "Teal", hex: "#0f766e" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Slate", hex: "#334155" },
  { name: "Burgundy", hex: "#831843" },
  { name: "Forest", hex: "#14532d" },
];

export default function ResumeBuilder() {
  const [resume, setResume] = useState<ResumeData>(() => loadLocalResume());
  const [activeSection, setActiveSection] = useState<SectionKey>("contact");
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Idle">("Saved");
  const [showDataModal, setShowDataModal] = useState(false);

  // Export PDF State (Phase 2 Part B)
  const [exportState, setExportState] = useState<"ready" | "preparing" | "done" | "failed">("ready");
  const [exportFailCount, setExportFailCount] = useState(0);
  const [showPreflightModal, setShowPreflightModal] = useState(false);
  const [preflightWarnings, setPreflightWarnings] = useState<PreflightWarning[]>([]);

  // Phase 2 AI ATS Analysis State
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResponse, setAnalysisResponse] = useState<AnalysisResponse | null>(null);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [showJobDescInput, setShowJobDescInput] = useState(false);

  const previewPrintRef = useRef<HTMLDivElement>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced Autosave (800ms) complying with Section 5.3
  const triggerAutosave = useCallback((updated: ResumeData) => {
    setSaveStatus("Saving...");
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = setTimeout(() => {
      saveLocalResume(updated);
      setSaveStatus("Saved");
    }, 800);
  }, []);

  const handleUpdateResume = (next: ResumeData) => {
    setResume(next);
    triggerAutosave(next);
  };

  // Section completion calculator
  const completionMap: Record<SectionKey, boolean> = {
    contact: Boolean(resume.contact.fullName && resume.contact.email),
    summary: Boolean(resume.summary?.trim()),
    experience: resume.experience.length > 0,
    education: resume.education.length > 0,
    skills:
      (resume.skills.isGrouped && resume.skills.groups.some((g) => g.skills.length > 0)) ||
      (!resume.skills.isGrouped && (resume.skills.flatList || []).length > 0),
    projects: resume.projects.length > 0,
    certifications: resume.certifications.length > 0,
    languages: (resume.languages || []).length > 0,
    awards: (resume.awards || []).length > 0,
    publications: (resume.publications || []).length > 0,
    volunteer: (resume.volunteer || []).length > 0,
    interests: (resume.interests || []).length > 0,
    references: Boolean(resume.referencesText),
    custom: (resume.customSections || []).length > 0,
  };

  // Step Navigation
  const visibleSections = resume.meta.sectionOrder.filter(
    (k) => resume.meta.sectionVisibility[k] !== false
  );
  const currentStepIndex = visibleSections.indexOf(activeSection);

  const handleNextStep = () => {
    if (currentStepIndex < visibleSections.length - 1) {
      setActiveSection(visibleSections[currentStepIndex + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setMobileTab("preview");
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setActiveSection(visibleSections[currentStepIndex - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Extract clean text in linear reading order (Phase 2 Spec 3.2 & 8.5)
  const getExtractedText = (): string => {
    if (previewPrintRef.current) {
      const text = previewPrintRef.current.innerText || "";
      if (text.trim().length > 30) return text;
    }

    // Fallback structured string assembler
    const parts: string[] = [];
    if (resume.contact.fullName) parts.push(resume.contact.fullName);
    if (resume.contact.headline) parts.push(resume.contact.headline);
    if (resume.contact.email) parts.push(resume.contact.email);
    if (resume.contact.phone) parts.push(resume.contact.phone);
    if (resume.summary) parts.push(`SUMMARY\n${resume.summary}`);

    if (resume.experience.length > 0) {
      parts.push("EXPERIENCE");
      resume.experience.forEach((e) => {
        parts.push(
          `${e.title} at ${e.employer} (${e.startMonth} ${e.startYear} - ${
            e.isCurrent ? "Present" : `${e.endMonth || ""} ${e.endYear || ""}`
          })`
        );
        (e.bullets || []).forEach((b) => parts.push(`- ${b}`));
      });
    }

    if (resume.education.length > 0) {
      parts.push("EDUCATION");
      resume.education.forEach((ed) => {
        parts.push(`${ed.degree}${ed.field ? ` in ${ed.field}` : ""}, ${ed.institution}`);
      });
    }

    if (resume.skills.isGrouped) {
      parts.push("SKILLS");
      resume.skills.groups.forEach((g) => {
        parts.push(`${g.name}: ${g.skills.join(", ")}`);
      });
    } else if (resume.skills.flatList?.length > 0) {
      parts.push(`SKILLS: ${resume.skills.flatList.join(", ")}`);
    }

    return parts.join("\n\n");
  };

  // Current Content Fingerprint to detect out-of-date state
  const currentFingerprint = generateContentFingerprint(
    getExtractedText(),
    {
      pageCount: 1,
      pageSize: resume.meta.pageSize,
      template: resume.meta.selectedTemplate,
      sectionOrder: resume.meta.sectionOrder,
    },
    jobDescription
  );

  const isAnalysisOutOfDate = Boolean(
    analysisResponse && analysisResponse.contentFingerprint !== currentFingerprint
  );

  // Phase 2 AI ATS Analysis Pipeline (Spec 3.1 & 3.3)
  const triggerAnalysisPipeline = async () => {
    // 1. Client Minimum Content Pre-Check (Section 3.1)
    if (!resume.contact.fullName?.trim()) {
      toast.error("Please add your full name before analyzing.", { icon: "⚠️" });
      setActiveSection("contact");
      setMobileTab("edit");
      return;
    }

    if (!resume.contact.email?.trim()) {
      toast.error("Please provide your email address before analyzing.", { icon: "⚠️" });
      setActiveSection("contact");
      setMobileTab("edit");
      return;
    }

    if (resume.experience.length === 0 && resume.education.length === 0) {
      toast.error("Please add at least one work experience or education entry.", { icon: "⚠️" });
      setActiveSection("experience");
      setMobileTab("edit");
      return;
    }

    // 2. Consent Check (Section 3.12)
    const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!consent) {
      setShowConsentModal(true);
      return;
    }

    setAnalysisLoading(true);
    const toastId = toast.loading("Analyzing ATS parsability with AI...");

    try {
      const extractedText = getExtractedText();

      const payload = {
        resumeData: resume,
        extractedText,
        layoutMetrics: {
          pageCount: 1,
          pageSize: resume.meta.pageSize,
          template: resume.meta.selectedTemplate,
          sectionOrder: resume.meta.sectionOrder,
        },
        localCheckResults: {
          single_column: "pass",
          standard_headings: "pass",
          contact_valid: resume.contact.email ? "pass" : "fail",
        },
        jobDescription: jobDescription.trim() || undefined,
        language: "en",
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };

      const response = await fetch(API_ROUTES.RESUME_ANALYZE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze resume.");
      }

      const data: AnalysisResponse = await response.json();
      setAnalysisResponse(data);
      setShowAnalysisReport(true);
      toast.success("AI ATS Analysis complete!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "An error occurred during resume analysis.", { id: toastId });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleAgreeConsent = () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ consented: true, timestamp: new Date().toISOString(), version: "v1" })
    );
    setShowConsentModal(false);
    triggerAnalysisPipeline();
  };

  // Part B: One-Click PDF Export with Pre-flight (Section 4.1 & 4.2)
  const executePDFExport = async () => {
    setExportState("preparing");
    const toastId = toast.loading("Preparing ATS print-ready PDF...");

    try {
      const element = previewPrintRef.current;
      if (!element) throw new Error("Preview canvas not found.");

      const html2pdf = (await import("html2pdf.js")).default;

      // Sanitized clean file name (Section 4.4)
      const cleanName = (resume.contact.fullName || "")
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const filename = cleanName ? `${cleanName}-Resume.pdf` : "Resume.pdf";

      const opt = {
        margin: 0.3,
        filename,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, logging: false },
        jsPDF: {
          unit: "in",
          format: resume.meta.pageSize === "Letter" ? "letter" : "a4",
          orientation: "portrait" as const,
        },
      };

      await html2pdf().from(element).set(opt).save();

      setExportState("done");
      setExportFailCount(0);
      hapticSuccess();
      toast.success(`Downloaded ${filename}`, { id: toastId });
    } catch (err: any) {
      setExportState("failed");
      const nextFail = exportFailCount + 1;
      setExportFailCount(nextFail);

      if (nextFail >= 2) {
        toast.error("PDF export failed. Opening browser print dialog as fallback...", {
          id: toastId,
        });
        window.print();
      } else {
        toast.error(err.message || "Export failed. Tap again to retry.", { id: toastId });
      }
    }
  };

  const handleExportPDF = (force = false) => {
    if (exportState === "preparing") return;

    if (!force) {
      // Pre-flight check (Section 4.2)
      const warnings: PreflightWarning[] = [];
      if (!resume.contact.fullName?.trim()) {
        warnings.push({
          field: "Full Name",
          message: "Candidate full name is blank.",
          section: "contact",
        });
      }
      if (!resume.contact.email?.trim()) {
        warnings.push({
          field: "Email Address",
          message: "No email address found for ATS contact parsing.",
          section: "contact",
        });
      }
      if (resume.experience.length === 0) {
        warnings.push({
          field: "Work Experience",
          message: "No work experience entries added.",
          section: "experience",
        });
      }

      if (warnings.length > 0) {
        setPreflightWarnings(warnings);
        setShowPreflightModal(true);
        return;
      }
    }

    setShowPreflightModal(false);
    executePDFExport();
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col pb-24 lg:pb-8">
      {/* Top Action Toolbar */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-20 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <input
            type="text"
            value={resume.meta.title}
            onChange={(e) =>
              handleUpdateResume({
                ...resume,
                meta: { ...resume.meta, title: e.target.value },
              })
            }
            className="font-bold text-gray-900 text-sm sm:text-base border-b border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5 rounded max-w-[140px] sm:max-w-xs truncate"
            title="Rename Resume"
          />
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full hidden sm:inline">
            {saveStatus}
          </span>

          {/* Mobile Segmented Toggle (Edit vs Preview) */}
          <div className="flex lg:hidden bg-gray-100 p-0.5 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setMobileTab("edit")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition min-h-[32px] ${
                mobileTab === "edit"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition min-h-[32px] ${
                mobileTab === "preview"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Phase 2: AI ATS Analysis Action */}
          <button
            type="button"
            disabled={analysisLoading}
            onClick={triggerAnalysisPipeline}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-3.5 py-2 rounded-xl transition shadow-xs disabled:opacity-50 min-h-[40px]"
            title="Evaluate ATS score and improvement tips with Gemini AI"
          >
            {analysisLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-purple-200" />
            )}
            <span>{analysisLoading ? "Analyzing..." : "Analyze Resume"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDataModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition min-h-[40px]"
            title="Import/Export JSON or revision history"
          >
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </button>

          <button
            type="button"
            onClick={handlePrintBrowser}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition min-h-[40px] hidden md:inline-flex"
            title="Print via browser"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>

          {/* Part B: One-Click Export PDF Button */}
          <button
            type="button"
            disabled={exportState === "preparing"}
            onClick={() => handleExportPDF(false)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm min-h-[40px] ${
              exportState === "done"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : exportState === "failed"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            } disabled:opacity-50`}
          >
            {exportState === "preparing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>
              {exportState === "preparing"
                ? "Exporting..."
                : exportState === "done"
                ? "Downloaded"
                : exportState === "failed"
                ? "Retry Export"
                : "Export PDF"}
            </span>
          </button>
        </div>
      </header>

      {/* Horizontal Step Indicator */}
      <StepIndicator
        sectionOrder={resume.meta.sectionOrder}
        sectionVisibility={resume.meta.sectionVisibility}
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setMobileTab("edit");
        }}
        completionMap={completionMap}
      />

      {/* Main Workspace: Two-pane Desktop (Form Left, Live Preview Right) */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
        {/* LEFT PANE: Form Sections (Visible on Desktop OR when mobileTab === 'edit') */}
        <div
          className={`w-full lg:w-1/2 flex flex-col space-y-4 sm:space-y-6 ${
            mobileTab === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-7 border border-gray-200 shadow-xs">
            {activeSection === "contact" && (
              <ContactSection
                data={resume.contact}
                onChange={(c) => handleUpdateResume({ ...resume, contact: c })}
              />
            )}
            {activeSection === "summary" && (
              <SummarySection
                summary={resume.summary}
                onChange={(s) => handleUpdateResume({ ...resume, summary: s })}
              />
            )}
            {activeSection === "experience" && (
              <ExperienceSection
                items={resume.experience}
                onChange={(items) => handleUpdateResume({ ...resume, experience: items })}
              />
            )}
            {activeSection === "education" && (
              <EducationSection
                items={resume.education}
                onChange={(items) => handleUpdateResume({ ...resume, education: items })}
              />
            )}
            {activeSection === "skills" && (
              <SkillsSection
                skills={resume.skills}
                onChange={(sk) => handleUpdateResume({ ...resume, skills: sk })}
              />
            )}
            {activeSection === "projects" && (
              <ProjectsSection
                items={resume.projects}
                onChange={(items) => handleUpdateResume({ ...resume, projects: items })}
              />
            )}
            {activeSection === "certifications" && (
              <CertificationsSection
                items={resume.certifications}
                onChange={(items) => handleUpdateResume({ ...resume, certifications: items })}
              />
            )}
            {[
              "languages",
              "awards",
              "publications",
              "volunteer",
              "interests",
              "references",
              "custom",
            ].includes(activeSection) && (
              <AdditionalSections
                resume={resume}
                sectionKey={activeSection as any}
                onChange={handleUpdateResume}
              />
            )}

            {/* Stepper Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 min-h-[44px]"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition shadow-sm min-h-[44px]"
              >
                {currentStepIndex === visibleSections.length - 1 ? (
                  <>
                    Preview Resume <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next Step <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Live Preview, Template Picker, AI Review & ATS Scorecard */}
        <div
          className={`w-full lg:w-1/2 flex flex-col space-y-6 ${
            mobileTab === "edit" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Phase 2: Tailor to a Job (Optional Collapsible Input, Section 3.1) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2">
            <button
              type="button"
              onClick={() => setShowJobDescInput(!showJobDescInput)}
              className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-indigo-600 transition"
            >
              <span className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                Tailor to a job (optional)
                {jobDescription.trim() && (
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </span>
              {showJobDescInput ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {showJobDescInput && (
              <div className="pt-2 space-y-2 animate-fade-in">
                <p className="text-[11px] text-gray-500">
                  Paste the target job description or requirements to benchmark your ATS role relevance score.
                </p>
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job title, responsibilities, and required qualifications here..."
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/50"
                  maxLength={8000}
                />
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>Max 8,000 characters</span>
                  {jobDescription && (
                    <button
                      type="button"
                      onClick={() => setJobDescription("")}
                      className="text-red-600 hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI ATS Quick Card Banner (if analyzed) */}
          {analysisResponse && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs font-black text-sm">
                  {analysisResponse.overallScore}%
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    AI ATS Readiness: <span className="capitalize">{analysisResponse.rating}</span>
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isAnalysisOutOfDate
                      ? "Resume edited since last review."
                      : "Screening report ready."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnalysisReport(true)}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 shadow-2xs transition"
                >
                  View Full Report
                </button>
                {isAnalysisOutOfDate && (
                  <button
                    type="button"
                    disabled={analysisLoading}
                    onClick={triggerAnalysisPipeline}
                    className="p-1.5 text-indigo-700 hover:bg-indigo-100 rounded-lg transition"
                    title="Re-analyze resume"
                  >
                    <RotateCw className={`h-4 w-4 ${analysisLoading ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Controls Bar: Template, Palette, Page Size */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                ATS Templates
              </span>

              {/* Template Switcher */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                {(["classic", "modern", "compact", "academic"] as TemplateId[]).map((tId) => (
                  <button
                    key={tId}
                    type="button"
                    onClick={() =>
                      handleUpdateResume({
                        ...resume,
                        meta: { ...resume.meta, selectedTemplate: tId },
                      })
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                      resume.meta.selectedTemplate === tId
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tId}
                  </button>
                ))}
              </div>
            </div>

            {/* Customization Options: Colors & Page Size */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
              {/* Color Accents */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <Palette className="h-3.5 w-3.5" /> Accent:
                </span>
                <div className="flex items-center gap-1.5">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() =>
                        handleUpdateResume({
                          ...resume,
                          meta: { ...resume.meta, accentColor: c.hex },
                        })
                      }
                      style={{ backgroundColor: c.hex }}
                      className={`h-5 w-5 rounded-full transition-transform ${
                        resume.meta.accentColor === c.hex
                          ? "ring-2 ring-offset-1 ring-indigo-500 scale-110"
                          : "hover:scale-105"
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Page Size */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-semibold">Page Size:</span>
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                  {(["A4", "Letter"] as PageSize[]).map((ps) => (
                    <button
                      key={ps}
                      type="button"
                      onClick={() =>
                        handleUpdateResume({
                          ...resume,
                          meta: { ...resume.meta, pageSize: ps },
                        })
                      }
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        resume.meta.pageSize === ps
                          ? "bg-white text-indigo-700 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {ps}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Paper Canvas Preview Container */}
          <div className="bg-gray-200/80 p-3 sm:p-6 rounded-2xl overflow-x-auto shadow-inner border border-gray-300/60 flex justify-center">
            <ResumePreview ref={previewPrintRef} resume={resume} />
          </div>

          {/* ATS Checklist Scorecard (Local Rule-based) */}
          <ATSChecklist resume={resume} />
        </div>
      </div>

      {/* Mobile Bottom Navigation (Edit / Preview / Export) */}
      <MobileBottomNav
        activeTab={mobileTab}
        onChangeTab={(tab) => setMobileTab(tab)}
        onExport={() => handleExportPDF(false)}
      />

      {/* AI Analysis Full Report Modal */}
      {showAnalysisReport && analysisResponse && (
        <AIAnalysisReport
          analysis={analysisResponse}
          isOutOfDate={isAnalysisOutOfDate}
          isAnalyzing={analysisLoading}
          onReanalyze={triggerAnalysisPipeline}
          onExportPDF={() => {
            setShowAnalysisReport(false);
            handleExportPDF(false);
          }}
          onNavigateToSection={(section) => {
            setShowAnalysisReport(false);
            setActiveSection(section);
            setMobileTab("edit");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onClose={() => setShowAnalysisReport(false)}
        />
      )}

      {/* AI Consent Modal (Section 3.12) */}
      {showConsentModal && (
        <AIConsentModal
          onAgree={handleAgreeConsent}
          onDecline={() => setShowConsentModal(false)}
        />
      )}

      {/* PDF Pre-flight Check Modal (Section 4.2) */}
      {showPreflightModal && (
        <PDFPreflightModal
          warnings={preflightWarnings}
          onDownloadAnyway={() => handleExportPDF(true)}
          onFixSection={(sec) => {
            setShowPreflightModal(false);
            setActiveSection(sec);
            setMobileTab("edit");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onCancel={() => setShowPreflightModal(false)}
        />
      )}

      {/* Data Management Modal */}
      {showDataModal && (
        <DataManagementModal
          resume={resume}
          onUpdateResume={handleUpdateResume}
          onClose={() => setShowDataModal(false)}
        />
      )}
    </div>
  );
}
