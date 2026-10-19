import React from "react";
import { ResumeData, SectionKey } from "@/types/resume";
import { SECTION_REGISTRY } from "@/lib/resume/registry";
import { getCleanContactItems, isCleanString, formatGrade } from "./templateUtils";

interface TemplateProps {
  resume: ResumeData;
  accentColor: string;
}

export function CompactTemplate({ resume, accentColor }: TemplateProps) {
  const {
    contact,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages,
    awards,
    referencesText,
    customSections,
    meta,
  } = resume;

  const contactItems = getCleanContactItems(contact);
  const sectionOrder: SectionKey[] = meta.sectionOrder || [];
  const visibility = meta.sectionVisibility || {};

  return (
    <div className="font-sans text-gray-900 leading-tight text-xs">
      {/* High-Density Header */}
      <header className="border-b border-gray-400 pb-1.5 mb-2.5 text-center">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 mb-0.5">
          {contact.fullName || "Your Full Name"}
        </h1>
        {isCleanString(contact.headline) && (
          <p className="text-xs font-semibold text-gray-700 mb-1">
            {contact.headline}
          </p>
        )}
        {contactItems.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-x-2 text-[11px] text-gray-600">
            {contactItems.map((item, idx) => (
              <span key={item.id} className="flex items-center">
                {idx > 0 && <span className="text-gray-400 mr-2">•</span>}
                {item.url ? (
                  <a href={item.url} className="hover:underline text-gray-800">
                    {item.text}
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Sections dynamically ordered with ultra-tight spacing */}
      {sectionOrder.map((key) => {
        if (visibility[key] === false) return null;
        const def = SECTION_REGISTRY[key];
        if (!def) return null;

        // 1. SUMMARY
        if (key === "summary" && isCleanString(summary)) {
          return (
            <section key={key} className="mb-2 page-break-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-1" style={{ color: accentColor }}>
                {def.atsHeading}
              </h2>
              <p className="text-gray-700 leading-snug">{summary}</p>
            </section>
          );
        }

        // 2. EXPERIENCE
        if (key === "experience" && experience && experience.length > 0) {
          return (
            <section key={key} className="mb-2">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-1.5" style={{ color: accentColor }}>
                {def.atsHeading}
              </h2>
              <div className="space-y-1.5">
                {experience.map((exp) => (
                  <div key={exp.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-bold text-gray-900">
                      <span>{exp.title} <span className="font-normal text-gray-600">| {exp.employer}{isCleanString(exp.location) ? `, ${exp.location}` : ""}</span></span>
                      <span className="text-[11px] font-normal text-gray-500">
                        {exp.startMonth} {exp.startYear} — {exp.isCurrent ? "Present" : `${exp.endMonth || ""} ${exp.endYear || ""}`}
                      </span>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-gray-800 mt-0.5">
                        {exp.bullets.filter(Boolean).map((b, i) => (
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

        // 3. EDUCATION
        if (key === "education" && education && education.length > 0) {
          return (
            <section key={key} className="mb-2">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-1" style={{ color: accentColor }}>
                {def.atsHeading}
              </h2>
              <div className="space-y-1">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline page-break-avoid">
                    <div>
                      <strong className="text-gray-900">{edu.institution}</strong> — {edu.degree}{isCleanString(edu.field) ? `, ${edu.field}` : ""}
                      {isCleanString(edu.grade) ? ` (${formatGrade(edu.grade)})` : ""}
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {edu.startYear} — {edu.isExpected ? "Expected " : ""}{edu.endYear || ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 4. SKILLS
        if (key === "skills" && skills) {
          const hasGroups = skills.isGrouped && skills.groups && skills.groups.length > 0;
          const hasFlat = !skills.isGrouped && skills.flatList && skills.flatList.length > 0;
          if (!hasGroups && !hasFlat) return null;

          return (
            <section key={key} className="mb-2 page-break-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-1" style={{ color: accentColor }}>
                {def.atsHeading}
              </h2>
              {hasGroups ? (
                <div className="space-y-0.5 text-gray-800">
                  {skills.groups.map((grp) => (
                    <div key={grp.id} className="flex">
                      <span className="font-bold w-32 shrink-0">{grp.name}:</span>
                      <span>{grp.skills.join(", ")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-800">{skills.flatList.join(" • ")}</p>
              )}
            </section>
          );
        }

        // 5. PROJECTS
        if (key === "projects" && projects && projects.length > 0) {
          return (
            <section key={key} className="mb-2">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-1" style={{ color: accentColor }}>
                {def.atsHeading}
              </h2>
              <div className="space-y-1">
                {projects.map((proj) => (
                  <div key={proj.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-bold">
                      <span>{proj.name} {isCleanString(proj.role) && <span className="font-normal text-gray-600">({proj.role})</span>}</span>
                      {proj.startYear && <span className="text-[11px] font-normal text-gray-500">{proj.startYear}</span>}
                    </div>
                    {proj.bullets && (
                      <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-gray-800">
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

        // 6. CERTIFICATIONS, LANGUAGES & AWARDS
        if (key === "certifications" && certifications && certifications.length > 0) {
          return (
            <section key={key} className="mb-2 page-break-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-1" style={{ color: accentColor }}>
                {def.atsHeading}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-gray-800">
                {certifications.map((c) => (
                  <span key={c.id}><strong>{c.name}</strong> ({c.issuer})</span>
                ))}
              </div>
            </section>
          );
        }

        if (key === "languages" && languages && languages.length > 0) {
          return (
            <section key={key} className="mb-2 page-break-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-1" style={{ color: accentColor }}>
                {def.atsHeading}
              </h2>
              <div className="flex flex-wrap gap-x-3 text-gray-800">
                {languages.map((l) => (
                  <span key={l.id}><strong>{l.language}:</strong> {l.proficiency}</span>
                ))}
              </div>
            </section>
          );
        }

        if (key === "references" && referencesText?.trim()) {
          return (
            <section key={key} className="mb-2 page-break-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-0.5" style={{ color: accentColor }}>
                {def.atsHeading}
              </h2>
              <p className="text-gray-600 italic">{referencesText}</p>
            </section>
          );
        }

        if (key === "custom" && customSections && customSections.length > 0) {
          return (
            <section key={key} className="mb-2">
              {customSections.map((sec) => (
                <div key={sec.id} className="mb-1 page-break-avoid">
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-0.5" style={{ color: accentColor }}>
                    {sec.title || def.atsHeading}
                  </h2>
                  {sec.type === "bullets" && Array.isArray(sec.content) ? (
                    <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-gray-800">
                      {sec.content.filter(Boolean).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-700">{typeof sec.content === "string" ? sec.content : ""}</p>
                  )}
                </div>
              ))}
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
