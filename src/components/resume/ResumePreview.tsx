"use client";

import React, { forwardRef } from "react";
import { ResumeData, TemplateId, PageSize } from "@/types/resume";
import { SECTION_REGISTRY } from "@/lib/resume/registry";

interface ResumePreviewProps {
  resume: ResumeData;
  scale?: number;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resume, scale = 1 }, ref) => {
    const { contact, summary, experience, education, skills, projects, certifications, meta } =
      resume;
    const template: TemplateId = meta.selectedTemplate || "classic";
    const pageSize: PageSize = meta.pageSize || "A4";
    const accentColor = meta.accentColor || "#0f766e";

    // Typography & Spacing based on Template
    let fontClass = "font-serif text-gray-900";
    let headingBorderClass = "border-b border-gray-300 pb-1";
    let sectionSpacingClass = "mb-4";

    if (template === "modern") {
      fontClass = "font-sans text-gray-900";
      headingBorderClass = "border-b-2 pb-1";
      sectionSpacingClass = "mb-5";
    } else if (template === "compact") {
      fontClass = "font-sans text-gray-900 text-xs leading-snug";
      headingBorderClass = "border-b border-gray-400 pb-0.5";
      sectionSpacingClass = "mb-3";
    } else if (template === "academic") {
      fontClass = "font-serif text-gray-900";
      headingBorderClass = "border-b border-gray-900 pb-1";
      sectionSpacingClass = "mb-6";
    }

    // Dimensions: A4 = 210mm x 297mm (~794px x 1123px at 96dpi), Letter = 8.5in x 11in (~816px x 1056px)
    const pageStyles = {
      width: pageSize === "Letter" ? "8.5in" : "210mm",
      minHeight: pageSize === "Letter" ? "11in" : "297mm",
      padding: "0.65in",
    };

    return (
      <div
        ref={ref}
        id="resume-print-root"
        style={{
          ...pageStyles,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top center",
        }}
        className={`bg-white shadow-xl mx-auto ${fontClass} leading-normal text-left select-text print:shadow-none print:m-0 print:p-8`}
      >
        {/* HEADER / CONTACT INFO (ATS Rule: Page body on page 1) */}
        <header className="mb-5 text-center border-b border-gray-200 pb-4">
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase"
            style={{ color: template === "modern" ? accentColor : "#111827" }}
          >
            {contact.fullName || "Your Full Name"}
          </h1>

          {contact.headline && (
            <p className="text-sm font-semibold text-gray-700 mt-1">{contact.headline}</p>
          )}

          {/* Contact Line - Plain text for ATS parsers */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-2 font-medium">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>• {contact.phone}</span>}
            {(contact.city || contact.country) && (
              <span>
                • {[contact.city, contact.state, contact.country].filter(Boolean).join(", ")}
              </span>
            )}
            {contact.linkedin && <span>• {contact.linkedin}</span>}
            {contact.website && <span>• {contact.website}</span>}
            {(contact.links || []).map((lnk) =>
              lnk.url ? <span key={lnk.id}>• {lnk.url}</span> : null
            )}
          </div>

          {contact.workAuthorization && (
            <p className="text-[11px] text-gray-500 mt-1 italic">{contact.workAuthorization}</p>
          )}
        </header>

        {/* Dynamic Sections ordered by meta.sectionOrder */}
        {meta.sectionOrder.map((key) => {
          if (meta.sectionVisibility[key] === false) return null;
          const def = SECTION_REGISTRY[key];

          // 1. SUMMARY
          if (key === "summary" && summary?.trim()) {
            return (
              <section key={key} className={sectionSpacingClass}>
                <h2
                  className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-2 ${headingBorderClass}`}
                  style={{
                    color: template === "modern" ? accentColor : "#1f2937",
                    borderColor: template === "modern" ? accentColor : undefined,
                  }}
                >
                  {def.atsHeading}
                </h2>
                <p className="text-xs sm:text-sm text-gray-800 leading-relaxed text-justify">
                  {summary}
                </p>
              </section>
            );
          }

          // 2. EXPERIENCE
          if (key === "experience" && experience?.length > 0) {
            return (
              <section key={key} className={sectionSpacingClass}>
                <h2
                  className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-2 ${headingBorderClass}`}
                  style={{
                    color: template === "modern" ? accentColor : "#1f2937",
                    borderColor: template === "modern" ? accentColor : undefined,
                  }}
                >
                  {def.atsHeading}
                </h2>
                <div className="space-y-3">
                  {experience.map((exp) => (
                    <div key={exp.id} className="text-xs sm:text-sm">
                      <div className="flex flex-wrap justify-between items-baseline font-bold text-gray-900">
                        <span>{exp.title}</span>
                        <span className="text-xs font-semibold text-gray-600">
                          {exp.startMonth} {exp.startYear} –{" "}
                          {exp.isCurrent ? "Present" : `${exp.endMonth || ""} ${exp.endYear || ""}`}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between items-baseline text-xs text-gray-700 italic mb-1">
                        <span>{exp.employer}</span>
                        {exp.location && <span>{exp.location}</span>}
                      </div>

                      {/* Bullets */}
                      {exp.bullets.filter(Boolean).length > 0 && (
                        <ul className="list-disc list-outside ml-4 space-y-1 text-gray-800 text-xs sm:text-[13px]">
                          {exp.bullets.filter(Boolean).map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}

                      {/* Tech stack */}
                      {exp.technologies && exp.technologies.length > 0 && (
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                          <strong>Technologies:</strong> {exp.technologies.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // 3. EDUCATION
          if (key === "education" && education?.length > 0) {
            return (
              <section key={key} className={sectionSpacingClass}>
                <h2
                  className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-2 ${headingBorderClass}`}
                  style={{
                    color: template === "modern" ? accentColor : "#1f2937",
                    borderColor: template === "modern" ? accentColor : undefined,
                  }}
                >
                  {def.atsHeading}
                </h2>
                <div className="space-y-2.5">
                  {education.map((edu) => (
                    <div key={edu.id} className="text-xs sm:text-sm">
                      <div className="flex flex-wrap justify-between items-baseline font-bold text-gray-900">
                        <span>
                          {edu.degree} {edu.field && `in ${edu.field}`}
                        </span>
                        <span className="text-xs font-semibold text-gray-600">
                          {edu.startYear} – {edu.endYear || "Present"}
                          {edu.isExpected && " (Expected)"}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between items-baseline text-xs text-gray-700 italic">
                        <span>{edu.institution}</span>
                        {edu.location && <span>{edu.location}</span>}
                      </div>
                      {edu.grade && (
                        <p className="text-[11px] text-gray-600 font-medium">
                          <strong>Grade:</strong> {edu.grade}
                        </p>
                      )}
                      {edu.highlights && edu.highlights.filter(Boolean).length > 0 && (
                        <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-gray-700 text-xs">
                          {edu.highlights.filter(Boolean).map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // 4. SKILLS
          if (key === "skills") {
            const hasGrouped =
              skills.isGrouped && skills.groups.some((g) => g.skills.length > 0);
            const hasFlat = !skills.isGrouped && (skills.flatList || []).length > 0;

            if (hasGrouped || hasFlat) {
              return (
                <section key={key} className={sectionSpacingClass}>
                  <h2
                    className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-2 ${headingBorderClass}`}
                    style={{
                      color: template === "modern" ? accentColor : "#1f2937",
                      borderColor: template === "modern" ? accentColor : undefined,
                    }}
                  >
                    {def.atsHeading}
                  </h2>
                  {skills.isGrouped ? (
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      {skills.groups
                        .filter((g) => g.skills.length > 0)
                        .map((grp) => (
                          <p key={grp.id} className="text-gray-800">
                            <strong className="font-semibold text-gray-900">{grp.name}:</strong>{" "}
                            {grp.skills.join(", ")}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-800">
                      {(skills.flatList || []).join(" • ")}
                    </p>
                  )}
                </section>
              );
            }
          }

          // 5. PROJECTS
          if (key === "projects" && projects?.length > 0) {
            return (
              <section key={key} className={sectionSpacingClass}>
                <h2
                  className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-2 ${headingBorderClass}`}
                  style={{
                    color: template === "modern" ? accentColor : "#1f2937",
                    borderColor: template === "modern" ? accentColor : undefined,
                  }}
                >
                  {def.atsHeading}
                </h2>
                <div className="space-y-2.5">
                  {projects.map((proj) => (
                    <div key={proj.id} className="text-xs sm:text-sm">
                      <div className="flex flex-wrap justify-between items-baseline font-bold text-gray-900">
                        <span>{proj.name}</span>
                        {proj.url && (
                          <span className="text-xs font-normal text-indigo-700 underline">
                            {proj.url}
                          </span>
                        )}
                      </div>
                      {proj.role && (
                        <p className="text-xs italic text-gray-600 mb-1">{proj.role}</p>
                      )}
                      {proj.bullets.filter(Boolean).length > 0 && (
                        <ul className="list-disc list-outside ml-4 space-y-0.5 text-gray-800 text-xs">
                          {proj.bullets.filter(Boolean).map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // 6. CERTIFICATIONS
          if (key === "certifications" && certifications?.length > 0) {
            return (
              <section key={key} className={sectionSpacingClass}>
                <h2
                  className={`text-sm sm:text-base font-bold uppercase tracking-wider mb-2 ${headingBorderClass}`}
                  style={{
                    color: template === "modern" ? accentColor : "#1f2937",
                    borderColor: template === "modern" ? accentColor : undefined,
                  }}
                >
                  {def.atsHeading}
                </h2>
                <div className="space-y-1 text-xs sm:text-sm">
                  {certifications.map((c) => (
                    <p key={c.id} className="text-gray-800">
                      <strong>{c.name}</strong> – {c.issuer}{" "}
                      {c.issueDate && <span className="text-gray-500">({c.issueDate})</span>}
                    </p>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>
    );
  }
);

ResumePreview.displayName = "ResumePreview";
