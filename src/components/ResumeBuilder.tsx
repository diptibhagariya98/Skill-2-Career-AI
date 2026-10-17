"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ResumeData, SectionKey, TemplateId, PageSize } from "@/types/resume";
import { loadLocalResume, saveLocalResume } from "@/lib/resume/storage";
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
import { ResumePreview } from "./resume/ResumePreview";

import {
  Download,
  Database,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Palette,
  Loader2,
} from "lucide-react";

const ACCENT_COLORS = [
  { name: "Teal", hex: "#0f766e" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Slate", hex: "#334155" },
  { name: "Burgundy", hex: "#831843" },
  { name: "Forest", hex: "#14532d" },
];

interface AnalysisResult {
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

export default function ResumeBuilder() {
  const [resume, setResume] = useState<ResumeData>(() => loadLocalResume());
  const [activeSection, setActiveSection] = useState<SectionKey>("contact");
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Idle">("Saved");
  const [showDataModal, setShowDataModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Gemini AI Resume Analysis state
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

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

  // Next / Previous Section Navigation
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

  // Gemini AI Analysis Handler
  const handleAnalyzeResume = async () => {
    if (!resume.contact.fullName || !resume.contact.email) {
      toast.error("Please provide at least your full name and email before analyzing.");
      return;
    }

    setAnalysisLoading(true);
    const toastId = toast.loading("Evaluating resume with Gemini AI...");

    try {
      const prompt = `You are an expert ATS (Applicant Tracking System) parser and executive recruiter. 
Analyze this candidate's resume data and output a structured review matching this JSON schema:
{
  "score": 85,
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "feedback": "..."
}

Keep strengths and improvements brief (max 3 items each). Output raw JSON only without markdown code blocks.
Resume Data:
${JSON.stringify(resume, null, 2)}`;

      const response = await fetch(API_ROUTES.GEMINI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact Gemini API");
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData: AnalysisResult = JSON.parse(cleanJson);

      setAnalysisResult(parsedData);
      toast.success("AI ATS Analysis complete!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "An error occurred during resume analysis.", { id: toastId });
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Export PDF implementation (Section 8.3 & 9.1)
  const handleExportPDF = async () => {
    setExporting(true);
    const toastId = toast.loading("Generating ATS-friendly PDF...");

    try {
      const element = previewPrintRef.current;
      if (!element) throw new Error("Preview element not found");

      const html2pdf = (await import("html2pdf.js")).default;

      const cleanName = (resume.contact.fullName || "Resume")
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-");
      const filename = `${cleanName}-Resume.pdf`;

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
      toast.success(`Exported ${filename}`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate PDF.", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 lg:pb-8">
      {/* Top Action Toolbar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={resume.meta.title}
            onChange={(e) =>
              handleUpdateResume({
                ...resume,
                meta: { ...resume.meta, title: e.target.value },
              })
            }
            className="font-bold text-gray-900 text-sm sm:text-base border-b border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5 rounded max-w-[180px] sm:max-w-xs truncate"
            title="Rename Resume"
          />
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full hidden sm:inline">
            {saveStatus}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* AI ATS Analysis Action */}
          <button
            type="button"
            disabled={analysisLoading}
            onClick={handleAnalyzeResume}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-3.5 py-2 rounded-xl transition shadow-xs disabled:opacity-50 min-h-[40px]"
            title="Evaluate ATS score and improvement tips with Gemini AI"
          >
            {analysisLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-purple-200" />
            )}
            <span>{analysisLoading ? "Evaluating..." : "AI Review"}</span>
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

          <button
            type="button"
            disabled={exporting}
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50 min-h-[40px]"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? "Exporting..." : "Export PDF"}</span>
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
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT PANE: Form Sections (Visible on Desktop OR when mobileTab === 'edit') */}
        <div
          className={`w-full lg:w-1/2 flex flex-col space-y-6 ${
            mobileTab === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
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
                onChange={(exp) => handleUpdateResume({ ...resume, experience: exp })}
              />
            )}
            {activeSection === "education" && (
              <EducationSection
                items={resume.education}
                onChange={(edu) => handleUpdateResume({ ...resume, education: edu })}
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
                onChange={(proj) => handleUpdateResume({ ...resume, projects: proj })}
              />
            )}
            {activeSection === "certifications" && (
              <CertificationsSection
                items={resume.certifications}
                onChange={(cert) => handleUpdateResume({ ...resume, certifications: cert })}
              />
            )}
            {(activeSection === "languages" ||
              activeSection === "awards" ||
              activeSection === "volunteer" ||
              activeSection === "references") && (
              <AdditionalSections
                sectionKey={activeSection}
                resume={resume}
                onChange={handleUpdateResume}
              />
            )}

            {/* Step Navigation Buttons pinned at bottom of form */}
            <div className="pt-8 mt-8 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentStepIndex === 0}
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-40 min-h-[44px]"
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

        {/* RIGHT PANE: Live Preview, Template Picker, AI Report & ATS Scorecard */}
        <div
          className={`w-full lg:w-1/2 flex flex-col space-y-6 ${
            mobileTab === "edit" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* AI ATS Analysis Report (if generated) */}
          {analysisResult && (
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl space-y-3.5 shadow-sm animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
                <span className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" /> Gemini AI ATS Scorecard
                </span>
                <span
                  className={`font-black text-lg py-0.5 px-3 rounded-lg text-white ${
                    analysisResult.score >= 80
                      ? "bg-emerald-600"
                      : analysisResult.score >= 50
                      ? "bg-amber-600"
                      : "bg-red-600"
                  }`}
                >
                  {analysisResult.score}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-800">✅ Key Strengths:</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                    {analysisResult.strengths?.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-amber-800">⚠️ Improvement Opportunities:</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                    {analysisResult.improvements?.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {analysisResult.feedback && (
                <p className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-indigo-100 leading-relaxed">
                  <strong>Recruiter Feedback: </strong> {analysisResult.feedback}
                </p>
              )}
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

          {/* ATS Checklist Scorecard */}
          <ATSChecklist resume={resume} />
        </div>
      </div>

      {/* Mobile Bottom Navigation (Edit / Preview / Export) */}
      <MobileBottomNav
        activeTab={mobileTab}
        onChangeTab={(tab) => setMobileTab(tab)}
        onExport={handleExportPDF}
      />

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
