# Phase 3 Part A: Scholarship Matching & Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Phase 3 Part A pure deterministic scholarship eligibility engine, verified Indian schemes directory (MYSY, NSP, SC/ST, Pragati), safe scholar peer mentor registry, and mobile-responsive UI with strict TypeScript typing.

**Architecture:** A zero-dependency pure TypeScript evaluation engine (`src/lib/scholarships/engine.ts`) evaluates student profiles against data-driven rule trees client-side in < 15ms with full explanation and "What would change this?" guidance. Pre-seeded verified Indian schemes are loaded and cached, with a mobile-first wizard and safe scholar WhatsApp/request communication flows.

**Tech Stack:** Next.js 14, React 18, TypeScript (Strict Type Checking), Tailwind CSS, Firebase Firestore & Auth, Lucide Icons.

**Spec:** [`docs/superpowers/specs/2026-10-17-phase-3-part-a-scholarship-engine-design.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/docs/superpowers/specs/2026-10-17-phase-3-part-a-scholarship-engine-design.md)

## Global Constraints
- Strictly typed TypeScript with zero `any` types.
- Follow project theme: `indigo-600` primary, `gray-50` background, rounded-2xl cards, clean typography.
- Mobile first: Min touch targets 44px x 44px, no horizontal scrolling, responsive 1-column layouts on mobile.
- Safe contact: Scholar phone numbers are never rendered as plain text in the HTML DOM.
- Pure engine: Zero side-effects, deterministic evaluation, plain language reasons for every rule result.

---

### Task 1: Strict Types & Interfaces
**Files:**
- Create: `src/types/scholarships.ts`

- [x] Define comprehensive types: `StudentProfile`, `SocialCategory`, `StudyLevel`, `SingleRule`, `RuleGroup`, `ScholarshipScheme`, `RuleEvaluationResult`, `SchemeEvaluationResult`, `ScholarListing`, `ContactRequest`.
- [x] Export helper guard functions and strict type enums.

---

### Task 2: Verified Seed Schemes Catalog
**Files:**
- Create: `src/constants/seedScholarships.ts`

- [x] Add 5 verified Indian schemes with structured rule trees, official links, benefits, and documents:
  - Gujarat MYSY (Mukhyamantri Yuva Swavalamban Yojana)
  - NSP Central Sector Scheme of Scholarship (CSSS)
  - Post-Matric Scholarship for SC/ST Students
  - AICTE Pragati Scholarship for Girl Students
  - Post-Matric Scholarship for OBC Students
- [x] Add 4 verified initial scholar peer mentor profiles with ways they can help and obfuscated contact identifiers.

---

### Task 3: Pure Deterministic Eligibility Rule Engine
**Files:**
- Create: `src/lib/scholarships/engine.ts`

- [x] Implement grade & scale normalization (CGPA to percentage: $\text{Percentage} = \text{CGPA} \times 9.5$).
- [x] Implement pure rule evaluators for operators: `equals`, `not_equals`, `is_one_of`, `is_not_one_of`, `less_than`, `less_than_or_equal`, `greater_than`, `greater_than_or_equal`, `between`, `is_provided`.
- [x] Implement recursive `RuleGroup` evaluation (`ALL` / `ANY`).
- [x] Generate human-readable reasons for every rule (student value vs. threshold).
- [x] Implement "What would change this?" for near-miss schemes (single failed mutable rule).
- [x] Implement scheme staleness detection (> 90 days).

---

### Task 4: Unit Test Suite for Engine
**Files:**
- Create: `src/lib/scholarships/__tests__/verifyEngine.ts`

- [x] Test operator evaluation with passing, failing, boundary, and unknown values.
- [x] Test hard vs soft rule behavior.
- [x] Test determinism (identical outputs for identical inputs).
- [x] Test mutable hint logic (does not recommend changing immutable traits like gender or caste).
- [x] Run automated verification script to ensure 100% pass rate.

---

### Task 5: Mobile-First Eligibility Wizard Component
**Files:**
- Create: `src/components/scholarships/EligibilityWizard.tsx`

- [x] Build 3-step mobile card wizard (1: Domicile & Category, 2: Academics & CGPA/%, 3: Income & Demographics).
- [x] Include real-time currency formatter (shows input in Lakhs & words, e.g. "₹6.00 Lakh").
- [x] Add progress indicators, large 44px+ touch targets, and accessible validation messages.

---

### Task 6: Grouped Results & "What Would Change This" Breakdown
**Files:**
- Create: `src/components/scholarships/EvaluationResults.tsx`

- [x] Build grouped tabs/sections: Eligible (Emerald), Check Details (Amber), Not Eligible (Slate/Rose).
- [x] Render accordion breakdown for each scheme detailing every rule met/unmet.
- [x] Render official portal link, last verified date tag, and staleness warning.
- [x] Render "What would change this?" cards for near-miss opportunities.

---

### Task 7: Scheme Directory & Filter Component
**Files:**
- Create: `src/components/scholarships/SchemeDirectory.tsx`

- [x] Search by scheme name, level, state, and benefit type.
- [x] Quick filters: "Open Now", "Central", "State", "For Girls", "Income < ₹5L".
- [x] Detailed modal / expandable card showing eligibility criteria, required documents, and how-to-apply steps.

---

### Task 8: Verified Scholar Directory & Safe Contact Modal
**Files:**
- Create: `src/components/scholarships/ScholarDirectory.tsx`

- [x] Render verified mentor cards with badge, scheme won, college, and languages.
- [x] Implement safe contact actions:
  - Mode 1: Dynamic WhatsApp trigger (safely constructed on-click, never plain text in DOM).
  - Mode 2: Request guidance modal (300 character message with safety notice).
- [x] Include anti-fraud warning banner ("Never pay any fee for scholarships").

---

### Task 9: Admin Test Console
**Files:**
- Create: `src/components/scholarships/AdminConsole.tsx`

- [x] Interactive simulator: select any scheme and test student profiles on the fly.
- [x] View rule AST tree, evaluation timing (< 5ms), and staleness audit report.

---

### Task 10: Modern Unified Scholarships View Integration
**Files:**
- Modify: `src/components/Scholarships.tsx`

- [x] Replace outdated placeholder code with full Phase 3 tabbed navigation:
  - "Check Eligibility", "My Results", "Browse Schemes", "Find Mentors", "Admin Console".
- [x] Sync styling with ResuMentor `indigo-600` theme and ensure complete mobile responsiveness.

---

### Task 11: End-to-End Type Check & Build Verification
**Files:**
- All touched files

- [x] Run `npx tsc --noEmit` to ensure strict type compliance.
- [x] Run Next.js build validation.
