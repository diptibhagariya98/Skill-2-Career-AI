import {
  ResumeData,
  RESUME_SCHEMA_VERSION,
} from "@/types/resume";
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY } from "./registry";

export function createEmptyResume(): ResumeData {
  const now = new Date().toISOString();
  return {
    meta: {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `resume_${Date.now()}`,
      schemaVersion: RESUME_SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
      title: "Untitled Resume",
      selectedTemplate: "classic",
      pageSize: "A4",
      fontScale: "medium",
      accentColor: "#1e3a8a", // Accessible Navy
      dateFormat: "MMM YYYY",
      language: "en",
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      sectionVisibility: { ...DEFAULT_SECTION_VISIBILITY },
    },
    contact: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      country: "",
      website: "",
      linkedin: "",
      links: [],
      workAuthorization: "",
      photoUrl: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: {
      isGrouped: true,
      groups: [
        { id: "grp_tech", name: "Technical Skills", skills: [] },
        { id: "grp_tools", name: "Tools & Frameworks", skills: [] },
      ],
      flatList: [],
    },
    projects: [],
    certifications: [],
    languages: [],
    awards: [],
    publications: [],
    volunteer: [],
    interests: [],
    referencesText: "Available upon request.",
    customSections: [],
  };
}

export function createSampleResume(): ResumeData {
  const now = new Date().toISOString();
  return {
    meta: {
      id: "sample_resume_001",
      schemaVersion: RESUME_SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
      title: "Alex Morgan - Senior Full Stack Engineer",
      selectedTemplate: "modern",
      pageSize: "A4",
      fontScale: "medium",
      accentColor: "#0f766e", // Accessible Teal
      dateFormat: "MMM YYYY",
      language: "en",
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      sectionVisibility: {
        ...DEFAULT_SECTION_VISIBILITY,
        languages: true,
        awards: true,
      },
    },
    contact: {
      fullName: "Alex Morgan",
      headline: "Senior Full Stack Software Engineer",
      email: "alex.morgan@example.com",
      phone: "+91 98765 43210",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      website: "https://alexmorgan.dev",
      linkedin: "https://linkedin.com/in/alex-morgan-sample",
      links: [
        { id: "link_gh", label: "GitHub", url: "https://github.com/alexmorgan-dev" },
      ],
      workAuthorization: "Authorized to work in India",
      photoUrl: "",
    },
    summary:
      "Results-driven Full Stack Engineer with 5+ years of experience designing scalable microservices and high-performance web applications. Specialized in TypeScript, React, Next.js, and Node.js with a proven track record of boosting system throughput by 40% and mentoring cross-functional teams.",
    experience: [
      {
        id: "exp_1",
        title: "Senior Full Stack Engineer",
        employer: "CloudScale Technologies",
        location: "Bengaluru, India",
        employmentType: "full-time",
        startMonth: "Mar",
        startYear: "2023",
        isCurrent: true,
        bullets: [
          "Architected real-time event-driven streaming pipeline handling 2M+ daily events with 99.98% uptime.",
          "Migrated legacy monolithic frontend to Next.js 14 App Router, cutting First Contentful Paint by 42%.",
          "Mentored 6 junior engineers through weekly technical design reviews and pair-programming sessions.",
        ],
        technologies: ["TypeScript", "Next.js", "Node.js", "PostgreSQL", "Docker", "AWS"],
      },
      {
        id: "exp_2",
        title: "Software Engineer",
        employer: "Nexus Digital Systems",
        location: "Pune, India",
        employmentType: "full-time",
        startMonth: "Jul",
        startYear: "2021",
        endMonth: "Feb",
        endYear: "2023",
        isCurrent: false,
        bullets: [
          "Developed core RESTful and GraphQL APIs serving 350K+ active mobile and web subscribers.",
          "Reduced database query latency by 35% through Redis caching and query plan indexing optimizations.",
          "Automated end-to-end CI/CD test workflows reducing deployment failure rates from 8% to under 0.5%.",
        ],
        technologies: ["React", "Express.js", "MongoDB", "Redis", "Jest", "GitHub Actions"],
      },
    ],
    education: [
      {
        id: "edu_1",
        institution: "Indian Institute of Technology",
        degree: "Bachelor of Technology",
        field: "Computer Science & Engineering",
        location: "Mumbai, India",
        startMonth: "Aug",
        startYear: "2017",
        endMonth: "May",
        endYear: "2021",
        isExpected: false,
        grade: "8.9 / 10 CGPA",
        highlights: [
          "Dean's Merit List for Academic Excellence (2019, 2020)",
          "Lead Organizer of Annual National Hackathon with 1,200+ collegiate participants",
        ],
      },
    ],
    skills: {
      isGrouped: true,
      groups: [
        {
          id: "grp_languages",
          name: "Languages",
          skills: ["TypeScript", "JavaScript (ES6+)", "Python", "SQL", "HTML5", "CSS3"],
        },
        {
          id: "grp_frameworks",
          name: "Frameworks & Libraries",
          skills: ["React", "Next.js", "Node.js", "TailwindCSS", "Express", "Redux Toolkit"],
        },
        {
          id: "grp_cloud",
          name: "Cloud & DevOps",
          skills: ["Docker", "AWS (S3, EC2, Lambda)", "Git", "PostgreSQL", "Redis", "Firebase"],
        },
      ],
      flatList: [],
    },
    projects: [
      {
        id: "proj_1",
        name: "DevPulse - Automated Code Review Assistant",
        role: "Creator & Lead Developer",
        url: "https://devpulse.sample.io",
        startMonth: "Jan",
        startYear: "2024",
        bullets: [
          "Engineered an automated AI code review bot integrating with GitHub PR webhooks to check linting and security regressions.",
          "Gained 1,500+ GitHub stars and active adoption across 40+ open-source repositories.",
        ],
        technologies: ["TypeScript", "Next.js", "OpenAI API", "TailwindCSS"],
      },
    ],
    certifications: [
      {
        id: "cert_1",
        name: "AWS Certified Solutions Architect – Associate",
        issuer: "Amazon Web Services",
        issueDate: "Nov 2023",
        expiryDate: "Nov 2026",
        credentialId: "AWS-SAA-839210",
        credentialUrl: "https://aws.amazon.com/verification",
      },
    ],
    languages: [
      { id: "lang_1", language: "English", proficiency: "fluent" },
      { id: "lang_2", language: "Hindi", proficiency: "native" },
    ],
    awards: [
      {
        id: "award_1",
        title: "National Smart India Hackathon Winner",
        issuer: "Ministry of Education, Govt. of India",
        date: "2020",
        description: "1st Place out of 800+ teams for creating a decentralised land verification portal.",
      },
    ],
    publications: [],
    volunteer: [],
    interests: ["Open-Source Mentorship", "Competitive Chess", "Distance Running"],
    referencesText: "Available upon request.",
    customSections: [],
  };
}

/**
 * Migration helper to ensure imported data or old saved formats upgrade cleanly to schema v1
 */
export function migrateResumeSchema(raw: any): ResumeData {
  const fallback = createEmptyResume();
  if (!raw || typeof raw !== "object") return fallback;

  return {
    meta: {
      ...fallback.meta,
      ...(raw.meta || {}),
      schemaVersion: RESUME_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      sectionOrder: Array.isArray(raw.meta?.sectionOrder) ? raw.meta.sectionOrder : fallback.meta.sectionOrder,
      sectionVisibility: {
        ...fallback.meta.sectionVisibility,
        ...(raw.meta?.sectionVisibility || {}),
      },
    },
    contact: {
      ...fallback.contact,
      ...(raw.contact || {}),
    },
    summary: typeof raw.summary === "string" ? raw.summary : fallback.summary,
    experience: Array.isArray(raw.experience) ? raw.experience : fallback.experience,
    education: Array.isArray(raw.education) ? raw.education : fallback.education,
    skills: {
      ...fallback.skills,
      ...(raw.skills || {}),
    },
    projects: Array.isArray(raw.projects) ? raw.projects : fallback.projects,
    certifications: Array.isArray(raw.certifications) ? raw.certifications : fallback.certifications,
    languages: Array.isArray(raw.languages) ? raw.languages : fallback.languages,
    awards: Array.isArray(raw.awards) ? raw.awards : fallback.awards,
    publications: Array.isArray(raw.publications) ? raw.publications : fallback.publications,
    volunteer: Array.isArray(raw.volunteer) ? raw.volunteer : fallback.volunteer,
    interests: Array.isArray(raw.interests) ? raw.interests : fallback.interests,
    referencesText: typeof raw.referencesText === "string" ? raw.referencesText : fallback.referencesText,
    customSections: Array.isArray(raw.customSections) ? raw.customSections : fallback.customSections,
  };
}
