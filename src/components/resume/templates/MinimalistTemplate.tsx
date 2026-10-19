import React from "react";
import { ResumeData, SectionKey } from "@/types/resume";
import { SECTION_REGISTRY } from "@/lib/resume/registry";
import { getCleanContactItems, isCleanString, formatGrade } from "./templateUtils";

interface TemplateProps {
  resume: ResumeData;
  accentColor: string;
}

export function MinimalistTemplate({ resume, accentColor }: TemplateProps) {
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
    <div className="font-sans text-gray-800 leading-normal text-xs sm:text-sm">
      {/* Swiss Clean Header */}
      <header className="mb-5 pb-2">
        <h1 className="text-3xl font-light tracking-tight text-gray-950 mb-1">
          {contact.fullName || "Your Full Name"}
        </h1>
        {isCleanString(contact.headline) && (
          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-widest mb-2">
            {contact.headline}
          </p>
        )}
        {contactItems.length > 0 && (
          <div className="flex flex-wrap gap-x-4 text-xs text-gray-500">
            {contactItems.map((item) => (
              <span key={item.id}>
                {item.url ? (
                  <a href={item.url} className="hover:underline text-gray-700">
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

      {/* Sections with minimal subtle typography */}
      {sectionOrder.map((key) => {
        if (visibility[key] === false) return null;
        const def = SECTION_REGISTRY[key];
        if (!def) return null;

        // 1. SUMMARY
        if (key === "summary" && isCleanString(summary)) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                {def.atsHeading}
              </h2>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">{summary}</p>
            </section>
          );
        }

        // 2. EXPERIENCE
        if (key === "experience" && experience && experience.length > 0) {
          return (
            <section key={key} className="mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-gray-900">{exp.title}</span>
                      <span className="text-xs text-gray-400">
                        {exp.startMonth} {exp.startYear} — {exp.isCurrent ? "Present" : `${exp.endMonth || ""} ${exp.endYear || ""}`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {exp.employer}{isCleanString(exp.location) ? ` · ${exp.location}` : ""}
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-600">
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
            <section key={key} className="mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-medium text-gray-900">
                      <span>{edu.institution}</span>
                      <span className="text-xs text-gray-400">
                        {edu.startYear} — {edu.isExpected ? "Expected " : ""}{edu.endYear || ""}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {edu.degree}{isCleanString(edu.field) ? `, ${edu.field}` : ""}
                      {isCleanString(edu.grade) ? ` (${formatGrade(edu.grade)})` : ""}
                    </div>
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
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                {def.atsHeading}
              </h2>
              {hasGroups ? (
                <div className="space-y-1 text-xs">
                  {skills.groups.map((grp) => (
                    <div key={grp.id} className="flex">
                      <span className="font-medium text-gray-500 w-32 shrink-0">{grp.name}</span>
                      <span className="text-gray-800">{grp.skills.join(", ")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-800">{skills.flatList.join(" · ")}</p>
              )}
            </section>
          );
        }

        // 5. PROJECTS
        if (key === "projects" && projects && projects.length > 0) {
          return (
            <section key={key} className="mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-2">
                {projects.map((proj) => (
                  <div key={proj.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-medium text-gray-900">
                      <span>{proj.name}</span>
                      {proj.startYear && <span className="text-xs text-gray-400">{proj.startYear}</span>}
                    </div>
                    {isCleanString(proj.role) && <p className="text-xs text-gray-500">{proj.role}</p>}
                    {proj.bullets && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-600 mt-0.5">
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

        // 6. CERTIFICATIONS & LANGUAGES
        if (key === "certifications" && certifications && certifications.length > 0) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                {def.atsHeading}
              </h2>
              <div className="space-y-0.5 text-xs">
                {certifications.map((c) => (
                  <div key={c.id} className="flex justify-between">
                    <span>{c.name} <span className="text-gray-400">({c.issuer})</span></span>
                    {c.issueDate && <span className="text-gray-400">{c.issueDate}</span>}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (key === "languages" && languages && languages.length > 0) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                {def.atsHeading}
              </h2>
              <div className="flex flex-wrap gap-4 text-xs text-gray-700">
                {languages.map((l) => (
                  <span key={l.id}>{l.language} <span className="text-gray-400">({l.proficiency})</span></span>
                ))}
              </div>
            </section>
          );
        }

        if (key === "references" && referencesText?.trim()) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                {def.atsHeading}
              </h2>
              <p className="text-xs text-gray-500 italic">{referencesText}</p>
            </section>
          );
        }

        if (key === "custom" && customSections && customSections.length > 0) {
          return (
            <section key={key} className="mb-4">
              {customSections.map((sec) => (
                <div key={sec.id} className="mb-2 page-break-avoid">
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                    {sec.title || def.atsHeading}
                  </h2>
                  {sec.type === "bullets" && Array.isArray(sec.content) ? (
                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-600">
                      {sec.content.filter(Boolean).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-700">{typeof sec.content === "string" ? sec.content : ""}</p>
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
