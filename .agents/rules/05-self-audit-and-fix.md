---
trigger: model_decision
description: Self-audit and fix protocol for every module, screen, page and shared component. Mobile-first, browser-safe. Use when auditing, restyling or reviewing any UI work.
---

# Self-Audit and Fix Protocol

Applies to every module, screen, page and shared component. Works with files 00 to 04 (native feel), 06 (browser and styling), 07 (assessment cards), 08 and 09 (native bridge and capabilities) and 10 (native gap audit). The app is mobile first and must also run correctly in a normal browser.

## 0. Guardrails
- Packages and tools: install only with the protocol in file 08, when a feature needs a native or web capability. Avoid UI kits that conflict with the design tokens.
- Do not change business logic, API contracts, data models or auth while auditing UI. Fixing a broken native or browser integration (export, share, storage, permissions, back, insets) is in scope. Native project files change only as file 08 allows.
- If a wrong value on screen comes from business logic (for example a total that does not match its parts), do not silently change the logic. Record it with evidence in the report. Fix only the presentation layer.
- Do not hide problems. Never "fix" with `overflow: hidden`, `display: none`, shrinking fonts, fixed heights, `!important` or magic numbers.
- Smallest safe change. Keep behavior. Do not rewrite unrelated code.

## 1. When to run
- Before starting any UI task (audit first), after finishing it (verify), and whenever the user says audit, review or fix screens.
- Run per module, then once across the whole app for consistency.

## 2. Build the inventory first
List everything that renders UI before fixing anything. Sources: route tree, navigation config, layout files, component folders, modal and sheet registries.
- Module → screens → pages → states → shared components used.
- Include entry and edge screens: splash, login, sign up, onboarding, permission prompts, empty, error, offline, 404, session expired, maintenance.
- Include overlays: dialogs, sheets, menus, search views, pickers.
- Create one task per screen in the task list. Order by user impact: entry flow, home, core features, secondary, settings, edge screens.
- Keep the inventory in the task list and the final report. Do not add tracking files to the repo unless asked.

## 3. The loop (per screen, max 3 passes)
1. Observe. Render the screen in every state and every viewport in section 5.
2. Record evidence. For each issue: screen, viewport, state, symptom, rule violated (file and section), severity.
3. Fix in severity order. Prefer fixing the shared component or token over the screen. If the same issue appears in 3 or more places it is a component or token bug.
4. Re-verify the same viewports and states. Check every other usage of any shared component you changed.
5. Log the result. Mark the screen Fixed, Blocked or Needs decision.
- Stop after 3 passes on one issue. Document it and move on.
- If a fix needs business logic, API or backend changes, mark it Blocked and put it in the report as a recommendation. Native fixes follow file 08. Missing external configuration (for example push or sign-in credentials) is Blocked with the exact item needed.

## 4. Severity
- Critical: blocks the core action or breaks trust. Examples: input hidden behind a bar, control unreachable, overlap with system bars, wrong or inconsistent numbers, crash, dead end or back trap, personal data shown to the wrong user, fake or test data in real fields.
- High: layout breakage. Examples: clipped or wrapped labels, horizontal overflow, covered content, two primary actions competing, stacked chrome, missing states, tap targets under 48 px.
- Medium: visual inconsistency, low contrast, hard-coded values, wrong component variant, missing ripple or focus state, weak hierarchy.
- Low: polish, motion, copy tweaks, optional haptics.

## 5. Observe matrix
Viewports (CSS px, width x height): 320x568, 360x800 (primary), 412x915, 600x960, 840x1180, 1280x800.
States: loading, empty, populated, error, offline, long content, very long single words, keyboard open, scrolled, overlay open.
Modes: light, dark, font scale 1.0, 1.3, 2.0, reduced motion, touch input, mouse and keyboard input.
Rule: the 360x800 phone is the design. Everything else must degrade or expand gracefully from it. Fix the phone first.

## 6. Audit lenses (tick every one for every screen)
A. Anatomy: status bar inset, one app bar, one scroll container, at most one filled primary action, no duplicated headings or back arrows, no stacked toolbars, navigation bar hidden in focused flows.
B. Layout: no overflow at 320, nothing clipped, nothing hidden behind bars, keyboard does not cover fields, flex children can shrink, text containers have no fixed heights.
C. Text: sentence case, type scale tokens, minimum sizes, no mid-word or mid-sentence clipping, buttons, chips, tabs and badges stay on one line, truncation uses an ellipsis.
D. Color: tokens only, 4.5:1 text contrast, both themes, color is not the only signal, consistent semantic colors.
E. Components: shared component used, correct variant, size and radius from tokens, ripple, disabled and error states, no ad hoc lookalikes.
F. States: loading skeleton, empty with action, error with retry, offline, success feedback. No blank screens, no infinite spinners.
G. Navigation: central back handling, overlays close first, titles match destinations, deep link and refresh land correctly, scroll position restored.
H. Forms: correct input types and keyboards, labels not placeholders, validation on blur and submit, no prefilled fake values, required marking consistent, submit disabled or loading while pending.
I. Data display sanity (see section 7).
J. Perceived speed: skeleton in final layout, no layout shift, no white flash, instant press feedback.
K. Accessibility: names for icon buttons, focus order, focus return, live regions, 48 px targets, reduced motion.
L. Copy: plain wording, consistent terms for the same concept, no jargon or internal names, no "undefined", "null", "NaN" or "[object Object]".
M. Native features: every control that depends on a device capability (export, share, file pick, camera, notifications, sign-in, storage) works on Android, in the mobile browser and in the desktop browser, shows honest progress, and shows a clear message when unavailable (files 08 and 09). Run the native gap audit in file 10 for every audit: inventory the features, scan for web-only APIs, check setup and configuration, and fill the native feature matrix.

## 7. Data display sanity checks
Wrong numbers destroy trust faster than ugly layout. For every screen with numbers, dates or statuses:
- Totals equal the sum or weighted result of the parts shown. Show the same rounding everywhere.
- Percentages stay between 0 and 100. Weights shown add up to 100.
- Counts match the number of items listed. Badges match underlying counts.
- The same entity has the same name, status and value on every screen.
- No placeholder, guest, lorem or test values in real data fields.
- Dates, times, currency and numbers follow the device locale and time zone.
- Plurals are correct ("1 question", "2 questions"). Empty values show a dash or a clear empty state, never blank.
- A displayed unit always accompanies its number.
- Scores, progress and statuses update immediately after the action that changes them, without a refresh or restart.

## 8. Module-level consistency pass
After individual screens, compare across the module and the app:
- The same job uses the same pattern: lists, detail headers, confirm dialogs, empty states, step flows, filters, pickers.
- The same action has the same label, icon and position everywhere.
- Back path is coherent from every entry point.
- Section titles, tab names and navigation labels use one vocabulary.
- Spacing rhythm, card style and button hierarchy are identical for equal roles.
Fix inconsistencies in the shared component, not per screen.

## 9. Shared component pass
- Search for near duplicates (several button, card, chip, sheet or input implementations). Merge into one and migrate call sites.
- Components take props for variants, never one-off style overrides.
- Each component works at 200 percent font scale, in dark mode, with long text, with RTL, and with touch and mouse input.
- Changing a shared component requires re-checking every screen that uses it.

## 10. Self-check searches (use the existing search tool and scripts only)
Search the changed and in-scope files for these patterns and fix or justify each hit. Also run the web-only API scan in file 10, section 3:
- Hard-coded hex or rgb colors, pixel radii, shadows, durations and easings outside the token file.
- Fixed `height` on text containers, `100vh`, `overflow: hidden` near text.
- `alert(`, `confirm(`, `prompt(`, `target="_blank"`, plain anchor navigation between app screens.
- Click handlers on non-interactive elements without role, key handling and focus.
- `outline: none` without a replacement focus style.
- Icon-only buttons without an accessible name.
- Direct plugin or native API calls outside the platform wrapper.
- Uppercase text styling, `!important`, inline style blocks, magic z-index numbers.
- Raw `undefined`, `null` or `NaN` rendering risks in templates.
Also run the type check, lint and build commands the project already defines, and after any plugin change the sync and build steps in file 08. Do not add new lint or build tooling unless the task asks.

## 11. Progress and acceptance
Per screen status: Not started, In progress, Fixed, Blocked, Needs decision.
A screen is Fixed only when: zero Critical and zero High issues remain, Medium issues are fixed or documented, all lenses in section 6 are ticked, and it passes the checklist in file 04 and the browser checklist in file 06.
The whole task is done only when every inventoried screen is Fixed or Blocked with a reason, and the consistency passes in sections 8 and 9 are complete.

## 12. Report format
- Summary counts by severity: found, fixed, remaining.
- Table: screen | issues found | fixed | remaining or blocked.
- Shared component and token changes, each with the list of affected screens.
- Packages, plugins and native edits (name, version, reason, files touched, sync and build result).
- Native feature matrix and gaps (file 10), with device-verified and unverified items kept separate.
- Data display problems found, with the evidence (the values shown and the expected values).
- Blocked items and why, with the recommended owner (backend, native, design).
- Regression risks and how to verify them.
- Anything skipped on purpose.
Keep it short, factual and in this order.
