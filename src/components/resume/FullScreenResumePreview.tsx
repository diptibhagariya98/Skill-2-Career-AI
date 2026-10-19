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
} from "lucide-react";
import { ResumeData, PageSize, TemplateId } from "@/types/resume";
import { ACCENT_COLORS } from "@/types/resume";
import { ResumePreview } from "./ResumePreview";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomMode, setZoomMode] = useState<"fit_width" | "fit_page" | "manual">("fit_page");
  const [manualZoom, setManualZoom] = useState<number>(1.0);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState<boolean>(false);

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

  // Lock body scroll while full screen preview is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Calculate effective zoom scale
  const availableWidth = Math.max(viewportSize.width - (viewportSize.width < 640 ? 24 : 64), 280);
  const availableHeight = Math.max(viewportSize.height - (viewportSize.width < 640 ? 150 : 160), 300);

  let currentZoom = manualZoom;
  if (zoomMode === "fit_page") {
    const scaleByHeight = availableHeight / baseHeight;
    const scaleByWidth = availableWidth / baseWidth;
    currentZoom = Math.min(scaleByHeight, scaleByWidth, 1.1);
  } else if (zoomMode === "fit_width") {
    currentZoom = Math.min(availableWidth / baseWidth, 1.4);
  }

  const handleZoomIn = () => {
    setZoomMode("manual");
    setManualZoom((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.0));
  };

  const handleZoomOut = () => {
    setZoomMode("manual");
    setManualZoom((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.3));
  };

  const handleResetZoom = () => {
    setZoomMode("manual");
    setManualZoom(1.0);
  };

  // Touch Gesture Handling (Pinch-to-Zoom & Finger Panning)
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1.0);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const isPinchingRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Two-finger pinch start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartZoomRef.current = currentZoom;
      isPinchingRef.current = true;
    } else if (e.touches.length === 1) {
      // Single-finger: check double tap or start pan
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        // Quick double tap -> Toggle zoom between fit_page and 1.35x
        if (zoomMode === "fit_page") {
          setZoomMode("manual");
          setManualZoom(1.35);
        } else {
          setZoomMode("fit_page");
          setManualZoom(1.0);
        }
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      if (containerRef.current) {
        panStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          scrollLeft: containerRef.current.scrollLeft,
          scrollTop: containerRef.current.scrollTop,
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current && isPinchingRef.current) {
      // Two-finger pinch-to-zoom calculation
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / pinchStartDistRef.current;
      const targetZoom = Number((pinchStartZoomRef.current * factor).toFixed(2));
      const clampedZoom = Math.min(Math.max(targetZoom, 0.35), 2.5);

      setZoomMode("manual");
      setManualZoom(clampedZoom);
    } else if (e.touches.length === 1 && panStartRef.current && containerRef.current && !isPinchingRef.current) {
      // Smooth finger pan
      const dx = e.touches[0].clientX - panStartRef.current.x;
      const dy = e.touches[0].clientY - panStartRef.current.y;
      containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      pinchStartDistRef.current = null;
      isPinchingRef.current = false;
    }
    if (e.touches.length === 0) {
      panStartRef.current = null;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full Screen PDF Preview"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-fade-in select-none"
    >
      {/* Top App Bar */}
      <header className="h-16 shrink-0 bg-slate-900/95 border-b border-slate-800/80 px-3 sm:px-6 pt-[var(--sat,env(safe-area-inset-top,0px))] flex items-center justify-between gap-2 shadow-md">
        {/* Left: Back/Close Button + Title */}
        <div className="flex items-center gap-2 min-w-0">
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
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs">
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

        {/* Center / Right: Template, Palette, Page Size & Download Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Template Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTemplatePicker(!showTemplatePicker);
                setShowColorPicker(false);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition min-h-[38px]"
              title="Change resume template"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline capitalize">
                {resume.meta.selectedTemplate}
              </span>
            </button>

            {showTemplatePicker && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowTemplatePicker(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-1.5 z-40 animate-fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition active:scale-95 shrink-0"
              title="Accent Color"
            >
              <span
                className="w-4 h-4 rounded-full ring-2 ring-white/20"
                style={{ backgroundColor: resume.meta.accentColor || "#1e3a8a" }}
              />
            </button>

            {showColorPicker && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowColorPicker(false)}
                />
                <div className="absolute right-0 top-full mt-2 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 w-48 space-y-2 animate-fade-in">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="h-3 w-3" /> Accent Colors
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
                        className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center ${
                          resume.meta.accentColor === c.hex
                            ? "ring-2 ring-white scale-110"
                            : "hover:scale-105"
                        }`}
                        title={c.name}
                      >
                        {resume.meta.accentColor === c.hex && (
                          <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Page Size Segmented Toggle (A4 / Letter) */}
          <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 shrink-0">
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

          {/* Export High-Res PDF Button */}
          <button
            type="button"
            disabled={exportState === "preparing"}
            onClick={onExportPDF}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-md active:scale-95 shrink-0 ${
              exportState === "failed"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            } disabled:opacity-50 min-h-[38px]`}
            title="Download vector PDF"
          >
            {exportState === "preparing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden xs:inline">
              {exportState === "preparing"
                ? "Generating…"
                : exportState === "failed"
                ? "Retry"
                : "Export PDF"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Canvas Scroll Area with Multi-touch Gestures (Pinch-to-zoom & Smooth Pan) */}
      <main
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="flex-1 overflow-auto bg-slate-950 flex justify-center items-start p-3 sm:p-8 overscroll-contain select-none"
        style={{
          touchAction: "pan-x pan-y pinch-zoom",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="relative flex flex-col items-center justify-start min-w-full pb-28 pt-2">
          <ResumePreview
            resume={resume}
            scale={currentZoom}
            autoFit={false}
            padding={0}
            className="shadow-2xl ring-1 ring-white/10"
          />
        </div>
      </main>

      {/* Bottom Floating Control Dock */}
      <footer className="shrink-0 p-3 pb-[max(var(--sab,env(safe-area-inset-bottom,0px)),0.75rem)] flex justify-center">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-2 sm:gap-3 text-xs">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition active:scale-90"
            title="Zoom out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Current Scale Readout */}
          <span className="text-[11px] font-mono font-bold text-slate-200 min-w-[42px] text-center">
            {Math.round(currentZoom * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition active:scale-90"
            title="Zoom in (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <span className="w-px h-4 bg-slate-700 mx-0.5" />

          {/* Fit to Page Button */}
          <button
            type="button"
            onClick={() => setZoomMode("fit_page")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition flex items-center gap-1 ${
              zoomMode === "fit_page"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Fit entire page vertically"
          >
            <Minimize2 className="h-3 w-3" />
            <span className="hidden sm:inline">Fit Page</span>
          </button>

          {/* Fit to Width Button */}
          <button
            type="button"
            onClick={() => setZoomMode("fit_width")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition flex items-center gap-1 ${
              zoomMode === "fit_width"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Fit document width to screen"
          >
            <Maximize2 className="h-3 w-3" />
            <span className="hidden sm:inline">Fit Width</span>
          </button>

          {/* Reset to 100% */}
          <button
            type="button"
            onClick={handleResetZoom}
            className={`px-2 py-1 rounded-full text-[11px] font-semibold transition flex items-center gap-1 ${
              zoomMode === "manual" && manualZoom === 1.0
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="100% actual size"
          >
            <RotateCcw className="h-3 w-3" />
            <span>100%</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default FullScreenResumePreview;
