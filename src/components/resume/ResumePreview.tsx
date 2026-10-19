"use client";

import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from "react";
import { ResumeData } from "@/types/resume";
import { ResumeDocument } from "./ResumeDocument";

export interface ResumePreviewProps {
  resume: ResumeData;
  scale?: number;
  autoFit?: boolean;
  padding?: number;
  className?: string;
  onComputedScaleChange?: (scale: number) => void;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  (
    {
      resume,
      scale: manualScale,
      autoFit = true,
      padding = 16,
      className = "",
      onComputedScaleChange,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const isA4 = (resume.meta.pageSize || "A4") === "A4";
    // Standard physical page pixel dimensions at 96 DPI
    // A4: 210mm x 297mm -> 793.7px x 1122.5px (~794px x 1123px)
    // US Letter: 8.5in x 11in -> 816px x 1056px
    const baseWidth = isA4 ? 794 : 816;
    const baseHeight = isA4 ? 1123 : 1056;

    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [docHeight, setDocHeight] = useState<number>(baseHeight);

    // Forward ref to contentRef so parent can read innerText for ATS analysis
    useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

    // Measure container width responsively
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const updateWidth = () => {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0) {
          setContainerWidth(rect.width);
        }
      };

      updateWidth();

      const observer = new ResizeObserver(() => {
        updateWidth();
      });

      observer.observe(container);
      window.addEventListener("resize", updateWidth);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", updateWidth);
      };
    }, []);

    // Measure document actual rendered height so multi-page or dynamic content fits cleanly
    useEffect(() => {
      const content = contentRef.current;
      if (!content) return;

      const updateHeight = () => {
        const height = content.scrollHeight;
        if (height > 0) {
          setDocHeight(Math.max(height, baseHeight));
        }
      };

      updateHeight();

      const observer = new ResizeObserver(() => {
        updateHeight();
      });

      observer.observe(content);

      return () => {
        observer.disconnect();
      };
    }, [resume, baseHeight]);

    // Calculate effective scale
    let effectiveScale = 1.0;
    if (manualScale !== undefined && manualScale > 0) {
      effectiveScale = manualScale;
    } else if (autoFit && containerWidth > 0) {
      const availableWidth = Math.max(containerWidth - padding * 2, 200);
      effectiveScale = Math.min(availableWidth / baseWidth, 1.25);
    }

    // Notify parent if scale changes
    useEffect(() => {
      if (onComputedScaleChange) {
        onComputedScaleChange(effectiveScale);
      }
    }, [effectiveScale, onComputedScaleChange]);

    const scaledWidth = Math.round(baseWidth * effectiveScale);
    const scaledHeight = Math.round(docHeight * effectiveScale);

    return (
      <div
        ref={containerRef}
        className={`w-full flex justify-center items-start ${className}`}
      >
        <div
          className="relative bg-white shadow-xl transition-all duration-100 ease-out border border-gray-300/80 rounded-xs"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            ref={contentRef}
            className="resume-preview-document-scaler"
            style={{
              width: `${baseWidth}px`,
              minHeight: `${baseHeight}px`,
              transform: `scale(${effectiveScale})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <ResumeDocument resume={resume} isPrintMode={false} />
          </div>
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;
