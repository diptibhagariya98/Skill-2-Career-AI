# Phase 4: AI Mock Interview Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Phase 4 AI Mock Interview Simulator and Quick Practice Question-Bank engine with dual-mode support, 3-dimension rubric scoring, Web Speech voice dictation, instant/deferred feedback, printable PDF scorecards, and session history.

**Spec Reference:** [`docs/Phase 4 AI Mock Interview Simulator (Implementation Spec) (1).md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/docs/Phase%204%20AI%20Mock%20Interview%20Simulator%20%28Implementation%20Spec%29%20%281%29.md)  
**Design:** [`docs/superpowers/specs/2026-10-17-phase-4-ai-mock-interview-simulator-design.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/docs/superpowers/specs/2026-10-17-phase-4-ai-mock-interview-simulator-design.md)

---

### Task 1: Strict Types & Interfaces
**Files:**
- Create: `src/types/interview.ts`

- [ ] Define comprehensive types: `InterviewMode`, `InterviewDifficulty`, `ExperienceLevel`, `InterviewType`, `FeedbackTiming`, `SessionState`, `InterviewSetupConfig`, `BankQuestion`, `InterviewQuestion`, `QuestionType`, `DimensionScores`, `AnswerEvaluation`, `InterviewTurn`, `HiringRecommendation`, `InterviewScorecardData`, `InterviewSessionRecord`.
- [ ] Export type guards and status helper constants.

---

### Task 2: Reviewed Question Bank & Template Library
**Files:**
- Create: `src/constants/interviewData.ts`

- [ ] Define role profiles (Frontend, Backend, Fullstack, Data Analyst, Mobile Dev, General) with keyword aliases.
- [ ] Define skill aliases dictionary for deterministic JD skill extraction.
- [ ] Populate reviewed question bank with diverse questions (Multiple Choice, Situational Judgement, Short Answer, Open Answer with model answers and key points).
- [ ] Define narrative scorecard sentence template library.

---

### Task 3: Deterministic Scoring & Logic Engine
**Files:**
- Create: `src/lib/interview/engine.ts`

- [ ] Implement weighted answer score calculator: $0.40 \times \text{Accuracy} + 0.35 \times \text{Context} + 0.25 \times \text{Confidence}$.
- [ ] Implement hiring recommendation band resolver with practice-estimate disclaimer.
- [ ] Implement keyword extraction and matching for open answers.
- [ ] Implement question selection algorithm based on role, level, JD skills, and random seed.
- [ ] Implement sensitive content / PII regex detector (credit cards, identity numbers).
- [ ] Implement state machine transition validator.

---

### Task 4: Unit Test Suite for Engine
**Files:**
- Create: `src/lib/interview/__tests__/verifyInterviewEngine.ts`

- [ ] Test scoring weights, boundary cases for recommendation bands (39/40, 54/55, 69/70, 84/85).
- [ ] Test open answer automated keyword detection and 50/50 score averaging.
- [ ] Test deterministic question selection repeatability with same seed.
- [ ] Run test suite with `npx tsx` and verify 100% pass rate.

---

### Task 5: AI Interviewer Bridge Service
**Files:**
- Create: `src/lib/interview/geminiService.ts`

- [ ] Connect with existing `/api/gemini` proxy route using strict JSON formatting instructions.
- [ ] Include prompt defense against prompt injection and fairness checks (blocking protected attributes).
- [ ] Handle retry once on malformed reply, fallback to deterministic evaluation if service is unreachable.

---

### Task 6: UI - Interview Setup Component
**Files:**
- Create: `src/components/interview/InterviewSetup.tsx`

- [ ] Role selection with suggestions and custom input.
- [ ] Optional job description textarea with live character counter and extracted skill chips.
- [ ] Level, interview type, question count (5, 8, 10), difficulty, feedback timing (practice vs realistic), and voice dictation toggle.
- [ ] Mode selector cards (Quick Practice vs Smart Interview).
- [ ] Privacy consent modal on first use.

---

### Task 7: UI - Live Interview Thread & Answer Box
**Files:**
- Create: `src/components/interview/InterviewThread.tsx`
- Create: `src/components/interview/OpenAnswerCompare.tsx`

- [ ] Conversation thread with AI Interviewer and Candidate messages.
- [ ] Sticky bottom answer box with character counter, submit, skip, and voice dictation button (Web Speech API).
- [ ] Instant feedback card in Practice Mode with Accuracy, Confidence, and Context chips, reasons, what went well, and what to improve.
- [ ] 3-step Open Answer compare flow (Answer -> Automated Keyword Check -> Self-Check & Confidence Rating).

---

### Task 8: UI - Comprehensive Scorecard & PDF Export
**Files:**
- Create: `src/components/interview/InterviewScorecard.tsx`

- [ ] Overall score ring and recommendation badge with mandatory practice-aid disclaimer.
- [ ] Dimension score bars, strengths, areas to improve, skills coverage matrix.
- [ ] Collapsible question-by-question review.
- [ ] Action buttons: Retake with same setup, Start new mock, Download PDF (via `html2pdf.js`), and Delete session.

---

### Task 9: UI - Session History & Score Trends
**Files:**
- Create: `src/components/interview/InterviewHistory.tsx`

- [ ] Local storage persistence for session history.
- [ ] Score trend visualization over past sessions for same role.
- [ ] Weak dimension alert and direct links to Practice Hub and Resume Builder.

---

### Task 10: Integration into Dashboard & Build Verification
**Files:**
- Modify: `src/components/AIInterview.tsx`
- Modify: `src/constants/endpoints.ts`

- [ ] Wire all sub-components seamlessly into `src/components/AIInterview.tsx`.
- [ ] Verify `npm run build:mobile` passes cleanly.
