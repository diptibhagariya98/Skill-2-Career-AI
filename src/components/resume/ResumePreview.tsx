"use client";

import React, { forwardRef } from "react";
import { ResumeData } from "@/types/resume";
import { ResumeDocument } from "./ResumeDocument";

interface ResumePreviewProps {
  resume: ResumeData;
  scale?: number;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resume, scale = 1 }, ref) => {
    return (
      <div
        ref={ref}
        className="resume-preview-wrapper shadow-lg transition-transform duration-150 origin-top bg-white rounded-sm overflow-hidden"
        style={{
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top center",
        }}
      >
        <ResumeDocument resume={resume} isPrintMode={false} />
      </div>
    );
  }
);

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;
