# Phase 3 Part A: Scholarship Matching & Directory — Technical Design Document

**Date:** 2026-10-17  
**Module:** Phase 3 Part A (Scholarship Matching Engine, Scheme Directory, and Scholar Registry)  
**Status:** Approved by Owner  
**Stack:** Next.js 14 (App Router), TypeScript (Strict Type Checking), Tailwind CSS, Firebase Firestore & Auth, Lucide Icons  

---

## 1. System Overview

Phase 3 Part A delivers an explainable, deterministic scholarship eligibility engine alongside a verified scheme directory and scholar peer-guidance registry for ResuMentor.

Key Principles:
- **Zero Hallucination / Pure Rule-Based Engine**: Eligibility is computed deterministically from verified data. No AI guessing.
- **Strict Typing**: Full TypeScript interfaces with zero `any` types for profile, rules, schemes, evaluations, and scholars.
- **Mobile-First & Aesthetic Sync**: Seamless integration with the existing `indigo-600` / `gray-50` theme, 44px+ touch targets, and responsive 1-column mobile layouts.
- **Privacy & Safety**: Sensitive eligibility factors are processed client-side and never logged or exposed. Scholar contact numbers are protected against scraping.

---

## 2. Strict Type System & Data Models (`src/types/scholarships.ts`)

```typescript
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
  cgpaScale?: number; // e.g., 10 or 4
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

export interface ScholarshipScheme {
  id: string;
  name: string;
  shortName: string;
  level: SchemeLevel;
  state?: string;
  issuingBody: string;
  officialSourceLink: string;
  benefit: {
    description: string;
    amount?: number;
    frequency?: "one_time" | "annual" | "monthly" | "tuition_waiver";
  };
  criteria: RuleGroup;
  requiredDocuments: string[];
  applicationWindow: {
    opens?: string;
    closes?: string;
    status: ApplicationStatus;
  };
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
  isMutable: boolean; // e.g. marks/income can change, gender/category cannot
}

export type SchemeClassification = "eligible" | "check_details" | "not_eligible";

export interface SchemeEvaluationResult {
  scheme: ScholarshipScheme;
  classification: SchemeClassification;
  ruleResults: RuleEvaluationResult[];
  failedHardRules: RuleEvaluationResult[];
  failedSoftRules: RuleEvaluationResult[];
  unknownRules: RuleEvaluationResult[];
  whatWouldChangeThis?: string; // Actionable hint if exactly 1 mutable rule failed
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
  messagingNumber: string; // obfuscated/encrypted in storage
  contactMode: "approval" | "open_whatsapp";
  availability?: string;
  isVerified: boolean;
  verifiedAt?: string;
  status: "active" | "paused" | "suspended";
}
```

---

## 3. Pure Engine Logic (`src/lib/scholarships/engine.ts`)

1. **Grade Normalization**:
   - Standard conversion: $\text{Percentage} = \text{CGPA} \times 9.5$.
   - Scale validation: If CGPA scale is out of range ($> \text{scale}$ or $\le 0$), rule flags as `unknown`.
2. **Deterministic Evaluation**:
   - Pure function `evaluateScheme(profile: StudentProfile, scheme: ScholarshipScheme): SchemeEvaluationResult`.
   - Traverses nested `RuleGroup` (`ALL` = conjunction, `ANY` = disjunction).
   - Generates exact human-readable reasoning (e.g., *"Your annual income is ₹7,50,000; the maximum permitted is ₹6,00,000"*).
3. **Classification Rules**:
   - `eligible`: All hard rules `met`, no hard or soft rules `unknown`.
   - `check_details`: All hard rules `met`, but 1+ rule is `unknown` or 1+ soft rule is `not_met`.
   - `not_eligible`: At least 1 hard rule is `not_met`.
4. **"What would change this?"**:
   - If `failedHardRules.length === 1` and rule is mutable (e.g. `scoreValue` or `annualIncome`), output actionable guidance without suggesting changes to immutable attributes (e.g. `domicileState`, `socialCategory`, `gender`).

---

## 4. UI Architecture & Components

1. **`src/components/Scholarships.tsx`**: Main container managing tabs:
   - **Tab 1: Eligibility Check**: 3-step mobile-first wizard (Domicile/Category -> Academics -> Income/Demographics).
   - **Tab 2: My Matches**: Grouped results (Eligible, Check Details, Not Eligible).
   - **Tab 3: Scheme Directory**: Filterable cards, deadline tags, search, and official links.
   - **Tab 4: Verified Scholars**: Mentor cards with WhatsApp/Approval contact triggers.
   - **Tab 5: Admin Test Console**: Live scheme simulator for testing rule edge cases.
2. **Seed Schemes (`src/constants/seedScholarships.ts`)**:
   - Gujarat MYSY Scheme
   - NSP Central Sector Scheme of Scholarship (CSSS)
   - Post-Matric Scholarship for SC/ST
   - AICTE Pragati Scholarship for Girls
   - Post-Matric Scholarship for OBC

---

## 5. Security, Anti-Scraping & Verification Plan

- WhatsApp phone numbers are protected:
  - Stored obfuscated in state/database.
  - Links generated dynamically on tap (`onClick`) with explicit user intent confirmation rather than rendered statically in the HTML DOM.
- Rate limiting helper to prevent excessive requests (max 5 scholar requests per day per user).
- Pure engine unit tests verifying:
  - All comparison operators (`equals`, `less_than`, `between`, etc.).
  - Determinism (identical inputs yield identical results).
  - Mutable vs immutable hints.
