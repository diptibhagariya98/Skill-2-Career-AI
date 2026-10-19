import React from "react";
import { ResumeData, SectionKey } from "@/types/resume";
import { SECTION_REGISTRY } from "@/lib/resume/registry";
import { getCleanContactItems, isCleanString, formatGrade } from "./templateUtils";

interface TemplateProps {
  resume: ResumeData;
  accentColor: string;
}

export function ModernTemplate({ resume, accentColor }: TemplateProps) {
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
    volunteer,
    referencesText,
    customSections,
    meta,
  } = resume;

  const contactItems = getCleanContactItems(contact);
  const sectionOrder: SectionKey[] = meta.sectionOrder || [];
  const visibility = meta.sectionVisibility || {};

  return (
    <div className="font-sans text-gray-900 leading-normal text-xs">
      {/* Modern Header: Left-aligned with accent indicator */}
      <header className="border-b-2 pb-3 mb-4" style={{ borderColor: accentColor }}>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-0.5">
          {contact.fullName || "Your Full Name"}
        </h1>
        {isCleanString(contact.headline) && (
          <p className="text-sm font-semibold tracking-wide uppercase mb-2" style={{ color: accentColor }}>
            {contact.headline}
          </p>
        )}
        {contactItems.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            {contactItems.map((item, idx) => (
              <span key={item.id} className="flex items-center gap-1">
                {idx > 0 && <span className="text-gray-300 mr-1">•</span>}
                {item.url ? (
                  <a href={item.url} className="hover:underline text-gray-700 font-medium">
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

      {/* Sections dynamically ordered */}
      {sectionOrder.map((key) => {
        if (visibility[key] === false) return null;
        const def = SECTION_REGISTRY[key];
        if (!def) return null;

        // 1. SUMMARY
        if (key === "summary" && isCleanString(summary)) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-1.5 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {def.atsHeading}
              </h2>
              <p className="text-xs text-gray-700 leading-relaxed">{summary}</p>
            </section>
          );
        }

        // 2. EXPERIENCE
        if (key === "experience" && experience && experience.length > 0) {
          return (
            <section key={key} className="mb-4">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {def.atsHeading}
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-bold text-gray-900 text-sm">
                      <span className="text-gray-900">{exp.title}</span>
                      <span className="text-xs font-medium text-gray-500">
                        {exp.startMonth} {exp.startYear} — {exp.isCurrent ? "Present" : `${exp.endMonth || ""} ${exp.endYear || ""}`}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                      {exp.employer}{isCleanString(exp.location) ? ` | ${exp.location}` : ""}
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-gray-700">
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
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {def.atsHeading}
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline text-sm font-bold text-gray-900">
                      <span>{edu.institution}</span>
                      <span className="text-xs font-medium text-gray-500">
                        {edu.startMonth} {edu.startYear} — {edu.isExpected ? "Expected " : ""}{edu.endMonth || ""} {edu.endYear || ""}
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
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {def.atsHeading}
              </h2>
              {hasGroups ? (
                <div className="space-y-1.5 text-xs">
                  {skills.groups.map((grp) => (
                    <div key={grp.id} className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-bold text-gray-900 min-w-28">{grp.name}:</span>
                      <span className="text-gray-700">{grp.skills.join(", ")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 text-xs text-gray-700">
                  {skills.flatList.map((skill, i) => (
                    <span key={i} className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </section>
          );
        }

        // 5. PROJECTS
        if (key === "projects" && projects && projects.length > 0) {
          return (
            <section key={key} className="mb-4">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {def.atsHeading}
              </h2>
              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-bold text-sm text-gray-900">
                      <span>{proj.name}</span>
                      {proj.startYear && (
                        <span className="text-xs font-normal text-gray-500">
                          {proj.startMonth ? `${proj.startMonth} ` : ""}{proj.startYear}
                        </span>
                      )}
                    </div>
                    {isCleanString(proj.role) && <p className="text-xs text-gray-600 font-medium">{proj.role}</p>}
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

        // 6. CERTIFICATIONS
        if (key === "certifications" && certifications && certifications.length > 0) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {def.atsHeading}
              </h2>
              <div className="space-y-1 text-xs">
                {certifications.map((cert) => (
                  <div key={cert.id} className="flex justify-between">
                    <span className="font-medium text-gray-800">{cert.name} <span className="text-gray-500">({cert.issuer})</span></span>
                    {cert.issueDate && <span className="text-gray-500">{cert.issueDate}</span>}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 7. LANGUAGES & AWARDS
        if (key === "languages" && languages && languages.length > 0) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {def.atsHeading}
              </h2>
              <div className="flex flex-wrap gap-3 text-xs text-gray-700">
                {languages.map((l) => (
                  <span key={l.id}><strong>{l.language}:</strong> <span className="capitalize">{l.proficiency}</span></span>
                ))}
              </div>
            </section>
          );
        }

        if (key === "awards" && awards && awards.length > 0) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {def.atsHeading}
              </h2>
              <div className="space-y-1 text-xs">
                {awards.map((a) => (
                  <div key={a.id} className="flex justify-between">
                    <span><strong>{a.title}</strong> — {a.issuer}</span>
                    {a.date && <span className="text-gray-500">{a.date}</span>}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 8. REFERENCES & CUSTOM
        if (key === "references" && referencesText?.trim()) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-1 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {def.atsHeading}
              </h2>
              <p className="text-xs text-gray-600 italic">{referencesText}</p>
            </section>
          );
        }

        if (key === "custom" && customSections && customSections.length > 0) {
          return (
            <section key={key} className="mb-4">
              {customSections.map((sec) => (
                <div key={sec.id} className="mb-2 page-break-avoid">
                  <h2
                    className="text-xs font-bold uppercase tracking-wider pb-1 mb-1 border-b-2"
                    style={{ color: accentColor, borderColor: accentColor }}
                  >
                    {sec.title || def.atsHeading}
                  </h2>
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
              ))}
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
