import React from "react";
import { ResumeData, SectionKey } from "@/types/resume";
import { SECTION_REGISTRY } from "@/lib/resume/registry";
import { getCleanContactItems, isCleanString, formatGrade } from "./templateUtils";

interface TemplateProps {
  resume: ResumeData;
  accentColor: string;
}

export function AcademicTemplate({ resume, accentColor }: TemplateProps) {
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
    publications,
    volunteer,
    referencesText,
    customSections,
    meta,
  } = resume;

  const contactItems = getCleanContactItems(contact);
  const sectionOrder: SectionKey[] = meta.sectionOrder || [];
  const visibility = meta.sectionVisibility || {};

  return (
    <div className="font-serif text-gray-900 leading-normal text-xs sm:text-sm">
      {/* Formal Academic CV Header */}
      <header className="border-b-2 border-gray-900 pb-3 mb-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-normal tracking-wide text-gray-900 mb-1 uppercase">
          {contact.fullName || "Your Full Name"}
        </h1>
        {isCleanString(contact.headline) && (
          <p className="text-sm font-medium text-gray-700 italic mb-2">
            {contact.headline}
          </p>
        )}
        {contactItems.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-3 text-xs text-gray-600">
            {contactItems.map((item, idx) => (
              <span key={item.id}>
                {idx > 0 && <span className="text-gray-400 mr-3">⋄</span>}
                {item.url ? (
                  <a href={item.url} className="hover:underline text-gray-900">
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

      {/* Sections dynamically ordered with academic formatting */}
      {sectionOrder.map((key) => {
        if (visibility[key] === false) return null;
        const def = SECTION_REGISTRY[key];
        if (!def) return null;

        // 1. SUMMARY / RESEARCH STATEMENT
        if (key === "summary" && isCleanString(summary)) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <p className="text-xs sm:text-sm text-gray-800 leading-relaxed text-justify">{summary}</p>
            </section>
          );
        }

        // 2. EDUCATION (Higher academic emphasis)
        if (key === "education" && education && education.length > 0) {
          return (
            <section key={key} className="mb-4">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-2.5">
                {education.map((edu) => (
                  <div key={edu.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-bold text-gray-900">
                      <span>{edu.degree}{isCleanString(edu.field) ? `, ${edu.field}` : ""}</span>
                      <span className="text-xs font-normal text-gray-600">
                        {edu.startYear} — {edu.isExpected ? "Expected " : ""}{edu.endYear || ""}
                      </span>
                    </div>
                    <div className="text-xs text-gray-700 italic">
                      {edu.institution}{isCleanString(edu.location) ? `, ${edu.location}` : ""}
                      {isCleanString(edu.grade) ? ` — ${formatGrade(edu.grade)}` : ""}
                    </div>
                    {edu.highlights && edu.highlights.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-700 mt-1">
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

        // 3. EXPERIENCE / ACADEMIC APPOINTMENTS
        if (key === "experience" && experience && experience.length > 0) {
          return (
            <section key={key} className="mb-4">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-bold text-gray-900">
                      <span>{exp.title}</span>
                      <span className="text-xs font-normal text-gray-600">
                        {exp.startMonth} {exp.startYear} — {exp.isCurrent ? "Present" : `${exp.endMonth || ""} ${exp.endYear || ""}`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-700 italic mb-1">
                      {exp.employer}{isCleanString(exp.location) ? `, ${exp.location}` : ""}
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-gray-800">
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

        // 4. PUBLICATIONS
        if (key === "publications" && publications && publications.length > 0) {
          return (
            <section key={key} className="mb-4">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-2 text-xs">
                {publications.map((pub, idx) => (
                  <div key={pub.id} className="page-break-avoid">
                    <p className="text-gray-900">
                      [{idx + 1}] <strong>&ldquo;{pub.title}&rdquo;</strong>, <em>{pub.venue}</em>{pub.date ? `, ${pub.date}` : ""}.
                      {pub.url && (
                        <a href={pub.url} className="ml-1 text-blue-700 hover:underline">
                          [Link]
                        </a>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 5. AWARDS & HONORS
        if (key === "awards" && awards && awards.length > 0) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-1 text-xs">
                {awards.map((a) => (
                  <div key={a.id} className="flex justify-between">
                    <span><strong>{a.title}</strong>, {a.issuer}</span>
                    {a.date && <span className="text-gray-600">{a.date}</span>}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 6. SKILLS & RESEARCH METHODOLOGIES
        if (key === "skills" && skills) {
          const hasGroups = skills.isGrouped && skills.groups && skills.groups.length > 0;
          const hasFlat = !skills.isGrouped && skills.flatList && skills.flatList.length > 0;
          if (!hasGroups && !hasFlat) return null;

          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              {hasGroups ? (
                <div className="space-y-1 text-xs">
                  {skills.groups.map((grp) => (
                    <div key={grp.id} className="flex">
                      <span className="font-bold w-36 shrink-0">{grp.name}:</span>
                      <span>{grp.skills.join(", ")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-800">{skills.flatList.join("; ")}</p>
              )}
            </section>
          );
        }

        // 7. PROJECTS & GRANTS
        if (key === "projects" && projects && projects.length > 0) {
          return (
            <section key={key} className="mb-4">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-2">
                {projects.map((proj) => (
                  <div key={proj.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline font-bold text-xs sm:text-sm">
                      <span>{proj.name}</span>
                      {proj.startYear && <span className="text-xs font-normal text-gray-600">{proj.startYear}</span>}
                    </div>
                    {proj.bullets && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-800 mt-1">
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

        // 8. REFERENCES
        if (key === "references" && referencesText?.trim()) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-1 mb-1">
                {def.atsHeading}
              </h2>
              <p className="text-xs text-gray-700 italic">{referencesText}</p>
            </section>
          );
        }

        // 9. CUSTOM SECTIONS
        if (key === "custom" && customSections && customSections.length > 0) {
          return (
            <section key={key} className="mb-4">
              {customSections.map((sec) => (
                <div key={sec.id} className="mb-2 page-break-avoid">
                  <h2 className="text-xs uppercase font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-1 mb-1">
                    {sec.title || def.atsHeading}
                  </h2>
                  {sec.type === "bullets" && Array.isArray(sec.content) ? (
                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-800">
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
