"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Loader2,
  Layers,
} from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";
import { useBackHandler, BackPriority } from "@/shared/platform";

export enum DocumentTab {
  NOTES = "notes",
  VIEWER = "viewer",
}

export interface NoteSection {
  title: string;
  summary: string;
  points: string[];
  codeSnippet?: string;
  tags?: string[];
}

export interface DownloadableNoteItem {
  id: string;
  title: string;
  category: string;
  icon?: React.ComponentType<{ className?: string }>;
  pages: string;
  size: string;
  topics: string[];
  pdfUrl: string;
  fileName: string;
  description?: string;
  sections?: NoteSection[];
}

export interface DocumentViewerModalProps {
  note: DownloadableNoteItem;
  onClose: () => void;
  onDownload: (note: DownloadableNoteItem) => void;
  onShare: (note: DownloadableNoteItem) => void;
  isDownloading?: boolean;
}

export function DocumentViewerModal({
  note,
  onClose,
  onDownload,
  onShare,
  isDownloading = false,
}: DocumentViewerModalProps) {
  const [activeTab, setActiveTab] = useState<DocumentTab>(DocumentTab.NOTES);
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [scaleReadout, setScaleReadout] = useState<number>(1.0);
  const [readSections, setReadSections] = useState<Record<string, boolean>>({});

  // Android Hardware Back Button priority handling
  useBackHandler(
    BackPriority.OVERLAY,
    () => {
      onClose();
      return true;
    },
    [onClose]
  );

  // Lock body scroll while modal is visible
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const toggleSectionRead = (idx: number) => {
    setReadSections((prev) => ({
      ...prev,
      [idx.toString()]: !prev[idx.toString()],
    }));
  };

  const sections = note.sections || [];
  const completedCount = Object.values(readSections).filter(Boolean).length;
  const progressPercent = sections.length > 0 ? Math.round((completedCount / sections.length) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${note.title} Document Viewer`}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 animate-fade-in select-none"
    >
      {/* ── Top App Bar ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-slate-900/95 border-b border-slate-800/80 px-3 sm:px-6 pt-[var(--sat,env(safe-area-inset-top,0px))] min-h-[64px] flex items-center justify-between gap-2 shadow-md">
        {/* Left: Back Arrow + Document Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to Notes Catalog"
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center transition shrink-0"
            title="Close viewer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[170px] sm:max-w-md">
              {note.title}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="text-amber-400 font-semibold">{note.category}</span>
              <span>•</span>
              <span className="text-slate-300">{note.pages}</span>
              <span>•</span>
              <span>{note.size}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Download & Share) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isDownloading}
            onClick={() => onDownload(note)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white transition shadow-sm min-h-[38px] disabled:opacity-50"
            title="Download PDF document"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden xs:inline">
              {isDownloading ? "Saving…" : "Download"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onShare(note)}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center transition shrink-0"
            title="Share Document"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Mode Segment Switcher ─────────────────────────────────────────── */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800/80 px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab(DocumentTab.NOTES)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === DocumentTab.NOTES
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(DocumentTab.VIEWER)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === DocumentTab.VIEWER
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Canvas Viewer</span>
          </button>
        </div>

        {activeTab === DocumentTab.NOTES && sections.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Read: {completedCount}/{sections.length}</span>
            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Main Body Content ─────────────────────────────────────────────── */}
      {activeTab === DocumentTab.NOTES ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 space-y-5 bg-slate-950 text-slate-200">
          {/* Document Highlights Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/20 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Verified Curriculum Document
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  {note.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {note.description ||
                    "Curated academic review notes, architectural patterns, and interview syntax references formatted for fast mobile review."}
                </p>

                {/* Topics Covered Chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {note.topics.map((t, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium bg-amber-950/60 text-amber-200 border border-amber-600/30 px-2 py-0.5 rounded-md"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Structured Note Chapters / Modules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Chapter Breakdown & Key Takeaways</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Tap checklist to mark reviewed
              </span>
            </div>

            {sections.length > 0 ? (
              sections.map((sec, idx) => {
                const isDone = !!readSections[idx.toString()];
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition p-4 sm:p-5 ${
                      isDone
                        ? "bg-slate-900/40 border-slate-800 text-slate-400"
                        : "bg-slate-900/90 border-slate-800/90 hover:border-amber-500/40 text-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSectionRead(idx)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                            isDone
                              ? "bg-emerald-600 text-white"
                              : "border border-slate-600 text-slate-400 hover:border-amber-400 hover:text-amber-400"
                          }`}
                          title={isDone ? "Mark as unread" : "Mark as read"}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <h5
                          className={`text-sm sm:text-base font-bold ${
                            isDone ? "line-through text-slate-400" : "text-white"
                          }`}
                        >
                          {sec.title}
                        </h5>
                      </div>
                      {sec.tags && sec.tags.length > 0 && (
                        <div className="flex gap-1 shrink-0">
                          {sec.tags.map((tg, ti) => (
                            <span
                              key={ti}
                              className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                            >
                              {tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3 pl-8">
                      {sec.summary}
                    </p>

                    {/* Bullet Points */}
                    {sec.points && sec.points.length > 0 && (
                      <ul className="space-y-1.5 text-xs text-slate-300 pl-8 mb-3">
                        {sec.points.map((pt, pi) => (
                          <li key={pi} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Optional Code Snippet */}
                    {sec.codeSnippet && (
                      <div className="ml-8 mt-2.5 rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-amber-200/90 overflow-x-auto">
                        <pre>{sec.codeSnippet}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              /* Fallback if sections not populated */
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-3">
                <p className="text-sm text-slate-300">
                  This curated study guide is compiled from verified academic units.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab(DocumentTab.VIEWER)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Switch to PDF Canvas View</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── PDF Canvas View with Hardware-Accelerated Touch Zoom & Pan ───── */
        <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-950 flex flex-col">
          <main className="flex-1 w-full h-full relative overflow-hidden bg-slate-950 select-none">
            <TransformWrapper
              ref={transformRef}
              initialScale={1.0}
              minScale={0.3}
              maxScale={3.0}
              centerOnInit={true}
              centerZoomedOut={true}
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
                wrapperClass="!w-full !h-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
                contentClass="flex items-center justify-center p-4 sm:p-8"
              >
                {/* Formatted High-Fidelity Printable Document Canvas */}
                <div className="w-[340px] sm:w-[600px] md:w-[700px] bg-white text-gray-950 rounded-lg shadow-2xl p-6 sm:p-10 border border-gray-200 space-y-6">
                  {/* Canvas Header */}
                  <div className="border-b-2 border-amber-600 pb-4">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">
                      <span>Curriculum Reference Document</span>
                      <span>{note.pages}</span>
                    </div>
                    <h1 className="text-lg sm:text-2xl font-black text-gray-950 leading-tight">
                      {note.title}
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                      <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                        {note.category}
                      </span>
                      <span>•</span>
                      <span>ResuMentor Verified Learning Unit</span>
                    </div>
                  </div>

                  {/* Core Topics Checklist */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Syllabus Competency Coverage
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {note.topics.map((t, ti) => (
                        <div
                          key={ti}
                          className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-gray-800">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Excerpt / Overview */}
                  <div className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Core Academic Summary
                    </h3>
                    <p>
                      {note.description ||
                        "This document provides verified formulas, algorithmic breakdowns, and production architectures aligned with technical hiring assessments."}
                    </p>
                  </div>

                  {/* Action Banner inside document */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Original Document File: {note.fileName}
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Download to read all pages in high-resolution or open with your system PDF viewer.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => onDownload(note)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? "Saving…" : "Save File"}</span>
                    </button>
                  </div>
                </div>
              </TransformComponent>
            </TransformWrapper>
          </main>

          {/* Bottom Floating Control Dock */}
          <footer className="shrink-0 p-3 pb-[max(var(--sab,env(safe-area-inset-bottom,0px)),0.75rem)] flex justify-center bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-2 sm:gap-3 text-xs">
              <button
                type="button"
                onClick={() => transformRef.current?.zoomOut(0.2)}
                aria-label="Zoom out"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Zoom out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <span className="text-[11px] font-mono font-bold text-slate-200 min-w-[42px] text-center">
                {Math.round(scaleReadout * 100)}%
              </span>

              <button
                type="button"
                onClick={() => transformRef.current?.zoomIn(0.2)}
                aria-label="Zoom in"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Zoom in (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <span className="w-px h-4 bg-slate-700 mx-0.5" />

              <button
                type="button"
                onClick={() => transformRef.current?.centerView(1.0)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition min-h-[32px] flex items-center gap-1"
                title="Reset to 100%"
              >
                <RotateCcw className="h-3 w-3" />
                <span>100%</span>
              </button>

              <button
                type="button"
                onClick={() => transformRef.current?.centerView(0.6)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition min-h-[32px] flex items-center gap-1"
                title="Fit document view"
              >
                <Maximize2 className="h-3 w-3" />
                <span>Fit</span>
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

export default DocumentViewerModal;
