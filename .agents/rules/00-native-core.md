---
trigger: always_on
description: Core rules for a native Android 15/16 look and feel in a Next.js + Capacitor app
---

# Native UI Core Rules (Android 15/16, Material 3 Expressive)

Files in this set: 00 core (this), 01 design tokens, 02 components, 03 navigation, insets, gestures, 04 performance, accessibility, quality gate. Read 00 always. Read the others when the task touches them.

## 0. Hard guardrails
- Packages & Plugins: Installing NPM packages and Capacitor plugins (e.g., `@capacitor/filesystem`, native device APIs) is permitted and required when needed to implement mobile integration, native features, and web capabilities. Run `npx cap sync` to synchronize plugins with native platforms.
- Native Android build files: DO NOT manually edit internal native Android project files, `AndroidManifest.xml`, Gradle scripts, or native generated build artifacts unless the task explicitly names them. Let Capacitor manage native plugin linkage.
- Visual components: Maintain the single in-house Material 3 Expressive token & component layer; do not install competing visual UI kits that duplicate or conflict with design tokens.
- Do not change business logic, API contracts, data models or auth while restyling. UI and UX only.
- Work audit-first: read the screen, list issues by severity (critical, high, medium, low), then fix in that order.

## 1. Goal and honesty
- Target: at normal use the app is indistinguishable from a Kotlin Compose app on Android 15 and 16 using Material 3 Expressive.
- A WebView cannot be 100 percent native. Match what users notice: layout, type, color, shape, motion, back behavior, insets, keyboard, haptics, ripple, system bars, dialogs.
- Use real native plugins (dialogs, haptics, share, status and navigation bars, keyboard, splash, date and time pickers) where they exist. Use web UI only where native has no equivalent.
- A screen that looks like a website fails review even if it is functional.

## 2. Stack roles (recommendation)
- Next.js: build-time only. Static export. It produces plain HTML, JS and CSS that Capacitor serves from the app bundle.
- Capacitor: the native shell and the bridge to native features.
- Styling: CSS variables as design tokens (file 01) consumed by the existing styling system (utility classes, CSS modules or plain CSS). Do not introduce another styling system.
- Components: one in-house native component layer (buttons, fields, sheets, bars) built on the tokens. Do not mix in a second visual component library. Headless behavior helpers already in the project (focus trap, dialogs, menus) may be reused and must be restyled to Material 3.
- Platform code: one wrapper module (for example `platform`) is the only place that imports Capacitor plugins. It exposes small functions (haptic, share, confirm, setBarStyle, onBack) and web fallbacks, so screens never touch plugins directly and the web build still runs.

## 3. Next.js rules for a Capacitor app
- Static export only. No server actions, route handlers, middleware, rewrites, ISR, runtime image optimizer or anything that needs a Node server at runtime.
- Every screen is a client component that renders instantly from cached or skeleton state, then fetches data over HTTPS from the remote API.
- Images: unoptimized and pre-sized. Use pre-compressed formats and explicit width and height to avoid layout shift.
- Dynamic routes: use query params or ids in client state. If route params are required for export, keep the param list small and known.
- Navigation is client-side only (router push, replace, back). Never use hard page loads or plain anchor navigation between app screens. A full reload shows a white flash and resets state.
- The root layout is the persistent app shell (top bar slot, content scroller, navigation bar). It must not remount between routes.
- No `window`, `document` or plugin access during render. Guard with effects or the platform wrapper.
- Use `100dvh` and never `100vh`. The Android WebView URL bar does not exist, but dynamic height still matters with the keyboard.

## 4. Document and viewport baseline
- Viewport: `width=device-width, initial-scale=1, viewport-fit=cover`. Disable pinch zoom (native apps do not pinch zoom) but never lock text scale. Use rem units so system font size changes flow through.
- `html, body` fill the screen, `overflow: hidden`, no body scroll. Scrolling happens in one explicit content container per screen (file 03).
- Background of `html` equals the surface token so overscroll and rotation never flash white.
- `color-scheme: light dark`. Support system dark mode and a manual override via a `data-theme` attribute.
- Set `data-platform="android"` on the root and gate Android-specific rules on it.

## 5. Remove web-isms (apply globally)
```css
* { -webkit-tap-highlight-color: transparent; }
html, body { overscroll-behavior: none; touch-action: manipulation; }
body { user-select: none; -webkit-touch-callout: none; }
input, textarea, [contenteditable], .selectable { user-select: text; }
img { -webkit-user-drag: none; }
:focus:not(:focus-visible) { outline: none; }
::-webkit-scrollbar { display: none; }
```
- No hover-only information, tooltips or cursor styles. Hover states are ignored on touch.
- No browser dialogs (`alert`, `confirm`, `prompt`). Use the app dialog component or the native dialog through the wrapper.
- No visible text cursor handles on non-input text. No right-click menus.
- No horizontal page scroll at any width from 320 to 600 px.
- Selectable text is allowed only for content users copy (codes, addresses, resume text).

## 6. Screen anatomy (every screen)
1. System status bar area (transparent, inset padded).
2. Top app bar (file 02).
3. Content scroller: one scroll container, padded for bars, insets and FAB.
4. Optional sticky bottom action bar or navigation bar.
- Never stack more than two persistent bars above the content (system bar excluded). Merge toolbars into the app bar.
- Primary screen action: exactly one filled button or one FAB per screen.
- Focused flows (live interview, chat, forms, checkout, onboarding) hide the navigation bar and show a close or back control plus a clear step indicator.
- Each screen has loading (skeleton in the final layout), empty, error with retry, and offline states. A blank screen is a bug.

## 7. Content rules
- Sentence case everywhere. No ALL CAPS badges or labels (Material labels are sentence case).
- Button labels are short verbs ("Download", "Continue"). One line only. Never wrap a button label, chip, badge or tab label. Truncate or shorten instead.
- Do not prefill forms with fake or guest values. Use empty fields with a floating label and, if useful, short supporting text.
- Use plain, human error messages with the fix ("Enter a valid email"), not codes.
- Numbers, dates and currencies follow the device locale.

## 8. Layout robustness
- No fixed heights on anything containing text. Use `min-height`, padding and flex or grid so text can wrap at 200 percent font scale.
- Test at widths 320, 360, 412, 600 and 840, and at font scale 1.0, 1.3 and 2.0.
- Use `line-clamp` for titles and descriptions with a defined max line count. Never clip text mid-sentence without an ellipsis.
- Use `gap`, not margins, between siblings. Use logical properties (`padding-inline`) for RTL readiness.
- Window size classes: compact below 600, medium 600 to 839, expanded 840 and up (file 03 for layout changes).

## 9. Definition of done (short form)
A screen is done only when all are true: tokens only (no hard-coded colors, sizes or radii), 48 px touch targets, back works through the central handler, insets respected on gesture and 3-button navigation, dark mode checked, font scale 2.0 checked, keyboard open checked, all four states built, no console errors, and the full checklist in file 04 passes.

## 10. Reporting format (end of every task)
Return: what changed per screen, which rule files applied, anything skipped and why, native-side recommendations not applied, and any remaining risks. Keep it short.
