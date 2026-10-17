import { SectionKey } from "@/types/resume";

export interface SectionDefinition {
  key: SectionKey;
  label: string;
  atsHeading: string;
  defaultVisible: boolean;
  required: boolean;
  description: string;
}

export const SECTION_REGISTRY: Record<SectionKey, SectionDefinition> = {
  contact: {
    key: "contact",
    label: "Contact Information",
    atsHeading: "Contact",
    defaultVisible: true,
    required: true,
    description: "Your full name, email, phone, location, and professional links.",
  },
  summary: {
    key: "summary",
    label: "Professional Summary",
    atsHeading: "Summary",
    defaultVisible: true,
    required: false,
    description: "A 2 to 4 sentence executive snapshot of your career and strengths.",
  },
  experience: {
    key: "experience",
    label: "Work Experience",
    atsHeading: "Work Experience",
    defaultVisible: true,
    required: true,
    description: "Reverse-chronological history of roles, employers, and bullet achievements.",
  },
  education: {
    key: "education",
    label: "Education",
    atsHeading: "Education",
    defaultVisible: true,
    required: true,
    description: "Academic qualifications, degrees, institutions, and relevant honours.",
  },
  skills: {
    key: "skills",
    label: "Skills",
    atsHeading: "Skills",
    defaultVisible: true,
    required: true,
    description: "Categorized or flat lists of technical, domain, and tool capabilities.",
  },
  projects: {
    key: "projects",
    label: "Projects",
    atsHeading: "Projects",
    defaultVisible: true,
    required: false,
    description: "Notable technical or business projects demonstrating practical impact.",
  },
  certifications: {
    key: "certifications",
    label: "Certifications",
    atsHeading: "Certifications",
    defaultVisible: true,
    required: false,
    description: "Industry certificates, credentials, and verification links.",
  },
  languages: {
    key: "languages",
    label: "Languages",
    atsHeading: "Languages",
    defaultVisible: false,
    required: false,
    description: "Spoken or written languages and proficiency levels.",
  },
  awards: {
    key: "awards",
    label: "Awards & Honours",
    atsHeading: "Awards",
    defaultVisible: false,
    required: false,
    description: "Competitions won, hackathons, academic honours, and formal accolades.",
  },
  publications: {
    key: "publications",
    label: "Publications",
    atsHeading: "Publications",
    defaultVisible: false,
    required: false,
    description: "Research papers, journal publications, patents, or whitepapers.",
  },
  volunteer: {
    key: "volunteer",
    label: "Volunteer Experience",
    atsHeading: "Volunteer Experience",
    defaultVisible: false,
    required: false,
    description: "Community engagement, pro-bono work, or leadership in clubs.",
  },
  interests: {
    key: "interests",
    label: "Interests",
    atsHeading: "Interests",
    defaultVisible: false,
    required: false,
    description: "Concise extracurricular interests (hidden by default).",
  },
  references: {
    key: "references",
    label: "References",
    atsHeading: "References",
    defaultVisible: false,
    required: false,
    description: "Standard 'Available on request' or designated mentors/leads.",
  },
  custom: {
    key: "custom",
    label: "Custom Sections",
    atsHeading: "Additional Information",
    defaultVisible: false,
    required: false,
    description: "Additional user-defined sections with bullets or paragraph text.",
  },
};

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "contact",
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "awards",
  "publications",
  "volunteer",
  "interests",
  "references",
  "custom",
];

export const DEFAULT_SECTION_VISIBILITY: Record<SectionKey, boolean> = {
  contact: true,
  summary: true,
  experience: true,
  education: true,
  skills: true,
  projects: true,
  certifications: true,
  languages: false,
  awards: false,
  publications: false,
  volunteer: false,
  interests: false,
  references: false,
  custom: false,
};
