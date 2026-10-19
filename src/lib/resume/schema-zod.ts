import { z } from "zod";
import { ResumeTemplateId } from "@/types/resume";

export const ContactInfoZodSchema = z.object({
  fullName: z.string().default(""),
  headline: z.string().optional().default(""),
  email: z.string().default(""),
  phone: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default(""),
  website: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  links: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        url: z.string(),
      })
    )
    .optional()
    .default([]),
  workAuthorization: z.string().optional().default(""),
  photoUrl: z.string().optional().default(""),
});

export const WorkExperienceItemZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  employer: z.string(),
  location: z.string().optional().default(""),
  employmentType: z
    .enum(["full-time", "part-time", "contract", "internship", "freelance"])
    .optional(),
  startMonth: z.string().default(""),
  startYear: z.string().default(""),
  endMonth: z.string().optional().default(""),
  endYear: z.string().optional().default(""),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
  technologies: z.array(z.string()).optional().default([]),
});

export const EducationItemZodSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional().default(""),
  location: z.string().optional().default(""),
  startMonth: z.string().default(""),
  startYear: z.string().default(""),
  endMonth: z.string().optional().default(""),
  endYear: z.string().optional().default(""),
  isExpected: z.boolean().optional().default(false),
  grade: z.string().optional().default(""),
  highlights: z.array(z.string()).optional().default([]),
});

export const SkillGroupZodSchema = z.object({
  id: z.string(),
  name: z.string(),
  skills: z.array(z.string()).default([]),
});

export const SkillsDataZodSchema = z.object({
  isGrouped: z.boolean().default(true),
  groups: z.array(SkillGroupZodSchema).default([]),
  flatList: z.array(z.string()).default([]),
});

export const ProjectItemZodSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().optional().default(""),
  url: z.string().optional().default(""),
  startMonth: z.string().optional().default(""),
  startYear: z.string().optional().default(""),
  endMonth: z.string().optional().default(""),
  endYear: z.string().optional().default(""),
  bullets: z.array(z.string()).default([]),
  technologies: z.array(z.string()).optional().default([]),
});

export const CertificationItemZodSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string().optional().default(""),
  expiryDate: z.string().optional().default(""),
  credentialId: z.string().optional().default(""),
  credentialUrl: z.string().optional().default(""),
});

export const LanguageItemZodSchema = z.object({
  id: z.string(),
  language: z.string(),
  proficiency: z.enum([
    "native",
    "fluent",
    "professional",
    "conversational",
    "basic",
  ]),
});

export const AwardItemZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  issuer: z.string(),
  date: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export const PublicationItemZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  venue: z.string().optional().default(""),
  date: z.string().optional().default(""),
  url: z.string().optional().default(""),
});

export const VolunteerItemZodSchema = z.object({
  id: z.string(),
  role: z.string(),
  organization: z.string(),
  startMonth: z.string().optional().default(""),
  startYear: z.string().optional().default(""),
  endMonth: z.string().optional().default(""),
  endYear: z.string().optional().default(""),
  isCurrent: z.boolean().optional().default(false),
  description: z.string().optional().default(""),
});

export const CustomSectionItemZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["bullets", "text"]),
  content: z.union([z.array(z.string()), z.string()]),
});

export const ResumeMetaZodSchema = z.object({
  id: z.string(),
  schemaVersion: z.number().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  title: z.string().default("My Resume"),
  selectedTemplate: z.nativeEnum(ResumeTemplateId).default(ResumeTemplateId.CLASSIC),
  pageSize: z.enum(["A4", "Letter"]).default("A4"),
  fontScale: z.enum(["small", "medium", "large"]).default("medium"),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid 6-character hex color code")
    .default("#1e3a8a"),
  dateFormat: z.enum(["MMM YYYY", "MM/YYYY", "YYYY-MM"]).default("MMM YYYY"),
  language: z.string().default("en"),
  sectionOrder: z.array(z.string()).default([]),
  sectionVisibility: z.record(z.string(), z.boolean()).default({}),
});

export const ResumeZodSchema = z.object({
  meta: ResumeMetaZodSchema,
  contact: ContactInfoZodSchema,
  summary: z.string().default(""),
  experience: z.array(WorkExperienceItemZodSchema).default([]),
  education: z.array(EducationItemZodSchema).default([]),
  skills: SkillsDataZodSchema,
  projects: z.array(ProjectItemZodSchema).default([]),
  certifications: z.array(CertificationItemZodSchema).default([]),
  languages: z.array(LanguageItemZodSchema).default([]),
  awards: z.array(AwardItemZodSchema).default([]),
  publications: z.array(PublicationItemZodSchema).default([]),
  volunteer: z.array(VolunteerItemZodSchema).default([]),
  interests: z.array(z.string()).default([]),
  referencesText: z.string().default("Available upon request."),
  customSections: z.array(CustomSectionItemZodSchema).default([]),
});

export type ValidatedResumeData = z.infer<typeof ResumeZodSchema>;
