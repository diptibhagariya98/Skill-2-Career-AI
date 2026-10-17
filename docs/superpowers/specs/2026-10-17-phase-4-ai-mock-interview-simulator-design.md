# Phase 4: AI Mock Interview Simulator & Question Bank Engine - Technical Design

**Status:** Approved  
**Author:** Antigravity  
**Date:** 2026-10-17  
**Spec Reference:** [`docs/Phase 4 AI Mock Interview Simulator (Implementation Spec) (1).md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/docs/Phase%204%20AI%20Mock%20Interview%20Simulator%20%28Implementation%20Spec%29%20%281%29.md)  
**Architecture Rules:** [`CAPACITOR_RULES.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/.agents/CAPACITOR_RULES.md) & [`NEXTJS_RULES.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/.agents/NEXTJS_RULES.md)

---

## 1. Executive Summary & Architecture

Phase 4 delivers an end-to-end, mobile-first **AI Mock Interview Simulator & Practice Hub** featuring a dual-engine architecture:
1. **Quick Practice Engine (Offline / Zero-AI Base Mode):**
   - High-performance, offline-capable practice from a reviewed question bank.
   - Covers 4 question types: Multiple Choice (single/multiple), Situational Judgement, Short Answer, and Open Answer.
   - Deterministic role profile matching, JD keyword matching, and 3-step Open Answer compare flow (Answer -> Automated Key-Point Check -> Self-Check & Confidence).
   - Instant template-driven scorecard generation with zero external API calls.
2. **Smart Interview Simulator (Gemini AI Dynamic Mode):**
   - Dynamic role & job description plan generation with safety & fairness filtering (no protected attributes).
   - 3-dimension rubric scoring: **Accuracy** (0-10, 40%), **Context-Correctness** (0-10, 35%), and **Confidence** (wording analysis, 0-10, 25%).
   - Targeted follow-up questions, instant feedback cards in practice mode, and realistic mode (feedback deferred to the end).
   - Fixed hiring recommendation bands (Strong Hire, Hire, Lean Hire, Lean No Hire, No Hire) computed deterministically with strict practice-aid disclaimers.
3. **Speech-to-Text Voice Dictation:**
   - Optional Web Speech API microphone input with live transcript editing before submission. No audio leaves the device; only verified text is processed.
4. **Session Persistence, Scorecards & History:**
   - Local storage persistence supporting pause/resume within 24 hours, score trends, PDF scorecard export, and complete data deletion.

---

## 2. Core Data Models (`src/types/interview.ts`)

- `InterviewMode`: `'quick_practice' | 'hybrid' | 'full_ai'`
- `InterviewDifficulty`: `'friendly' | 'standard' | 'tough'`
- `ExperienceLevel`: `'fresher' | 'junior' | 'mid' | 'senior' | 'lead'`
- `InterviewType`: `'behavioral' | 'technical' | 'mixed' | 'hr'`
- `FeedbackTiming`: `'instant' | 'deferred'`
- `SessionState`: `'created' | 'planning' | 'in_progress' | 'evaluating' | 'completed' | 'ended_early' | 'failed' | 'expired'`
- `DimensionScores`: `{ accuracy: number; confidence: number; context: number }`
- `HiringRecommendation`: `'Strong hire' | 'Hire' | 'Lean hire' | 'Lean no hire' | 'No hire' | 'Not enough answers to recommend'`

---

## 3. Deterministic Scoring & Band Formulas

### 3.1 Answer Score Formula
$$\text{AnswerScore} = (\text{accuracy} \times 0.40 + \text{context} \times 0.35 + \text{confidence} \times 0.25) \times 10$$
Scaled to a 0–100 integer.

### 3.2 Recommendation Bands
- $85 - 100$: **Strong hire**
- $70 - 84$: **Hire**
- $55 - 69$: **Lean hire**
- $40 - 54$: **Lean no hire**
- $0 - 39$: **No hire**
- If fewer than half of questions answered: **Not enough answers to recommend**

### 3.3 Open Answer Deterministic Check (Quick Practice)
$$\text{Score}_{\text{open}} = \frac{\text{KeyPointScore}_{\text{user}} + \text{AutomatedScore}_{\text{keyword}}}{2}$$

---

## 4. Mobile & Capacitor Safety Guardrails
- Guard all browser APIs with `typeof window !== "undefined"` and `window.webkitSpeechRecognition || window.SpeechRecognition`.
- Zero Node dependencies in UI components.
- Offline-first resilience: Quick Practice works without any internet connection.
