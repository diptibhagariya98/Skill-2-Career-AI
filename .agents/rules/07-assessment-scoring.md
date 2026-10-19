---
trigger: always_on
description: Rules for assessment, score and feedback cards (interview answers, scorecards, resume ATS checks, quizzes): scoring math, layout, semantic colors, docked actions, announcements
---

# Assessment and Score Card Rules (Material 3 Expressive, Android 15/16)

Applies to Live Interview feedback, the interview scorecard, the resume ATS check, quizzes and any card that shows scores or metrics. Works in the native app and in the browser. Uses tokens (file 01) and components (file 02).

## 1. Score calculation (zero mismatch)
- One source of truth: a single central function computes the overall score from the same weights shown on screen. Screens only display its result.
- If a backend returns the score, display the backend value and verify it against the weighted formula. On a mismatch, report it with the evidence (file 05, section 7) and never hide it.
- Interview answer weights: Accuracy 40 percent, Context 35 percent, Confidence 25 percent. Weights shown on screen add up to 100.
- Formula: `round((accuracy * 0.40 + context * 0.35 + confidence * 0.25) * 10)`, with each dimension scored 0 to 10, giving 0 to 100.
- No hard-coded overrides. Never show 100/100 when the weighted sum is 97.5 or 98. A fully correct answer must have every dimension at 10/10 so the math is transparent.
- Depth penalty, for open-ended interview questions only: a one-word or very brief answer with no reasoning or constraints caps Confidence at 4/10 and Context at 3/10.
- Objective quick-practice questions (multiple choice or a single correct term) are scored on correctness. A correct answer gets 10/10 on every dimension and the depth penalty does not apply.
- Round once, at the end, with the same rounding on the card, in lists, in history and in exports.

## 2. Hierarchy and layout
- Score as the hero: the overall score is the largest element (28 to 32 px, emphasized weight), for example `98/100`, with one single-line pill: Strong answer, Good answer, Developing or Needs practice.
- Pill bands: 80 and above Strong, 65 to 79 Good, 50 to 64 Developing, below 50 Needs practice.
- Score headers and method names never wrap onto a second line. Put the method name (for example "Key-Point Blend") inside an expandable "How this was scored" row.
- Use full-width metric rows, not narrow columns. Below 412 px columns clip labels ("Confidenc"). Each row has the metric label with small supporting text ("40% weight") on the left, the score (`10/10`) on the right, and a thin progress track below (4 to 6 px, full radius, filled by percentage).
- Type: label in Label Large, score in Title Medium emphasized, supporting text in Body Small.

## 3. Semantic color thresholds
- 8 to 10 out of 10 (80 percent and above): success. 5 to 7 (50 to 79 percent): warning. Below 5 (under 50 percent): error.
- Use the semantic token roles with container and on-container pairs (file 01), reached through the project's token-backed classes. Never use raw palette classes such as emerald, amber or rose, and never use arbitrary accent colors for parallel metrics.
- Text uses the on-container color so it passes 4.5:1. Bars use the main role color.
- Color is never the only signal. Every score also shows its number and pill label.

## 4. Surfaces
- No cards inside cards inside cards. The outer area is the plain surface. Feedback blocks use a soft tonal container fill with no outline. Metric rows are filled low-emphasis rows with medium radius, separated by gap, not borders.
- No heavy shadows.

## 5. Action docking
- Continue actions ("Next question", "Finish interview") never scroll with the conversation. Dock a full-width bar above the bottom inset with one filled button and a one-line label.
- Add a secondary "Retry" text button for learning. All targets are at least 48 px.
- The navigation bar stays hidden during a session (file 02). On the last question the label is "Finish interview".

## 6. Feedback content
- Show "What went well", then "To improve" whenever any dimension is below 10, then a one- to three-line "Why" explanation. Offer an expandable "Model answer" for open-ended questions.
- Keep each block to one to three lines.

## 7. Resume ATS checks
- Every check reads real data and can fail: summary length within range, skills present and not empty, links valid (empty values are omitted, never "https://none"), dates consistent, bullets with measurable results, one to two pages, contact details complete.
- The label reads "X of Y checks passed", failed checks first, each with a fix action. Show "ATS ready" only when every check passes on real data.
- Step progress counts completed sections, not visited steps.

## 8. Accessibility, announcements and haptics
- The score and feedback container is a polite live region so the score is announced when it appears. Numbers carry units for screen readers ("98 out of 100").
- A light haptic plays on score reveal through the platform wrapper (file 08). It does nothing in the browser.
- The count-up animation lasts at most 600 ms and shows the final value immediately when reduced motion is on.

## 9. Checklist
- The score equals the weighted parts everywhere it appears.
- No wrap or clipping at 320 px and 200 percent font scale.
- Thresholds and colors are consistent across screens.
- The action bar is docked above the inset.
- The live region is present.
- Card, list and history show the same numbers.