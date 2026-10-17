/**
 * Phase 3 Part A: Strict Type Definitions for Scholarship Matching Engine & Directory
 */

export type SocialCategory =
  | "General"
  | "OBC"
  | "SC"
  | "ST"
  | "EWS"
  | "Prefer not to say";

export type StudyLevel =
  | "school"
  | "diploma"
  | "undergraduate"
  | "postgraduate"
  | "doctoral";

export type ScoreType = "cgpa" | "percentage";

export type InstitutionType = "government" | "aided" | "private" | "university";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type DisabilityStatus = "yes" | "no" | "prefer_not_to_say";

export interface StudentProfile {
  domicileState: string;
  socialCategory: SocialCategory;
  annualIncome: number; // in INR per annum
  studyLevel: StudyLevel;
  scoreType: ScoreType;
  scoreValue: number;
  cgpaScale?: number; // e.g. 10 or 4
  class12Percentage?: number;
  courseStream?: string;
  institutionType?: InstitutionType;
  gender?: Gender;
  disability?: DisabilityStatus;
  yearOfStudy?: number;
}

export type RuleOperator =
  | "equals"
  | "not_equals"
  | "is_one_of"
  | "is_not_one_of"
  | "less_than"
  | "less_than_or_equal"
  | "greater_than"
  | "greater_than_or_equal"
  | "between"
  | "is_provided";

export type RuleKind = "hard" | "soft";

export interface SingleRule {
  id: string;
  field: keyof StudentProfile;
  operator: RuleOperator;
  value: string | number | boolean | (string | number)[];
  kind: RuleKind;
  label: string;
  inclusive?: boolean;
}

export interface RuleGroup {
  id: string;
  combinator: "ALL" | "ANY";
  rules: (SingleRule | RuleGroup)[];
}

export type SchemeLevel = "central" | "state" | "institution" | "private";
export type ApplicationStatus = "upcoming" | "open" | "closed" | "always_open";
export type SchemeStatus = "draft" | "in_review" | "published" | "retired";

export interface ScholarshipBenefit {
  description: string;
  amount?: number;
  frequency?: "one_time" | "annual" | "monthly" | "tuition_waiver";
}

export interface ApplicationWindow {
  opens?: string; // YYYY-MM-DD
  closes?: string; // YYYY-MM-DD
  status: ApplicationStatus;
}

export interface ScholarshipScheme {
  id: string;
  name: string;
  shortName: string;
  level: SchemeLevel;
  state?: string; // e.g., "Gujarat" when level === "state"
  issuingBody: string;
  officialSourceLink: string;
  benefit: ScholarshipBenefit;
  criteria: RuleGroup;
  requiredDocuments: string[];
  applicationWindow: ApplicationWindow;
  howToApply: string[];
  notes?: string;
  lastVerifiedDate: string; // ISO 8601
  verifiedBy: string;
  status: SchemeStatus;
  version: number;
}

export type RuleEvaluationStatus = "met" | "not_met" | "unknown";

export interface RuleEvaluationResult {
  ruleId: string;
  field: keyof StudentProfile;
  label: string;
  status: RuleEvaluationStatus;
  kind: RuleKind;
  studentValueText: string;
  requiredValueText: string;
  reason: string;
  isMutable: boolean; // e.g. marks/income can change, state/category/gender are immutable
}

export type SchemeClassification = "eligible" | "check_details" | "not_eligible";

export interface SchemeEvaluationResult {
  scheme: ScholarshipScheme;
  classification: SchemeClassification;
  ruleResults: RuleEvaluationResult[];
  failedHardRules: RuleEvaluationResult[];
  failedSoftRules: RuleEvaluationResult[];
  unknownRules: RuleEvaluationResult[];
  whatWouldChangeThis?: string;
  isStale: boolean; // Verified > 90 days ago
}

export interface ScholarListing {
  id: string;
  userId: string;
  displayName: string;
  schemeId: string;
  schemeName: string;
  yearAwarded: number;
  course?: string;
  institution?: string;
  state?: string;
  languages: string[];
  waysCanHelp: string[];
  shortNote?: string;
  messagingNumber: string; // obfuscated/hashed in public listings
  contactMode: "approval" | "open_whatsapp";
  availability?: string;
  isVerified: boolean;
  verifiedAt?: string;
  status: "active" | "paused" | "suspended";
}

export interface ContactRequest {
  id: string;
  scholarId: string;
  applicantId: string;
  applicantName: string;
  schemeName: string;
  message: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
}

export interface ScholarReport {
  id: string;
  scholarId: string;
  reporterId: string;
  reason: "spam" | "asking_for_money" | "harassment" | "fake_listing" | "other";
  details?: string;
  createdAt: string;
}

/**
 * Type guard to check if a rule in a group is a nested RuleGroup
 */
export function isRuleGroup(rule: SingleRule | RuleGroup): rule is RuleGroup {
  return "combinator" in rule && "rules" in rule;
}
