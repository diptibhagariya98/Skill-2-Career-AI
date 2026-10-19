# Assessment & Score Card Rules (Material 3 Expressive, Android 15/16)

Applies to: Live Interview feedback, Interview Scorecard, Resume Preflight ATS scores, Quizzes, and any evaluation card displaying metrics.

## 1. Score Calculation & Rounding (Zero Mathematical Mismatch)
- **Single Source of Truth:** The overall score must always be computed from the exact component weights displayed on screen in one central function (`calculateAnswerScore`).
- **Standard Weights:**
  - Accuracy: **40%**
  - Context: **35%**
  - Confidence: **25%**
- **Formula:** `Math.round((accuracy * 0.4 + context * 0.35 + confidence * 0.25) * 10)`.
- **No Hardcoded Overrides:** Never hardcode `100/100` if the weighted sum yields `97.5` or `98`. If an answer is fully correct (e.g. multiple choice), all contributing dimensions must evaluate to 10/10 so the math is transparent and consistent.
- **Brevity & Depth Penalties:** Single-word or brief answers (e.g., "useMemo") cannot earn maximum context or confidence scores. Cap confidence at 4/10 and context at 3/10 when the answer lacks architectural reasoning and constraints.

## 2. Score Hierarchy & Visual Layout
- **Score as the Hero:** Display the overall score as a prominent hero metric (e.g., `98/100` in 28–32px font) paired with a semantic pill badge (`Strong answer`, `Good answer`, `Developing`, `Needs practice`).
- **No Multi-Line Score Headers:** Never allow score titles like `Answer Score: 100/100` or method badges like `Key-Point Blend` to wrap into multiple lines.
- **Scoring Method Disclosure:** Place method details into an expandable "Scoring info" or "How this was scored" toggle rather than prominent, confusing badge jargon.

## 3. Metric Display: Rows Over Narrow Columns
- **Anti-Pattern:** 3 narrow column tiles on mobile viewports (< 412px) cause label truncation (e.g., "Confidenc" clipped, "Accuracy" touching border).
- **Rule:** Use full-width horizontal rows:
  - Left: Metric label (`Accuracy`) with small supporting text (`· 40% weight`).
  - Right: Numerical score with semantic color (`10/10`).
  - Bottom: Thin progress track (`h-1.5 rounded-full`) filled according to score percentage.

## 4. Semantic Color Thresholds
Never assign arbitrary accent colors (e.g., random indigo, purple, teal) across parallel metric scores. Always adhere to strict semantic thresholds paired with textual context:
- **Score $\ge 8$ / 10 ($\ge 80\%$):** Emerald / Green (`text-emerald-700 bg-emerald-50 bar-bg-emerald-500`).
- **Score $5 - 7$ / 10 ($50 - 79\%$):** Amber (`text-amber-700 bg-amber-50 bar-bg-amber-500`).
- **Score $< 5$ / 10 ($< 50\%$):** Rose / Red (`text-rose-700 bg-rose-50 bar-bg-rose-500`).

## 5. Tonal Surfaces (No Card Nesting Madness)
- Eliminate harsh borders and cards-inside-cards-inside-cards.
- Outer container uses a clean tonal background (`bg-slate-50` or `bg-gray-50`) with no harsh outline.
- Feedback blocks use a soft tonal fill (`bg-indigo-50/70`) without thick borders.
- Sub-cards (metric rows, concept callouts) use clean white rounded cards with subtle `shadow-2xs`.

## 6. Action Docking & Safe Areas
- Feedback continue actions (`Next question`, `Finish interview`) must **never** scroll with the conversation body.
- Dock a full-width bottom bar pinned above `safe-area-inset-bottom`.
- Include a secondary `Retry` action for learning retention.
- Ensure $\ge 48\text{px}$ touch targets on all buttons.

## 7. Accessibility & Live Announcements
- The score and feedback card must include `aria-live="polite"` so screen readers announce scores on reveal.
- Trigger light native haptics (`hapticLight()`) upon score reveal.
