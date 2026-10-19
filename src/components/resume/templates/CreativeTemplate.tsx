import React from "react";
import { ResumeData, SectionKey } from "@/types/resume";
import { SECTION_REGISTRY } from "@/lib/resume/registry";
import { getCleanContactItems, isCleanString, formatGrade } from "./templateUtils";

interface TemplateProps {
  resume: ResumeData;
  accentColor: string;
}

export function CreativeTemplate({ resume, accentColor }: TemplateProps) {
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
    <div className="font-sans text-gray-900 leading-normal text-xs sm:text-sm">
      {/* High-Impact Top Banner Header */}
      <header
        className="rounded-lg p-4 sm:p-5 text-white mb-4 shadow-sm"
        style={{ backgroundColor: accentColor }}
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
          {contact.fullName || "Your Full Name"}
        </h1>
        {isCleanString(contact.headline) && (
          <p className="text-xs sm:text-sm font-medium text-white/90 tracking-wide uppercase mb-3">
            {contact.headline}
          </p>
        )}
        {contactItems.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/80">
            {contactItems.map((item) => (
              <span key={item.id} className="flex items-center gap-1">
                {item.url ? (
                  <a href={item.url} className="text-white hover:underline font-medium">
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

      {/* Sections dynamically ordered with accent left-bar highlights */}
      {sectionOrder.map((key) => {
        if (visibility[key] === false) return null;
        const def = SECTION_REGISTRY[key];
        if (!def) return null;

        // 1. SUMMARY
        if (key === "summary" && isCleanString(summary)) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  {def.atsHeading}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pl-4 border-l-2 border-gray-200">
                {summary}
              </p>
            </section>
          );
        }

        // 2. EXPERIENCE
        if (key === "experience" && experience && experience.length > 0) {
          return (
            <section key={key} className="mb-4">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  {def.atsHeading}
                </h2>
              </div>
              <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                {experience.map((exp) => (
                  <div key={exp.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-bold text-gray-900">
                      <span>{exp.title}</span>
                      <span className="text-xs font-medium text-gray-500">
                        {exp.startMonth} {exp.startYear} — {exp.isCurrent ? "Present" : `${exp.endMonth || ""} ${exp.endYear || ""}`}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-600 mb-1" style={{ color: accentColor }}>
                      {exp.employer}{isCleanString(exp.location) ? ` • ${exp.location}` : ""}
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-700">
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
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  {def.atsHeading}
                </h2>
              </div>
              <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                {education.map((edu) => (
                  <div key={edu.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-bold text-gray-900">
                      <span>{edu.institution}</span>
                      <span className="text-xs font-medium text-gray-500">
                        {edu.startYear} — {edu.isExpected ? "Expected " : ""}{edu.endYear || ""}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
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
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  {def.atsHeading}
                </h2>
              </div>
              <div className="pl-4 border-l-2 border-gray-200">
                {hasGroups ? (
                  <div className="space-y-1 text-xs">
                    {skills.groups.map((grp) => (
                      <div key={grp.id} className="flex flex-wrap items-baseline gap-1.5">
                        <span className="font-bold text-gray-900 min-w-28">{grp.name}:</span>
                        <span className="text-gray-700">{grp.skills.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-800">{skills.flatList.join(" • ")}</p>
                )}
              </div>
            </section>
          );
        }

        // 5. PROJECTS
        if (key === "projects" && projects && projects.length > 0) {
          return (
            <section key={key} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  {def.atsHeading}
                </h2>
              </div>
              <div className="space-y-2.5 pl-4 border-l-2 border-gray-200">
                {projects.map((proj) => (
                  <div key={proj.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-bold text-gray-900">
                      <span>{proj.name}</span>
                      {proj.startYear && <span className="text-xs font-normal text-gray-500">{proj.startYear}</span>}
                    </div>
                    {isCleanString(proj.role) && <p className="text-xs text-gray-600">{proj.role}</p>}
                    {proj.bullets && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-700 mt-1">
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
            <section key={key} className="mb-4 page-break-avoid">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  {def.atsHeading}
                </h2>
              </div>
              <div className="space-y-1 pl-4 border-l-2 border-gray-200 text-xs">
                {certifications.map((c) => (
                  <div key={c.id} className="flex justify-between">
                    <span><strong>{c.name}</strong> — {c.issuer}</span>
                    {c.issueDate && <span className="text-gray-500">{c.issueDate}</span>}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (key === "languages" && languages && languages.length > 0) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  {def.atsHeading}
                </h2>
              </div>
              <div className="flex flex-wrap gap-4 pl-4 border-l-2 border-gray-200 text-xs text-gray-700">
                {languages.map((l) => (
                  <span key={l.id}><strong>{l.language}:</strong> <span className="capitalize">{l.proficiency}</span></span>
                ))}
              </div>
            </section>
          );
        }

        if (key === "references" && referencesText?.trim()) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  {def.atsHeading}
                </h2>
              </div>
              <p className="text-xs text-gray-600 italic pl-4 border-l-2 border-gray-200">{referencesText}</p>
            </section>
          );
        }

        if (key === "custom" && customSections && customSections.length > 0) {
          return (
            <section key={key} className="mb-4">
              {customSections.map((sec) => (
                <div key={sec.id} className="mb-2 page-break-avoid">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      {sec.title || def.atsHeading}
                    </h2>
                  </div>
                  <div className="pl-4 border-l-2 border-gray-200">
                    {sec.type === "bullets" && Array.isArray(sec.content) ? (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-700">
                        {sec.content.filter(Boolean).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-700">{typeof sec.content === "string" ? sec.content : ""}</p>
                    )}
                  </div>
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
