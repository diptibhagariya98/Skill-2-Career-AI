import React from "react";
import { ResumeData, SectionKey } from "@/types/resume";
import { SECTION_REGISTRY } from "@/lib/resume/registry";
import { getCleanContactItems, isCleanString, formatGrade } from "./templateUtils";

interface TemplateProps {
  resume: ResumeData;
  accentColor: string;
}

export function ClassicTemplate({ resume, accentColor }: TemplateProps) {
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
    interests,
    referencesText,
    customSections,
    meta,
  } = resume;

  const contactItems = getCleanContactItems(contact);
  const sectionOrder: SectionKey[] = meta.sectionOrder || [];
  const visibility = meta.sectionVisibility || {};

  return (
    <div className="font-serif text-gray-900 leading-relaxed text-sm">
      {/* Centered Executive Header */}
      <header className="text-center border-b-2 pb-4 mb-4" style={{ borderColor: accentColor }}>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
          {contact.fullName || "Your Full Name"}
        </h1>
        {isCleanString(contact.headline) && (
          <p className="text-sm font-medium text-gray-700 italic mb-2">
            {contact.headline}
          </p>
        )}
        {contactItems.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-y-1 gap-x-3 text-xs text-gray-600">
            {contactItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <span className="text-gray-400">|</span>}
                {item.url ? (
                  <a href={item.url} className="hover:underline text-gray-800">
                    {item.text}
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
              </React.Fragment>
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
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <p className="text-xs text-gray-700 leading-normal text-justify">
                {summary}
              </p>
            </section>
          );
        }

        // 2. EXPERIENCE
        if (key === "experience" && experience && experience.length > 0) {
          return (
            <section key={key} className="mb-4">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline text-sm font-bold text-gray-900">
                      <span>{exp.title}</span>
                      <span className="text-xs font-normal text-gray-600">
                        {exp.startMonth} {exp.startYear} — {exp.isCurrent ? "Present" : `${exp.endMonth || ""} ${exp.endYear || ""}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-xs text-gray-700 italic mb-1">
                      <span>{exp.employer}{isCleanString(exp.location) ? `, ${exp.location}` : ""}</span>
                      {exp.employmentType && <span className="capitalize text-gray-500">{exp.employmentType}</span>}
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-800">
                        {exp.bullets.filter(Boolean).map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
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
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline text-sm font-bold text-gray-900">
                      <span>{edu.institution}</span>
                      <span className="text-xs font-normal text-gray-600">
                        {edu.startMonth} {edu.startYear} — {edu.isExpected ? "Expected " : ""}{edu.endMonth || ""} {edu.endYear || ""}
                      </span>
                    </div>
                    <div className="text-xs text-gray-700 italic">
                      {edu.degree}{isCleanString(edu.field) ? ` in ${edu.field}` : ""}
                      {isCleanString(edu.grade) ? ` — ${formatGrade(edu.grade)}` : ""}
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
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              {hasGroups ? (
                <div className="space-y-1 text-xs text-gray-800">
                  {skills.groups.map((grp) => (
                    <div key={grp.id} className="flex">
                      <span className="font-bold w-36 shrink-0">{grp.name}:</span>
                      <span>{grp.skills.join(", ")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-800">{skills.flatList.join(" • ")}</p>
              )}
            </section>
          );
        }

        // 5. PROJECTS
        if (key === "projects" && projects && projects.length > 0) {
          return (
            <section key={key} className="mb-4">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-2">
                {projects.map((proj) => (
                  <div key={proj.id} className="page-break-avoid">
                    <div className="flex justify-between items-baseline text-sm font-bold text-gray-900">
                      <span>{proj.name}</span>
                      {proj.startYear && (
                        <span className="text-xs font-normal text-gray-600">
                          {proj.startMonth ? `${proj.startMonth} ` : ""}{proj.startYear}
                        </span>
                      )}
                    </div>
                    {isCleanString(proj.role) && <p className="text-xs text-gray-600 italic">{proj.role}</p>}
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

        // 6. CERTIFICATIONS
        if (key === "certifications" && certifications && certifications.length > 0) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-1 text-xs text-gray-800">
                {certifications.map((cert) => (
                  <div key={cert.id} className="flex justify-between">
                    <span>
                      <strong className="text-gray-900">{cert.name}</strong> — {cert.issuer}
                    </span>
                    {cert.issueDate && <span className="text-gray-600">{cert.issueDate}</span>}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 7. LANGUAGES
        if (key === "languages" && languages && languages.length > 0) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-800">
                {languages.map((lang) => (
                  <span key={lang.id}>
                    <strong>{lang.language}:</strong> <span className="capitalize text-gray-600">{lang.proficiency}</span>
                  </span>
                ))}
              </div>
            </section>
          );
        }

        // 8. AWARDS
        if (key === "awards" && awards && awards.length > 0) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-2">
                {def.atsHeading}
              </h2>
              <div className="space-y-1 text-xs text-gray-800">
                {awards.map((award) => (
                  <div key={award.id} className="flex justify-between">
                    <span>
                      <strong>{award.title}</strong> — {award.issuer}
                    </span>
                    {award.date && <span className="text-gray-600">{award.date}</span>}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 9. REFERENCES & CUSTOM
        if (key === "references" && referencesText?.trim()) {
          return (
            <section key={key} className="mb-4 page-break-avoid">
              <h2 className="text-xs uppercase font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-1">
                {def.atsHeading}
              </h2>
              <p className="text-xs text-gray-700 italic">{referencesText}</p>
            </section>
          );
        }

        if (key === "custom" && customSections && customSections.length > 0) {
          return (
            <section key={key} className="mb-4">
              {customSections.map((sec) => (
                <div key={sec.id} className="mb-3 page-break-avoid">
                  <h2 className="text-xs uppercase font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-1">
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
