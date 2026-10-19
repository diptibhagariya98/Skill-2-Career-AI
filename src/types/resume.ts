/**
 * Production Resume Data Model & Types
 * Conforms to Resume/CV Builder Website Production Implementation Spec (v1)
 */

export const RESUME_SCHEMA_VERSION = 1;

export type PageSize = "A4" | "Letter";
export type FontScale = "small" | "medium" | "large";
export type DateFormat = "MMM YYYY" | "MM/YYYY" | "YYYY-MM";
export enum ResumeTemplateId {
  CLASSIC = "classic",
  MODERN = "modern",
  COMPACT = "compact",
  ACADEMIC = "academic",
  MINIMALIST = "minimalist",
  CREATIVE = "creative",
}

export type TemplateId =
  | "classic"
  | "modern"
  | "compact"
  | "academic"
  | "minimalist"
  | "creative";

export const ACCENT_COLORS = [
  { name: "Teal", hex: "#0f766e" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Slate", hex: "#334155" },
  { name: "Emerald", hex: "#047857" },
  { name: "Burgundy", hex: "#881337" },
  { name: "Charcoal", hex: "#1f2937" },
  { name: "Royal Blue", hex: "#1d4ed8" },
  { name: "Purple", hex: "#6b21a8" },
];

export enum ExportStatus {
  IDLE = "idle",
  PREPARING = "preparing",
  GENERATING = "generating",
  READY = "ready",
  FAILED = "failed",
}

export enum ExportErrorCode {
  UNAUTHENTICATED = "UNAUTHENTICATED",
  INVALID_PAYLOAD = "INVALID_PAYLOAD",
  RENDER_FAILED = "RENDER_FAILED",
  RATE_LIMITED = "RATE_LIMITED",
  BROWSER_UNAVAILABLE = "BROWSER_UNAVAILABLE",
}

export type SectionKey =
  | "contact"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "awards"
  | "publications"
  | "volunteer"
  | "interests"
  | "references"
  | "custom";

export interface ContactInfo {
  fullName: string;
  headline?: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  linkedin?: string;
  links?: Array<{ id: string; label: string; url: string }>;
  workAuthorization?: string;
  photoUrl?: string; // Off by default in ATS templates
}

export interface WorkExperienceItem {
  id: string;
  title: string;
  employer: string;
  location?: string;
  employmentType?: "full-time" | "part-time" | "contract" | "internship" | "freelance";
  startMonth: string;
  startYear: string;
  endMonth?: string;
  endYear?: string;
  isCurrent: boolean;
  bullets: string[];
  technologies?: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  location?: string;
  startMonth: string;
  startYear: string;
  endMonth?: string;
  endYear?: string;
  isExpected?: boolean;
  grade?: string;
  highlights?: string[];
}

export interface SkillGroup {
  id: string;
  name: string;
  skills: string[];
}

export interface SkillsData {
  isGrouped: boolean;
  groups: SkillGroup[];
  flatList: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  role?: string;
  url?: string;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
  bullets: string[];
  technologies?: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: "native" | "fluent" | "professional" | "conversational" | "basic";
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  date?: string;
  description?: string;
}

export interface PublicationItem {
  id: string;
  title: string;
  venue: string;
  date?: string;
  url?: string;
}

export interface VolunteerItem {
  id: string;
  organization: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  bullets: string[];
}

export interface CustomSectionItem {
  id: string;
  title: string;
  type: "bullets" | "text";
  content: string | string[];
}

export interface ResumeMeta {
  id: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  title: string;
  selectedTemplate: TemplateId;
  pageSize: PageSize;
  fontScale: FontScale;
  accentColor: string;
  dateFormat: DateFormat;
  language: string;
  sectionOrder: SectionKey[];
  sectionVisibility: Record<SectionKey, boolean>;
}

export interface ResumeData {
  meta: ResumeMeta;
  contact: ContactInfo;
  summary: string;
  experience: WorkExperienceItem[];
  education: EducationItem[];
  skills: SkillsData;
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  awards: AwardItem[];
  publications: PublicationItem[];
  volunteer: VolunteerItem[];
  interests: string[];
  referencesText: string;
  customSections: CustomSectionItem[];
}

export interface ResumeRevision {
  timestamp: string;
  data: ResumeData;
}
