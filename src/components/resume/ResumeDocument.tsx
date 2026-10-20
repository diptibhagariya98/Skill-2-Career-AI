import React from "react";
import { ResumeData, PageSize, TemplateId } from "@/types/resume";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { ModernTemplate } from "./templates/ModernTemplate";
import { CompactTemplate } from "./templates/CompactTemplate";
import { AcademicTemplate } from "./templates/AcademicTemplate";
import { MinimalistTemplate } from "./templates/MinimalistTemplate";
import { CreativeTemplate } from "./templates/CreativeTemplate";

export interface ResumeDocumentProps {
  resume: ResumeData;
  isPrintMode?: boolean;
}

export function ResumeDocument({ resume, isPrintMode = false }: ResumeDocumentProps) {
  const meta = resume.meta;
  const template: TemplateId = meta.selectedTemplate || "classic";
  const pageSize: PageSize = meta.pageSize || "A4";
  const accentColor = meta.accentColor || "#1e3a8a";

  // Exact standard dimensions:
  // A4 = 210mm x 297mm (~794px x 1123px at 96dpi)
  // Letter = 8.5in x 11in (~816px x 1056px at 96dpi)
  const isA4 = pageSize === "A4";
  const containerStyle: React.CSSProperties = {
    width: isA4 ? "210mm" : "8.5in",
    minHeight: isA4 ? "297mm" : "11in",
    maxWidth: "100%",
    padding: template === "compact" ? "8mm 10mm" : "12mm 14mm",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
  };

  const renderTemplateBody = () => {
    switch (template) {
      case "classic":
        return <ClassicTemplate resume={resume} accentColor={accentColor} />;
      case "modern":
        return <ModernTemplate resume={resume} accentColor={accentColor} />;
      case "compact":
        return <CompactTemplate resume={resume} accentColor={accentColor} />;
      case "academic":
        return <AcademicTemplate resume={resume} accentColor={accentColor} />;
      case "minimalist":
        return <MinimalistTemplate resume={resume} accentColor={accentColor} />;
      case "creative":
        return <CreativeTemplate resume={resume} accentColor={accentColor} />;
      default:
        return <ClassicTemplate resume={resume} accentColor={accentColor} />;
    }
  };

  return (
    <div
      className="resume-document-root bg-white text-gray-900 mx-auto"
      style={containerStyle}
      data-template={template}
      data-page-size={pageSize}
    >
      {isPrintMode && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: ${isA4 ? "A4 portrait" : "letter portrait"};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page-break-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            h1, h2, h3 {
              break-after: avoid !important;
              page-break-after: avoid !important;
            }
          `
        }} />
      )}
      {renderTemplateBody()}
    </div>
  );
}
