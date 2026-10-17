# UI_UX_RESPONSIVE_RULES.md

**Project:** ResuMentor (Next.js + Tailwind CSS + Framer Motion, packaged in Capacitor as an Android APK)
**Purpose:** Every page and section must look right, feel right and work properly on every supported phone, and still be usable on tablet and desktop web.
**Read with:** `NEXTJS_RULES.md` (NJS), `CAPACITOR_RULES.md` (CAP), `FEATURE_GUARDRAILS.md` (FG), `PRODUCTION_READINESS_RULES.md` (PRD).

**Keywords:** MUST / MUST NOT = non-negotiable, a PR violating it is rejected. SHOULD = default, deviation needs a written reason.
Rule IDs use the prefix `UX-`.

---

## 0. TL;DR

1. **Design mobile first.** Write the base styles for a 360 px phone, then add `sm:`, `md:`, `lg:` for larger screens. (`UX-01`)
2. **No horizontal scrolling, ever**, at any width from 320 px up. (`UX-03`)
3. Use `dvh`, not `100vh`, and respect **safe areas** (notch, gesture bar). (`UX-04`, `UX-05`)
4. Touch targets are **at least 44x44 px** with space between them. No hover-only features. (`UX-20`, `UX-21`)
5. Inputs are **16 px or larger**, with the right keyboard type, and are never hidden by the keyboard. (`UX-30` to `UX-34`)
6. **Every screen has five states**: loading, empty, error, offline, success. (`UX-40`)
7. Motion is subtle, uses `transform`/`opacity`, and honours **reduced motion**. (`UX-50`)
8. Resume **preview and PDF are fixed A4 layouts**, separate from the responsive UI. (`UX-70`)
9. Nothing ships until the **device and width matrix** (section 14) passes. (`UX-90`)

---

## 1. Foundations

### UX-01: Mobile first, Tailwind breakpoints
- Base classes target phones. Add larger-screen overrides with Tailwind's min-width prefixes:

| Prefix | Min width | Typical use |
| :-- | :-- | :-- |
| (none) | 0 | Phones (design here first) |
| `sm:` | 640 px | Large phones, landscape |
| `md:` | 768 px | Tablets |
| `lg:` | 1024 px | Laptops |
| `xl:` | 1280 px | Desktops |

- MUST NOT use `max-*` or desktop-first overrides as the main strategy.
- The **primary target is the Android APK**. Web layouts for larger screens must be good, but never at the cost of the phone layout.

### UX-02: Supported screen sizes
Every page MUST work at these **viewport widths** (portrait unless stated):

| Width | Represents |
| :-- | :-- |
| **320** | Smallest supported (small/older phones) |
| **360** | Most common Android |
| **390 / 412** | Modern phones |
| **600 landscape / 800 landscape** | Phone rotated |
| **768** | Tablet portrait |
| **1024+** | Desktop web |

Also test **display/font scaling at 130 percent** (UX-12).

### UX-03: No horizontal overflow
- The page MUST NOT scroll sideways at any supported width.
- Never use fixed pixel widths on containers. Use `w-full`, `max-w-*`, flex and grid.
- Flex children that hold long text need `min-w-0` (and `truncate` or `break-words`), otherwise they push the layout wider.
- Wide content (tables, code, preview) scrolls **inside its own container** (`overflow-x-auto`), not the page.
- Add a global safety net during development only: temporarily outline elements wider than the viewport and fix them at the source. Do not hide the problem with `overflow-x: hidden` on `body`.

### UX-04: Viewport and height
- Set the viewport in the root layout (Next.js 14):

```tsx
// app/layout.tsx
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets us use safe-area insets
  // Do NOT set maximumScale: 1 or userScalable: false (blocks accessibility zoom)
};
```

- Use **`min-h-dvh` / `h-dvh`** (or `min-h-screen` with a `dvh` fallback) for full-height screens. `100vh` is wrong on mobile because browser and system bars change the visible height.
- The app shell is: header (fixed height), scrollable content area, optional bottom bar. **Only the content area scrolls.**

### UX-05: Safe areas (notch, status bar, gesture bar)
- With `viewportFit: "cover"`, add padding using `env(safe-area-inset-*)`:

```css
/* globals.css */
.pt-safe { padding-top: env(safe-area-inset-top); }
.pb-safe { padding-bottom: env(safe-area-inset-bottom); }
.pl-safe { padding-left: env(safe-area-inset-left); }
.pr-safe { padding-right: env(safe-area-inset-right); }
```

- Fixed headers, bottom tab bars, floating buttons and bottom sheets MUST include the matching safe-area padding.
- Verify on a phone with a gesture bar and, if available, one with a camera cutout. Content must never sit under the status bar or the gesture bar.

---

## 2. Layout and spacing

### UX-10: Page shell
Every page uses the same shell component so behaviour is consistent:

```tsx
export function PageShell({ title, children, bottomBar }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 pt-safe backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-screen-lg items-center gap-2 px-4">
          {/* back button, title, actions */}
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-lg flex-1 px-4 py-4 pb-24 md:px-6">
        {children}
      </main>

      {bottomBar}
    </div>
  );
}
```

- Side padding is at least **16 px** (`px-4`) on phones.
- Content max width is limited on large screens so lines and forms don't stretch.
- Reserve bottom padding so fixed bottom bars never cover the last element.

### UX-11: Spacing and sizing system
- Use Tailwind's spacing scale (multiples of 4 px). **No arbitrary magic numbers** (`mt-[13px]`) unless there is a reason.
- Consistent rhythm: related items 8 px apart, groups 16 px, sections 24 to 32 px.
- Use **rem-based** sizes (Tailwind default) so text and layout respond to font scaling.
- Prefer `gap-*` over margins between flex/grid children.

### UX-12: Font scaling and long content
- The layout MUST survive **130 percent font scale** and **long text**: a 40-character name, a very long email, a 3-line job title, German-length labels, emoji, and RTL text if supported.
- Buttons and labels may **wrap** or grow in height. Their text must never be clipped or overlap other elements.
- Truncate only where the full value is available elsewhere (use `truncate` with a title or details view).

### UX-13: Stacking and grids
- Multi-column layouts collapse to **one column on phones** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- Side-by-side buttons that don't fit stack vertically (`flex-col sm:flex-row`), with full-width primary actions on phones.
- Avoid layouts that depend on exact heights. Let content define height.

---

## 3. Typography and content

### UX-14: Type scale
- Body text **16 px** minimum (`text-base`). Secondary text no smaller than **14 px** (`text-sm`). Avoid 12 px except for non-essential captions.
- Headings use a defined scale (for example `text-2xl` page title, `text-lg` section title). One H1 per page.
- Line length for paragraphs: about 45 to 75 characters, which is naturally handled by `max-w-prose` on larger screens.
- Line height at least 1.4 for body text.
- Use a bundled font (NJS-11, CAP-11) with a system-font fallback. No remote font links.

### UX-15: Copy and microcopy
- Short, specific, friendly labels: "Download PDF", not "Submit".
- Error messages say **what happened and what to do next**. No codes or stack traces (PRD-03).
- Offline messages are calm and clear (see `UX-41`). Never blame the user.
- Dates, numbers and currency use locale-aware formatting, not hand-built strings.

---

## 4. Touch and interaction

### UX-20: Touch targets
- Every tappable element is **at least 44x44 px** (Tailwind `min-h-11 min-w-11`). Small icons get an invisible padded hit area.
- At least **8 px** between adjacent tappable elements.
- Primary actions sit in the **thumb zone** (bottom half of the screen) on phones where possible.

### UX-21: No hover dependency
- Nothing important may appear **only on hover**. Hover styles are an enhancement for desktop (`@media (hover: hover)` or Tailwind `hover:` on top of a working tap state).
- Every interactive element has distinct **default, pressed (`active:`), focus-visible, disabled and loading** states.
- Pressed feedback appears within about 100 ms.
- Add `touch-action: manipulation` on tappable controls to avoid double-tap-zoom delays.

### UX-22: Gestures
- Never make a gesture the **only** way to do something (swipe to delete, long press, pinch). Always provide a visible button alternative.
- Don't override the system back gesture/edge swipes.
- Horizontal swipe areas must not conflict with vertical page scrolling.
- Destructive actions need **confirmation or undo** (PRD-05).

### UX-23: Double taps and repeated actions
- Disable or show a loading state on buttons while an action is running. Double taps MUST NOT trigger duplicate saves, exports or AI calls (PRD-06).
- Long actions (PDF export, AI scoring) show progress and can be cancelled where possible.

---

## 5. Forms and keyboard

### UX-30: Inputs
- Font size **16 px or larger** in inputs (prevents unwanted zoom on iOS-based web views and feels right everywhere).
- Every input has a **visible label** (placeholder is not a label), correct `type`, `inputMode`, `autoComplete` and `enterKeyHint`:

```tsx
<label htmlFor="phone" className="mb-1 block text-sm font-medium">Phone</label>
<input
  id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
  enterKeyHint="next"
  className="h-12 w-full rounded-lg border px-3 text-base"
/>
```

- Use `type="email"`, `inputMode="numeric"` for marks/income, `type="date"` or a proper date picker, and avoid free text where a choice list is better.

### UX-31: Validation
- Validate **on blur and on submit**, not on every keystroke while the user is still typing.
- Show the error **next to the field** in text (not only colour), linked with `aria-describedby`, and move focus to the first invalid field on submit.
- Never clear what the user typed because of an error.

### UX-32: Keyboard avoidance
- The focused input MUST remain visible above the on-screen keyboard. Configure the Capacitor Keyboard behaviour for resize and test it on a real phone (CAP-10).
- On focus, scroll the field into view (`scrollIntoView({ block: "center" })`) if needed.
- Primary action bars that are `fixed` at the bottom must move with the keyboard or hide while it is open, so they never cover inputs.

### UX-33: Long forms (resume builder)
- Break long forms into **sections or steps** with clear progress, one topic per screen on phones.
- **Auto-save** with visible status ("Saved on this device") (NJS-16). Users never need to hunt for a save button.
- Preserve scroll position and open section when returning to a screen.
- Repeating groups (experience, education) have clear Add / Remove / Reorder controls with button alternatives to drag (UX-22).

### UX-34: Pickers and selects
- Use native or accessible pickers on mobile. Custom dropdowns must be touch-friendly, scrollable, keyboard accessible and fit within the viewport (use a bottom sheet on phones).

---

## 6. Navigation

### UX-35: Structure
- Phones: **bottom tab bar** for the 3 to 5 main areas (for example Home, Resume, Learn, Scholarships, Profile), with a visible active state and labels, not icons alone.
- Secondary screens: header with **back button** and clear title.
- Tablet/desktop: the same destinations may become a side navigation or top bar (`md:`/`lg:`), using the same route map (FG-10).
- Always give the user a way **back** and a way **home**. No dead ends.

### UX-36: Navigation behaviour
- Follow `FEATURE_GUARDRAILS.md` section 3 strictly: no surprise redirects, no navigation from background events, no leaving unsaved work.
- The Android **hardware back button** behaves predictably: closes sheets/modals first, then goes back a screen, and exits only from the root screen (CAP-10).
- Preserve state when switching tabs (do not reset forms or scroll unexpectedly).
- Highlight the current location; keep titles consistent with tab/menu names.

---

## 7. Required states for every screen

### UX-40: The five states
Every page and every data-driven section MUST design and test:

| State | Requirement |
| :-- | :-- |
| **Loading** | **Skeleton** or spinner shaped like the final layout, with no layout jump when data arrives. Local data should show instantly |
| **Empty** | Friendly message plus a clear next action ("Create your first resume") |
| **Error** | Plain-language message, **Retry** button, and the user's data untouched. Stays on the same screen (FG-14) |
| **Offline** | Calm banner or inline notice. Local features keep working. Online-only features explain themselves (UX-41) |
| **Success** | Clear confirmation (toast or inline) that doesn't block or navigate (FG-13) |

A PR adding or changing a screen MUST include screenshots or recordings of all five states at 360 px width.

### UX-41: Offline UX
- A small, non-blocking **offline pill/banner** appears when the connection drops and disappears when it returns. It never covers primary actions and never moves the layout unexpectedly.
- Offline-capable features show **no** error, spinner or warning because of being offline.
- Online-only features (AI ATS scoring, live jobs) are visibly marked and show a friendly message **before** attempting the call: "You're offline. Your resume is saved on this device. Connect to run AI scoring."

---

## 8. Feedback and motion

### UX-50: Animation rules (Framer Motion)
- Animate **`transform` and `opacity` only**. Avoid animating width, height, top, left, box-shadow and large blur filters.
- Durations: micro-interactions **150 to 250 ms**, screen transitions **200 to 350 ms**. Use gentle easing. No bouncy or long animations in core flows.
- Always honour reduced motion:

```tsx
import { useReducedMotion, motion } from "framer-motion";

const reduce = useReducedMotion();
<motion.div
  initial={reduce ? false : { opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: reduce ? 0 : 0.2 }}
/>
```

- Keep animated trees small. No animation inside long lists. Test on a **low-end Android phone**: if it drops frames, remove the animation (NJS-17).
- Animations never block input. Users can tap during transitions.
- `AnimatePresence` exit animations must not delay navigation noticeably.

### UX-51: Toasts, banners and dialogs
- Toasts auto-dismiss (3 to 5 s), are readable, don't cover bottom bars (account for safe area), and can't stack endlessly.
- Use dialogs sparingly. A dialog needs a title, a clear primary action and a clear way to cancel.
- Errors that need action use inline banners, not toasts that vanish.

---

## 9. Images and media

### UX-60: Images
- Always set **width/height or an aspect ratio** to prevent layout shift.
- Profile photos: compress and downscale on selection (CAP-13), show a **placeholder** while loading and a fallback when missing, and crop with `object-cover`.
- Static export uses unoptimised images (NJS-03). Pre-optimise assets (right size, modern format) before committing.
- Use `loading="lazy"` for off-screen images and give meaningful `alt` text (empty `alt=""` for decorative).
- Replace plain `<img>` warnings consciously: either use `next/image` with `unoptimized` in the mobile build or keep `<img>` with explicit sizes and a documented reason.

### UX-61: Icons and graphics
- One icon set, consistent stroke and size (24 px default). Icons that carry meaning have a text label or `aria-label`.
- Prefer SVG. Never rely on colour alone to convey meaning.

---

## 10. Overlays, sheets and modals

### UX-62: Behaviour
- On phones, prefer **bottom sheets** over centred modals for choices, filters and templates.
- Overlays have `max-height` in `dvh` (for example `max-h-[85dvh]`), scroll **inside**, include safe-area padding and lock the background scroll.
- Focus is trapped inside, returns to the trigger on close, and **Esc / Android back button** closes the top overlay first (UX-36).
- A visible close button (44 px target) is always present. Tapping outside closes it unless data would be lost.
- Never stack more than two layers of overlays.

---

## 11. Lists, tables and data

### UX-63: Lists
- Long lists (quiz questions, jobs, schemes) are **paginated or virtualised**, never rendered all at once.
- List rows are full-width tappable cards with 44 px or more height, clear primary text and supporting text.
- Keep scroll position when returning to a list.

### UX-64: Tables
- Tables don't fit phones. Use **stacked cards** below `md:` (label/value pairs) and a real table from `md:` up, or horizontal scroll inside a container with a visible hint.
- Numeric columns are right-aligned and use tabular numbers.

---

## 12. Theming and accessibility

### UX-65: Theme tokens
- Colours, radii, shadows and spacing come from **design tokens** (Tailwind theme / CSS variables). No hard-coded hex values in components.
- If dark mode is supported, every screen is tested in both modes. If not supported, lock to light and declare it.
- Text contrast **at least 4.5:1** (3:1 for large text and UI components).
- Status colours (error, success) always paired with an icon or text.

### UX-66: Accessibility baseline
- Semantic HTML (`button`, `a`, `nav`, `main`, `header`, `label`, `ul`). No clickable `div`s.
- Visible **focus** styles (`focus-visible:`) that meet contrast.
- Icon-only buttons have `aria-label`. Dynamic messages use `aria-live` (toasts, form errors).
- Do not disable pinch zoom. Support font scaling (UX-12).
- Check key screens with an automated tool (axe) and a quick TalkBack pass on Android (PRD-11).

---

## 13. Performance as UX

### UX-67
- No layout shift after load (skeletons, reserved image space, stable fonts).
- Input latency: typing never lags. Heavy work (ATS scoring, filtering, preview rendering) is debounced, deferred or moved off the critical path (`useDeferredValue`, `startTransition`, web worker where justified).
- Screens render useful content in under **~1 s** from local data on a mid-range phone.
- Heavy libraries (PDF engine, charts) are lazy-loaded, with a loading state when first used (NJS-09, NJS-17).

---

## 14. Resume builder and PDF specifics

### UX-70: Editor vs preview vs PDF
- The **editor UI is responsive**. The **resume preview and PDF are fixed-size A4 layouts** (about 794 x 1123 px at 96 DPI) so they look identical on every device and in the exported file.
- On phones, show the preview **scaled to fit the screen width** (CSS `transform: scale(...)` with computed scale, or a container with fixed A4 width inside a scaled wrapper), with pinch/scroll to inspect, and never reflow the A4 layout to the phone width.
- PDF generation renders from the fixed A4 container, independent of the current screen size, orientation or font scale.
- Templates are tested with: very long content (multi-page), minimal content, long words and URLs, missing photo, and special characters or emoji.
- Page breaks never cut a heading from its content or a line of text in half.
- Template switching MUST NOT lose or alter user data.

---

## 15. Page-by-page requirements

Every route and major section needs a row in this table (kept in the repo and updated in the PR that changes the screen). The routes below match the current build (`/`, `/auth`, `/login`, `/dashboard`, `/_not-found`); add rows as features grow.

| Page / section | Must work properly |
| :-- | :-- |
| **Home / landing (`/`)** | Clear value and primary action above the fold at 360x640. Works offline. Content readable at 130% font |
| **Login / Auth (`/login`, `/auth`)** | Correct keyboards, no zoom on focus, errors beside fields, works with password managers, sign-in flow works inside the WebView (CAP-17), no redirect loops (FG-12), offline gives a friendly message and does not block local features |
| **Dashboard (`/dashboard`)** | Single-column cards on phones, skeleton while loading, empty state with first action, all five states (UX-40). The 58 kB route is lazy-loaded where possible |
| **Resume editor** | Sectioned, auto-save visible, keyboard never hides the field, add/remove/reorder with buttons, back button safe with unsaved changes |
| **Template picker** | Bottom sheet or grid of 2 columns on phones, previews load lazily, switching never loses data |
| **Resume preview / PDF export** | Fixed A4 preview scaled to fit (UX-70), export progress, success and failure states, share sheet works, works offline |
| **ATS scoring** | Offline notice before the call, progress, timeout and error with Retry, result readable on 320 px |
| **Quizzes** | One question per screen, large answer buttons, instant feedback, progress visible, review screen, resumes after app is killed |
| **Scholarship check** | Short form with proper input types, results as readable cards, clear eligible / not eligible / needs-info states, works offline |
| **Roadmaps** | Collapsible stages, large checkboxes, progress saved locally |
| **Jobs (online)** | Cached list offline with a notice, skeletons, pagination, error + Retry |
| **Profile / settings** | Photo upload with compress + placeholder, backup export/import, clear destructive-action confirmations |
| **Offline banner / toasts** | Never cover content or bottom bar, never shift layout, announce to screen readers |
| **Not found / error pages** | Friendly message, a button to go home, never a blank screen |

---

## 16. Testing: device and width matrix

### UX-90: A screen is not done until it passes this

**Widths (portrait):** 320, 360, 390/412, 768, 1024. **Landscape:** 640 x 360 minimum.
**Conditions:** font scale 100% and 130%, light and dark (if supported), airplane mode, keyboard open.

| Check | Pass |
| :-- | :-- |
| No horizontal scroll at any width | ☐ |
| Nothing hidden under status bar, notch, gesture bar | ☐ |
| All tap targets 44 px or larger, spaced | ☐ |
| Keyboard never covers the focused field or the submit button | ☐ |
| All five states (UX-40) look right | ☐ |
| Long names, long text, empty fields, emoji do not break layout | ☐ |
| Back button / swipe-back behaves as in UX-36 | ☐ |
| No surprise redirect or navigation (FG-11 to FG-16) | ☐ |
| Rotation keeps data and scroll position, with no crash | ☐ |
| Animations smooth on a low-end phone, with reduced motion respected | ☐ |
| Works fully offline where required (UX-41) | ☐ |
| Contrast and focus visible, labels present | ☐ |

### Automated viewport checks (Playwright)

```ts
// tests/responsive.spec.ts
import { test, expect } from "@playwright/test";

const widths = [320, 360, 412, 768, 1024];
const routes = ["/", "/login/", "/auth/", "/dashboard/"];

for (const width of widths) {
  for (const route of routes) {
    test(`no horizontal overflow: ${route} @${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);
    });
  }
}
```

- Also run: offline mode (`context.setOffline(true)`), an axe accessibility scan on key routes, and screenshot comparisons for the states of each key screen.
- Real-device checks (low-end Android first) are mandatory before each APK (CAP-30, PRD-12).

---

## 17. Review checklist and anti-patterns

### Reviewer checklist (UI changes)
- [ ] Mobile-first classes, no fixed widths, no horizontal scroll (UX-01, UX-03)
- [ ] `dvh` and safe areas handled (UX-04, UX-05)
- [ ] Touch targets, spacing, no hover dependency (UX-20, UX-21)
- [ ] Inputs: labels, types, 16 px, keyboard-safe (UX-30 to UX-32)
- [ ] All five states with screenshots at 360 px (UX-40)
- [ ] Motion is light and respects reduced motion (UX-50)
- [ ] No unrelated shared component changes (FG-09)
- [ ] Row for this screen in the page table (section 15) updated
- [ ] Matrix in UX-90 completed

### Anti-patterns (reject on sight)

| Anti-pattern | Why it hurts | Do this instead |
| :-- | :-- | :-- |
| `h-screen` / `100vh` for full pages | Content hidden behind browser/system bars | `min-h-dvh` (UX-04) |
| `overflow-x-hidden` on `body` to hide overflow | Hides the bug and clips content | Find and fix the wide element (UX-03) |
| `maximum-scale=1` / `user-scalable=no` | Blocks zoom, accessibility failure | Remove it (UX-04) |
| Placeholder used as the label | Disappears when typing | Visible `<label>` (UX-30) |
| Fixed bottom button over the keyboard | Covers inputs | Keyboard-aware bar (UX-32) |
| Hover menus and tooltips as the only access | Impossible on touch | Tap/press alternative (UX-21) |
| 32 px icon buttons side by side | Mis-taps | 44 px targets, 8 px gaps (UX-20) |
| Animating `height`/`width`/`top` | Jank on low-end phones | `transform`/`opacity` (UX-50) |
| Table forced into a phone screen | Unreadable | Stacked cards (UX-64) |
| Resume preview that reflows with screen size | PDF differs from preview | Fixed A4 + scale (UX-70) |
| Spinner forever with no error state | Looks frozen | Timeout, error, Retry (UX-40) |
| Toast on success that also navigates away | Disorients the user | Toast only (FG-13) |
