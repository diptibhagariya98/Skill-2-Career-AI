"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Download,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Palette,
  Check,
  FileText,
  ChevronDown,
  Info,
} from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";
import { useBackHandler, BackPriority, setAppStatusBarStyle, AppStatusBarStyle } from "@/shared/platform";
import { Portal } from "@/shared/ui/Portal";
import { ResumeData, PageSize, TemplateId } from "@/types/resume";
import { ACCENT_COLORS } from "@/types/resume";
import { ResumeDocument } from "./ResumeDocument";

export interface FullScreenResumePreviewProps {
  resume: ResumeData;
  onUpdateResume: (updated: ResumeData) => void;
  onExportPDF: () => void;
  exportState: "ready" | "preparing" | "done" | "failed";
  onClose: () => void;
}

const TEMPLATE_OPTIONS: { id: TemplateId; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "modern", label: "Modern" },
  { id: "compact", label: "Compact" },
  { id: "academic", label: "Academic" },
  { id: "minimalist", label: "Minimalist" },
  { id: "creative", label: "Creative" },
];

export function FullScreenResumePreview({
  resume,
  onUpdateResume,
  onExportPDF,
  exportState,
  onClose,
}: FullScreenResumePreviewProps) {
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [zoomMode, setZoomMode] = useState<"fit_width" | "fit_page" | "manual">("fit_page");
  const [scaleReadout, setScaleReadout] = useState<number>(1.0);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState<boolean>(false);
  const [dismissDraftBanner, setDismissDraftBanner] = useState<boolean>(false);

  // Exact standard dimensions at 96 DPI:
  // A4 = 210mm x 297mm -> 794px x 1123px
  // US Letter = 8.5in x 11in -> 816px x 1056px
  const isA4 = (resume.meta.pageSize || "A4") === "A4";
  const baseWidth = isA4 ? 794 : 816;
  const baseHeight = isA4 ? 1123 : 1056;

  // Viewport measurements
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Android System Back Button Priority Handler
  useBackHandler(
    BackPriority.OVERLAY,
    () => {
      onClose();
      return true;
    },
    [onClose]
  );

  // Keyboard navigation: Escape key closes preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll and set status bar theme while full screen preview is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    void setAppStatusBarStyle(AppStatusBarStyle.LIGHT_CONTENT);
    return () => {
      document.body.style.overflow = originalOverflow;
      void setAppStatusBarStyle(AppStatusBarStyle.DARK_CONTENT);
    };
  }, []);

  // Compute optimal scales for initial view and dock presets
  const availableWidth = Math.max(viewportSize.width - (viewportSize.width < 640 ? 24 : 64), 280);
  const availableHeight = Math.max(viewportSize.height - (viewportSize.width < 640 ? 140 : 160), 300);

  const fitPageScale = Math.min(availableHeight / baseHeight, availableWidth / baseWidth, 1.05);
  const fitWidthScale = Math.min(availableWidth / baseWidth, 1.4);

  // Synchronize initial scale readout
  useEffect(() => {
    setScaleReadout(fitPageScale);
  }, [fitPageScale]);

  // Check if draft has content
  const hasContact = Boolean(resume.contact.fullName?.trim() || resume.contact.email?.trim());
  const hasSummary = Boolean(resume.summary?.trim());
  const hasExperience = (resume.experience || []).length > 0;
  const hasEducation = (resume.education || []).length > 0;
  const hasSkills = Boolean(
    (resume.skills.isGrouped && resume.skills.groups.some((g) => g.skills && g.skills.length > 0)) ||
    (!resume.skills.isGrouped && (resume.skills.flatList || []).length > 0)
  );
  const isDraftEmpty = !hasContact && !hasSummary && !hasExperience && !hasEducation && !hasSkills;

  const handleZoomIn = () => {
    setZoomMode("manual");
    transformRef.current?.zoomIn(0.15, 150, "easeOut");
  };

  const handleZoomOut = () => {
    setZoomMode("manual");
    transformRef.current?.zoomOut(0.15, 150, "easeOut");
  };

  const handleFitPage = () => {
    setZoomMode("fit_page");
    transformRef.current?.centerView(fitPageScale, 200, "easeOut");
  };

  const handleFitWidth = () => {
    setZoomMode("fit_width");
    if (!transformRef.current) return;
    const clientWidth = transformRef.current.instance?.wrapperComponent?.clientWidth || viewportSize.width;
    const targetX = (clientWidth - baseWidth * fitWidthScale) / 2;
    // Align top of page right under header with comfortable 20px padding
    transformRef.current.setTransform(targetX, 20, fitWidthScale, 200, "easeOut");
  };

  const handleResetZoom = () => {
    setZoomMode("manual");
    if (!transformRef.current) return;
    const clientWidth = transformRef.current.instance?.wrapperComponent?.clientWidth || viewportSize.width;
    const targetX = (clientWidth - baseWidth * 1.0) / 2;
    transformRef.current.setTransform(targetX, 20, 1.0, 200, "easeOut");
  };

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Full Screen PDF Preview"
        className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden"
      >
        {/* Top App Bar (Material 3 Expressive Toolbar) */}
        <header className="shrink-0 bg-slate-900 border-b border-slate-800/80 px-3 sm:px-6 pt-[calc(var(--sat,env(safe-area-inset-top,0px))+0.5rem)] min-h-[calc(var(--sat,env(safe-area-inset-top,0px))+3.75rem)] pb-2 flex items-center justify-between gap-2 shadow-md z-30">
        {/* Left: Close Button + Title & Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center transition shrink-0"
            title="Return to editor (Esc)"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs">
              {resume.meta.title || "Resume Preview"}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="capitalize font-semibold text-indigo-400">
                {resume.meta.selectedTemplate}
              </span>
              <span>•</span>
              <span className="uppercase font-semibold text-slate-300">
                {resume.meta.pageSize || "A4"}
              </span>
              <span>•</span>
              <span>1 Page</span>
            </div>
          </div>
        </div>

        {/* Right Actions: Template Picker + Theme Color + Page Size + Export */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Template Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTemplatePicker(!showTemplatePicker);
                setShowColorPicker(false);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition min-h-[38px] border border-slate-700/60"
              title="Change resume template"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="hidden xs:inline capitalize max-w-[65px] truncate">
                {resume.meta.selectedTemplate}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
            </button>

            {showTemplatePicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTemplatePicker(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    ATS Templates
                  </div>
                  {TEMPLATE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onUpdateResume({
                          ...resume,
                          meta: { ...resume.meta, selectedTemplate: t.id },
                        });
                        setShowTemplatePicker(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-800 transition ${
                        resume.meta.selectedTemplate === t.id
                          ? "text-indigo-400 font-bold bg-slate-800/50"
                          : "text-slate-300"
                      }`}
                    >
                      <span>{t.label}</span>
                      {resume.meta.selectedTemplate === t.id && (
                        <Check className="h-3.5 w-3.5 text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Accent Color Palette Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowTemplatePicker(false);
              }}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition min-h-[38px] border border-slate-700/60"
              title="Theme color palette"
              aria-label="Change theme accent color"
            >
              <Palette className="h-4 w-4 text-slate-300 shrink-0" />
              <span
                className="w-3.5 h-3.5 rounded-full ring-1.5 ring-white/60 shrink-0 shadow-xs"
                style={{ backgroundColor: resume.meta.accentColor || "#1e3a8a" }}
              />
            </button>

            {showColorPicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColorPicker(false)}
                />
                <div className="absolute right-0 top-full mt-2 p-3.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 w-52 space-y-2 animate-fade-in">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Theme Colors</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          onUpdateResume({
                            ...resume,
                            meta: { ...resume.meta, accentColor: c.hex },
                          });
                          setShowColorPicker(false);
                        }}
                        style={{ backgroundColor: c.hex }}
                        className={`h-8 w-8 rounded-full transition-transform flex items-center justify-center ${
                          resume.meta.accentColor === c.hex
                            ? "ring-2 ring-white scale-110 shadow-md"
                            : "hover:scale-105"
                        }`}
                        title={c.name}
                      >
                        {resume.meta.accentColor === c.hex && (
                          <Check className="h-4 w-4 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Page Size Segmented Toggle (A4 / Letter) on Tablets/Desktop */}
          <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700/60 shrink-0">
            {(["A4", "Letter"] as PageSize[]).map((ps) => (
              <button
                key={ps}
                type="button"
                onClick={() =>
                  onUpdateResume({
                    ...resume,
                    meta: { ...resume.meta, pageSize: ps },
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  (resume.meta.pageSize || "A4") === ps
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {ps}
              </button>
            ))}
          </div>

          {/* Primary High-Res PDF Export Button */}
          <button
            type="button"
            disabled={exportState === "preparing"}
            onClick={onExportPDF}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition shadow-md active:scale-95 shrink-0 min-h-[38px] ${
              exportState === "failed"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/50"
            } disabled:opacity-50`}
            title="Export vector PDF"
          >
            {exportState === "preparing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>
              {exportState === "preparing"
                ? "Generating…"
                : exportState === "failed"
                ? "Retry"
                : "Export PDF"}
            </span>
          </button>
        </div>
      </header>

      {/* Incomplete Draft Guidance Banner */}
      {isDraftEmpty && !dismissDraftBanner && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-2 flex items-center justify-between text-xs text-amber-200 z-20">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-[11px] text-amber-100 font-medium">
              Previewing blank draft. Add your contact information, experience, and skills in the editor to populate this resume.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDismissDraftBanner(true)}
            aria-label="Dismiss banner"
            className="text-amber-400 hover:text-white p-1 rounded transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Canvas with Natural Multi-touch Gestures (Pinch-to-zoom & Smooth Pan) */}
      <main className="flex-1 w-full min-h-0 relative overflow-hidden bg-slate-950 select-none">
        <TransformWrapper
          ref={transformRef}
          initialScale={fitPageScale}
          minScale={0.2}
          maxScale={3.0}
          centerOnInit={true}
          centerZoomedOut={false}
          limitToBounds={false}
          smooth={true}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: "toggle", step: 0.5 }}
          panning={{ disabled: false, velocityDisabled: false }}
          onTransform={(_, state) => {
            setScaleReadout(state.scale);
          }}
        >
          <TransformComponent
            wrapperClass="!w-full !h-full !block relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
            contentClass="!w-auto !h-auto !block select-none"
          >
            <div
              className="bg-white shadow-2xl ring-1 ring-white/10 select-none mx-auto"
              style={{
                width: `${baseWidth}px`,
                minHeight: `${baseHeight}px`,
              }}
            >
              <ResumeDocument resume={resume} isPrintMode={false} />
            </div>
          </TransformComponent>
        </TransformWrapper>
      </main>

      {/* Bottom Floating Control Dock */}
      <footer className="shrink-0 p-3 pb-[max(var(--sab,env(safe-area-inset-bottom,0px)),0.75rem)] flex justify-center pointer-events-none z-30">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-full px-2 sm:px-3 py-1.5 shadow-2xl flex items-center gap-1 sm:gap-2 text-xs pointer-events-auto">
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="w-9 h-9 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition active:scale-90 flex items-center justify-center min-w-[36px]"
            title="Zoom out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Current Scale Readout (tappable to reset to 100%) */}
          <button
            type="button"
            onClick={handleResetZoom}
            aria-label="Current zoom percentage. Tap to reset to 100%"
            title="Tap to reset to 100%"
            className="text-[11px] font-mono font-bold text-slate-200 px-1.5 py-1 rounded hover:bg-slate-800 transition min-w-[42px] text-center"
          >
            {Math.round(scaleReadout * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="w-9 h-9 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition active:scale-90 flex items-center justify-center min-w-[36px]"
            title="Zoom in (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <span className="w-px h-4 bg-slate-700 mx-0.5" />

          {/* Presets Segmented Group */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-full border border-slate-700/60">
            {/* Fit to Page */}
            <button
              type="button"
              onClick={handleFitPage}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition flex items-center gap-1 min-h-[30px] ${
                zoomMode === "fit_page"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
              title="Fit entire page vertically"
            >
              <Minimize2 className="h-3 w-3" />
              <span>Fit Page</span>
            </button>

            {/* Fit to Width */}
            <button
              type="button"
              onClick={handleFitWidth}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition flex items-center gap-1 min-h-[30px] ${
                zoomMode === "fit_width"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
              title="Fit document width to screen"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Fit Width</span>
            </button>

            {/* 100% (1:1) */}
            <button
              type="button"
              onClick={handleResetZoom}
              className={`px-2 py-1 rounded-full text-[11px] font-semibold transition flex items-center gap-1 min-h-[30px] ${
                zoomMode === "manual" && Math.round(scaleReadout * 100) === 100
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
              title="100% physical print size"
            >
              <RotateCcw className="h-3 w-3" />
              <span>100%</span>
            </button>
          </div>
        </div>
      </footer>
      </div>
    </Portal>
  );
}

export default FullScreenResumePreview;
