"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ResumeData, SectionKey, TemplateId, PageSize } from "@/types/resume";
import { AnalysisResponse } from "@/types/analysis";
import { supabase } from "@/lib/supabase";
import { createEmptyResume, migrateResumeSchema } from "@/lib/resume/schema";
import {
  loadLocalResume,
  saveLocalResume,
  getResumeStorageKey,
} from "@/lib/resume/storage";
import { generateContentFingerprint } from "@/lib/resume/scoring";
import { API_ROUTES } from "@/constants/endpoints";
import { toast } from "react-hot-toast";

// Modular Section Components
import StepIndicator from "./resume/StepIndicator";
type MobileTab = "edit" | "preview";
import ContactSection from "./resume/ContactSection";
import SummarySection from "./resume/SummarySection";
import ExperienceSection from "./resume/ExperienceSection";
import EducationSection from "./resume/EducationSection";
import SkillsSection from "./resume/SkillsSection";
import ProjectsSection from "./resume/ProjectsSection";
import CertificationsSection from "./resume/CertificationsSection";
import AdditionalSections, { AdditionalSectionKey } from "./resume/AdditionalSections";
import ATSChecklist from "./resume/ATSChecklist";
import DataManagementModal from "./resume/DataManagementModal";
import AIAnalysisReport from "./resume/AIAnalysisReport";
import AIConsentModal, { CONSENT_STORAGE_KEY } from "./resume/AIConsentModal";
import PDFPreflightModal, { PreflightWarning } from "./resume/PDFPreflightModal";
import { ResumePreview } from "./resume/ResumePreview";
import {
  hapticSuccess,
  hapticLight,
  useBackHandler,
  dispatchBack,
  shareContent,
  isNative,
  savePdfAndShare,
} from "@/shared/platform";
import { SECTION_REGISTRY } from "@/lib/resume/registry";

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
  Pencil,
} from "lucide-react";

const ACCENT_COLORS = [
  { name: "Teal", hex: "#0f766e" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Slate", hex: "#334155" },
  { name: "Burgundy", hex: "#831843" },
  { name: "Forest", hex: "#14532d" },
];

interface ResumeBuilderProps {
  user?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
}

export default function ResumeBuilder({ user }: ResumeBuilderProps = {}) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const [resume, setResume] = useState<ResumeData>(() =>
    loadLocalResume(user?.id, { name: user?.name, email: user?.email })
  );
  const [activeSection, setActiveSection] = useState<SectionKey>("contact");
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Idle">("Saved");
  const [showDataModal, setShowDataModal] = useState(false);

  // In-screen section navigation history stack (Spec Section handling)
  const sectionHistoryRef = useRef<SectionKey[]>([]);

  // Sync user and ensure newly registered users get clean, fresh state
  useEffect(() => {
    let isMounted = true;

    const syncUserAndResume = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        const activeId = user?.id || authUser?.id;
        const activeName =
          user?.name ||
          authUser?.user_metadata?.name ||
          authUser?.user_metadata?.full_name ||
          "";
        const activeEmail = user?.email || authUser?.email || "";

        if (activeId && isMounted) {
          const userObj = { id: activeId, name: activeName, email: activeEmail };
          setCurrentUser(userObj);

          // 1. Check user-scoped local storage
          const localKey = getResumeStorageKey(activeId);
          const rawLocal = localStorage.getItem(localKey);

          if (rawLocal) {
            try {
              const parsed = JSON.parse(rawLocal);
              if (isMounted) setResume(migrateResumeSchema(parsed));
              return;
            } catch {
              // fallback to DB if corrupt
            }
          }

          // 2. Check cloud profile in Supabase PostgreSQL
          const { data: profile } = await supabase
            .from("profiles")
            .select("resume_data")
            .eq("id", activeId)
            .single();

          if (profile?.resume_data && isMounted) {
            const migrated = migrateResumeSchema(profile.resume_data);
            setResume(migrated);
            saveLocalResume(migrated, activeId);
          } else if (isMounted) {
            // 3. Brand new user: initialize clean empty resume with ONLY their own name & email
            const freshResume = createEmptyResume({ name: activeName, email: activeEmail });
            setResume(freshResume);
            saveLocalResume(freshResume, activeId);
          }
        }
      } catch (err: unknown) {
        console.warn("[ResumeBuilder sync notice]:", err);
      }
    };

    syncUserAndResume();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.name, user?.email]);

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
  const offscreenPrintRef = useRef<HTMLDivElement>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced Autosave (800ms) with cloud sync complying with Section 5.3
  const triggerAutosave = useCallback(
    (updated: ResumeData) => {
      setSaveStatus("Saving...");
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      autosaveTimeoutRef.current = setTimeout(async () => {
        const activeUserId = currentUser?.id;
        saveLocalResume(updated, activeUserId);

        // Async sync to Supabase PostgreSQL profiles table (skip for guests to avoid DB errors)
        if (activeUserId && activeUserId !== "guest-user" && !activeUserId.startsWith("guest-")) {
          try {
            await supabase
              .from("profiles")
              .update({
                resume_data: updated,
                updated_at: new Date().toISOString(),
              })
              .eq("id", activeUserId);
          } catch (dbErr: unknown) {
            console.warn(
              "[Autosave Cloud Sync Notice]:",
              dbErr instanceof Error ? dbErr.message : "Sync skipped"
            );
          }
        }

        setSaveStatus("Saved");
      }, 800);
    },
    [currentUser?.id]
  );

  const handleUpdateResume = (next: ResumeData) => {
    setResume(next);
    triggerAutosave(next);
    // Reset export state when content changes — the previous export no longer matches the current content
    if (exportState === "done") setExportState("ready");
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

  const navigateToSection = (newSec: SectionKey) => {
    if (newSec !== activeSection) {
      sectionHistoryRef.current.push(activeSection);
      setActiveSection(newSec);
    }
    setMobileTab("edit");
  };

  const handleNextStep = () => {
    if (currentStepIndex < visibleSections.length - 1) {
      navigateToSection(visibleSections[currentStepIndex + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setMobileTab("preview");
    }
  };

  const handlePrevStep = () => {
    if (sectionHistoryRef.current.length > 0) {
      const prev = sectionHistoryRef.current.pop()!;
      setActiveSection(prev);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStepIndex > 0) {
      setActiveSection(visibleSections[currentStepIndex - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Register Back Navigation Handlers per Implementation Guide
  // Priority 2: Modals and bottom sheets
  useBackHandler("overlay", () => {
    if (showDataModal) {
      setShowDataModal(false);
      return true;
    }
    if (showPreflightModal) {
      setShowPreflightModal(false);
      return true;
    }
    if (showConsentModal) {
      setShowConsentModal(false);
      return true;
    }
    if (showAnalysisReport) {
      setShowAnalysisReport(false);
      return true;
    }
    return false;
  }, [showDataModal, showPreflightModal, showConsentModal, showAnalysisReport]);

  // Priority 5: In-screen step history (Sections & Edit/Preview toggle)
  useBackHandler("in_screen", () => {
    // 1. If currently in Preview mode on mobile, back returns to Edit in the same section
    if (mobileTab === "preview") {
      setMobileTab("edit");
      return true;
    }

    // 2. Pop to previous section if in-screen history exists
    if (sectionHistoryRef.current.length > 0) {
      const prevSection = sectionHistoryRef.current.pop()!;
      setActiveSection(prevSection);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    }

    // Step history is empty: return false to allow screen pop
    return false;
  }, [mobileTab, activeSection]);

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

    if (resume.projects?.length > 0) {
      parts.push("PROJECTS");
      resume.projects.forEach((p) => {
        parts.push(`${p.name}${p.role ? ` (${p.role})` : ""}`);
        (p.bullets || []).forEach((b) => parts.push(`- ${b}`));
      });
    }

    if (resume.certifications?.length > 0) {
      parts.push("CERTIFICATIONS");
      resume.certifications.forEach((c) => {
        parts.push(`${c.name} - ${c.issuer}${c.issueDate ? ` (${c.issueDate})` : ""}`);
      });
    }

    if (resume.awards?.length > 0) {
      parts.push("AWARDS");
      resume.awards.forEach((a) => {
        parts.push(`${a.title} - ${a.issuer}${a.date ? ` (${a.date})` : ""}${a.description ? `: ${a.description}` : ""}`);
      });
    }

    if (resume.languages?.length > 0) {
      parts.push("LANGUAGES");
      parts.push(
        resume.languages
          .filter((l) => l.language.trim())
          .map((l) => `${l.language} (${l.proficiency})`)
          .join(", ")
      );
    }

    if (resume.publications?.length > 0) {
      parts.push("PUBLICATIONS");
      resume.publications.forEach((pub) => {
        parts.push(`${pub.title} (${pub.venue}${pub.date ? `, ${pub.date}` : ""})`);
      });
    }

    if (resume.volunteer?.length > 0) {
      parts.push("VOLUNTEER");
      resume.volunteer.forEach((v) => {
        parts.push(`${v.role} at ${v.organization}`);
        (v.bullets || []).forEach((b) => parts.push(`- ${b}`));
      });
    }

    if (resume.interests?.length > 0) {
      parts.push(`INTERESTS: ${resume.interests.join(", ")}`);
    }

    if (resume.referencesText) {
      parts.push(`REFERENCES: ${resume.referencesText}`);
    }

    if (resume.customSections?.length > 0) {
      resume.customSections.forEach((cs) => {
        parts.push(cs.title.toUpperCase());
        if (Array.isArray(cs.content)) {
          cs.content.forEach((b) => parts.push(`- ${b}`));
        } else {
          parts.push(cs.content);
        }
      });
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
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "An error occurred during resume analysis.",
        { id: toastId }
      );
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
    const toastId = toast.loading("Generating your PDF…");

    try {
      const element = previewPrintRef.current || offscreenPrintRef.current;
      if (!element) {
        throw new Error("Resume preview not found. Switch to Preview tab and try again.");
      }

      const html2pdf = (await import("html2pdf.js")).default;

      // Sanitise filename — strip apostrophes, spaces and all special chars so Android
      // doesn't reject the filename at the filesystem layer.
      const cleanName = (resume.contact.fullName || "")
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      const filename = cleanName ? `${cleanName}_Resume.pdf` : "Resume.pdf";

      // Native devices use scale 1.5 to prevent high-DPI GPU canvas allocation OOM crashes
      const opt = {
        margin: 0,
        filename,
        image: { type: "jpeg" as const, quality: 0.95 },
        html2canvas: {
          scale: isNative() ? 1.5 : 2,
          useCORS: false,
          logging: false,
        },
        jsPDF: {
          unit: "mm",
          format: resume.meta.pageSize === "Letter" ? "letter" : "a4",
          orientation: "portrait" as const,
        },
      };

      const worker = html2pdf().from(element).set(opt);
      const pdfBlob = (await worker.outputPdf("blob")) as Blob;

      if (!pdfBlob || pdfBlob.size < 500) {
        throw new Error("PDF is empty — the preview may still be loading. Please try again.");
      }

      // savePdfAndShare handles both paths:
      //   Native → Filesystem.writeFile (CACHE dir) + Share.share(file:// URI)
      //   Web    → <a download> blob URL
      const result = await savePdfAndShare(pdfBlob, filename);

      setExportState("ready"); // always reset so the user can export again
      setExportFailCount(0);
      hapticSuccess();

      if (result.delivered) {
        toast.success(result.message, { id: toastId, duration: 5000 });
      } else {
        // User cancelled the share sheet — dismiss the loading toast silently
        toast.dismiss(toastId);
      }
    } catch (err: unknown) {
      setExportState("failed");
      setExportFailCount((prev) => prev + 1);
      const msg =
        err instanceof Error ? err.message : "Export failed. Tap Retry to try again.";
      toast.error(msg, { id: toastId, duration: 8000 });
    }
  };

  const handleExportPDF = (force = false) => {
    if (exportState === "preparing") return;

    const fullNameTrimmed = resume.contact.fullName?.trim() || "";
    const isPlaceholderName =
      !fullNameTrimmed ||
      fullNameTrimmed.toLowerCase() === "guest explorer";

    const emailTrimmed = resume.contact.email?.trim() || "";
    const isPlaceholderEmail =
      !emailTrimmed ||
      emailTrimmed.toLowerCase() === "guest@resumentor.app";

    if (!force) {
      // Pre-flight check (Section 4.2)
      const warnings: PreflightWarning[] = [];
      if (isPlaceholderName) {
        warnings.push({
          field: "Full Name",
          message: !fullNameTrimmed
            ? "Candidate full name is blank."
            : "Cannot export with placeholder 'Guest Explorer'. Please enter your real full name.",
          section: "contact",
          isBlocking: true,
        });
      }
      if (isPlaceholderEmail) {
        warnings.push({
          field: "Email Address",
          message: !emailTrimmed
            ? "No email address found for ATS contact parsing."
            : "Cannot export with placeholder 'guest@resumentor.app'. Please enter your real email.",
          section: "contact",
          isBlocking: true,
        });
      }
      if (resume.experience.length === 0) {
        warnings.push({
          field: "Work Experience",
          message: "No work experience entries added.",
          section: "experience",
          isBlocking: false,
        });
      }

      if (warnings.length > 0) {
        setPreflightWarnings(warnings);
        setShowPreflightModal(true);
        return;
      }
    } else {
      // Hard guard: even with force = true, never export dummy or empty credentials
      if (isPlaceholderName || isPlaceholderEmail) {
        toast.error("Please enter your real full name and email address before exporting.");
        navigateToSection("contact");
        return;
      }
    }

    setShowPreflightModal(false);
    executePDFExport();
  };

  const handlePrintBrowser = () => {
    if (isNative()) {
      handleExportPDF(false);
      return;
    }
    window.print();
  };

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col pb-6 lg:pb-8">
      {/* Top Action Toolbar: Clean layout without overlaps, full-width title row on mobile */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 pt-[calc(var(--sat,env(safe-area-inset-top,0px))+0.625rem)] pb-2.5 sm:py-3 sticky top-0 z-20 shadow-xs flex flex-col gap-2 sm:gap-2.5">
        {/* Row 1: Unified Back Arrow, Document Title (Full width on mobile with pencil), Save Status */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => dispatchBack()}
              aria-label="Back"
              className="p-2 -ml-1 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg min-w-[48px] min-h-[48px] flex items-center justify-center transition active:scale-95 shrink-0"
              title="Go Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1 min-w-0 flex-1">
              <input
                type="text"
                value={resume.meta.title}
                onChange={(e) =>
                  handleUpdateResume({
                    ...resume,
                    meta: { ...resume.meta, title: e.target.value },
                  })
                }
                className="font-bold text-gray-900 text-sm sm:text-base border-b border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5 rounded truncate flex-1 min-w-0"
                title="Rename Resume"
                placeholder="My Resume"
              />
              <Pencil className="h-3 w-3 text-gray-400 shrink-0" />
            </div>

            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
              {saveStatus}
            </span>
          </div>

          {/* Desktop Right Actions (hidden on mobile, rendered below on mobile) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* AI ATS Analysis Action (Tonal Secondary) */}
            <button
              type="button"
              disabled={analysisLoading}
              onClick={triggerAnalysisPipeline}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-2.5 rounded-xl transition shadow-2xs disabled:opacity-50 min-h-[48px]"
              title="Evaluate ATS score and improvement tips with Gemini AI"
            >
              {analysisLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              )}
              <span>Analyze</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDataModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3.5 py-2.5 rounded-xl transition min-h-[48px]"
              title="Import/Export JSON or revision history"
            >
              <Database className="h-4 w-4" />
              <span>Data</span>
            </button>

            <button
              type="button"
              onClick={handlePrintBrowser}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3.5 py-2.5 rounded-xl transition min-h-[48px]"
              title="Print via browser"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>

            {/* One-Click Export PDF Button (Primary High Emphasis) */}
            <button
              type="button"
              disabled={exportState === "preparing"}
              onClick={() => handleExportPDF(false)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs min-h-[48px] ${
                exportState === "failed"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              } disabled:opacity-50`}
            >
              {exportState === "preparing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>
                {exportState === "preparing"
                  ? "Generating PDF…"
                  : exportState === "done"
                  ? "Exported"
                  : exportState === "failed"
                  ? "Retry"
                  : "Export PDF"}
              </span>
            </button>
          </div>
        </div>

        {/* Row 2 (Mobile only): Segmented Controls & Action Buttons with horizontal scroll protection */}
        <div className="flex lg:hidden items-center justify-between gap-1 w-full pt-1 border-t border-gray-100 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {/* Edit vs Preview Segmented Control */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab("edit")}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition min-h-[48px] flex items-center justify-center ${
                mobileTab === "edit"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition min-h-[48px] flex items-center justify-center ${
                mobileTab === "preview"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Preview
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* AI ATS Analysis (Tonal Outline) */}
            <button
              type="button"
              disabled={analysisLoading}
              onClick={triggerAnalysisPipeline}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-xl transition disabled:opacity-50 min-h-[48px] shrink-0"
              title="Evaluate ATS score with Gemini AI"
            >
              {analysisLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              )}
              <span>Analyze</span>
            </button>

            {/* Data modal */}
            <button
              type="button"
              onClick={() => setShowDataModal(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition min-h-[48px] shrink-0"
              title="Import/Export JSON or revision history"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Data</span>
            </button>

            {/* Export PDF (Sole Primary) */}
            <button
              type="button"
              disabled={exportState === "preparing"}
              onClick={() => handleExportPDF(false)}
              className={`inline-flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs min-h-[48px] shrink-0 ${
                exportState === "failed"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              } disabled:opacity-50`}
            >
              {exportState === "preparing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>
                {exportState === "preparing"
                  ? "Generating…"
                  : exportState === "failed"
                  ? "Retry"
                  : "Export"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Horizontal Step Indicator */}
      <StepIndicator
        sectionOrder={resume.meta.sectionOrder}
        sectionVisibility={resume.meta.sectionVisibility}
        activeSection={activeSection}
        onSelectSection={(sec) => navigateToSection(sec)}
        completionMap={completionMap}
      />

      {/* Main Workspace: Full width mobile, Two-pane Desktop */}
      <div className="max-w-7xl mx-auto w-full px-1.5 sm:px-4 lg:px-6 py-2 sm:py-5 flex-1 flex flex-col lg:flex-row gap-2.5 sm:gap-4 lg:gap-8 items-start">
        {/* LEFT PANE: Form Sections (Visible on Desktop OR when mobileTab === 'edit') */}
        <div
          className={`w-full lg:w-1/2 flex flex-col space-y-3 sm:space-y-6 ${
            mobileTab === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="bg-transparent sm:bg-white rounded-2xl sm:rounded-3xl p-0 sm:p-6 lg:p-7 border-0 sm:border sm:border-gray-150 shadow-none sm:shadow-xs">
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
                sectionKey={activeSection as AdditionalSectionKey}
                onChange={handleUpdateResume}
              />
            )}

            {/* Stepper Navigation Buttons */}
            <div className="mt-4 pt-3 sm:mt-8 sm:pt-6 border-t border-gray-150 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 min-h-[38px] sm:min-h-[44px]"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition shadow-sm min-h-[38px] sm:min-h-[44px]"
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
              <span className="text-xs font-bold text-gray-800 tracking-wider">
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
          <div className="bg-gray-200/80 p-1.5 sm:p-6 rounded-xl sm:rounded-2xl overflow-x-auto shadow-inner border border-gray-300/60 flex justify-center">
            <ResumePreview ref={previewPrintRef} resume={resume} />
          </div>

          {/* ATS Checklist Scorecard (Local Rule-based) */}
          <ATSChecklist resume={resume} />
        </div>
      </div>

      {/* Sticky Mobile Step Progression Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3.5 py-2 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] z-30 shadow-lg flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={currentStepIndex === 0}
          onClick={handlePrevStep}
          className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none transition min-h-[48px]"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider">
            {saveStatus}
          </span>
          <span className="text-[11px] font-bold text-indigo-700">
            {SECTION_REGISTRY[activeSection]?.label || ""}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextStep}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-xs transition min-h-[48px]"
        >
          <span>
            {currentStepIndex < visibleSections.length - 1
              ? `Next: ${SECTION_REGISTRY[visibleSections[currentStepIndex + 1]]?.label?.split(" ")[0] || "Next"}`
              : "Preview"}
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

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
          userId={currentUser?.id}
          user={currentUser}
          onUpdateResume={handleUpdateResume}
          onClose={() => setShowDataModal(false)}
        />
      )}

      {/* Offscreen Dedicated Render Container for 1-Page PDF Export */}
      <div
        className="fixed -left-[9999px] top-0 pointer-events-none opacity-0 w-[800px] z-[-100]"
        aria-hidden="true"
      >
        <ResumePreview ref={offscreenPrintRef} resume={resume} />
      </div>
    </div>
  );
}
