---
trigger: model_decision
description: Rules for running the mobile-first app correctly in normal browsers, adaptive layout without a website look, and the styling system (CSS structure, tokens, z-index, overflow). Use for any layout, responsive or browser work.
---

# Browser Compatibility, Adaptive Layout and Styling

The product is a mobile app first. The same screens also run in ordinary browsers (phone and desktop). The browser gets the same app, adapted, not a separate website design. Device capabilities and their browser fallbacks follow files 08 and 09.

## 1. Strategy
- One codebase, one set of screens. The 360 px phone layout is the design. Everything else is an adaptation.
- Mobile first CSS: base styles describe the compact phone. Wider layouts are added with `min-width` queries. No desktop-first overrides with `max-width` stacks.
- Breakpoint tokens: 600 (medium) and 840 (expanded) only, plus 1200 for very wide screens. Do not invent more.
- Prefer container queries for components that live in panes or columns. Provide a fallback so older browsers still render a sane single column.
- Use feature detection and `@supports`, never user agent sniffing.
- Support the latest two major versions of Chrome, Edge, Firefox and Safari, and Android Chrome and iOS Safari.

## 2. How wide screens look (not a website)
- Below 600: full-bleed app, bottom navigation bar, one pane.
- 600 to 839: navigation rail on the start side, content in a centered column (max 560 for forms and flows, 720 for lists and detail), the area outside the column uses the surface-dim token.
- 840 and up: navigation rail, content column max 840. List-detail two pane only for screens that already have a detail view (lists with a selected item). Never invent extra columns.
- Never stretch cards, forms, buttons or text lines across a 1280 or 1920 px window. Line length stays under about 75 characters.
- Never show website patterns: hero banners, footers with link columns, mega menus, breadcrumb trails, cookie-style top bars.
- Focused flows (interview, chat, forms, onboarding) use the centered column with no rail, with a clear close or back control.
- The top app bar, bottom bars and sheets align to the content column, not to the window edges. Modal sheets become centered dialogs of max width 560 on 600 and up.
- Do not render a fake phone frame. Adapt the layout instead.

## 3. Native wrapper vs browser runtime
- The platform wrapper reports the runtime (native or browser) and provides fallbacks. Screens never check the runtime themselves and never call native plugins directly.
- Fallbacks: haptics do nothing. Share uses the browser share feature if present, otherwise copy link with a snackbar. File export uses a download. Back uses browser history. Dialogs use the app dialog component. Status bar color uses the theme color meta. Splash does not exist. Permissions use the browser prompts and denial states are handled.
- The capability table in file 08 is the source of truth for each fallback.
- Missing capability never throws. Wrap every call, return a safe result, and show a clear message when a feature is unavailable.
- Safe area uses `env(safe-area-inset-*)` with `0px` fallback. Keyboard uses the visual viewport.
- Zoom: in the browser, never disable zoom. Only the native wrapper may. Content must reflow at 400 percent zoom with no horizontal scroll at 320 CSS px.

## 4. Pointer and input differences
Treat touch, mouse, pen and keyboard as equals.
- Hover styles only inside `@media (hover: hover) and (pointer: fine)`. Hover state layer 8 percent. Pointer cursor on interactive elements only there.
- Icon-only buttons show a tooltip on hover and focus for fine pointers only. Touch uses a long press label.
- Hide scrollbars only for coarse pointers. On desktop show a thin, themed scrollbar. Never double scrollbars (page plus inner container).
- `user-select: none` applies to app chrome on coarse pointers only. Content text stays selectable in the browser. Right click is not blocked.
- Targets stay 48 px for touch. Fine pointers may use compact density only if a density token exists. Do not shrink targets by default.
- Inputs: text inputs use a minimum 16 px font size so mobile Safari does not auto-zoom. Support autofill and password managers (correct `type`, `name`, `autocomplete`). Date and time inputs may use the browser picker. Test file inputs.
- Drag gestures (swipe, sheets, pull to refresh) also work with mouse, and always have a visible control alternative.

## 5. Keyboard and focus (browser accessibility)
- Everything reachable and operable by keyboard in visual order. Enter and Space activate buttons. Arrow keys move in tabs, menus, segmented controls, lists with selection.
- Escape closes the topmost overlay using the same stack as back handling (file 03).
- Visible focus ring on `:focus-visible`: 2 px primary outline with 2 px offset, never removed without a replacement. Mouse clicks do not show the ring.
- Dialogs and sheets trap focus, set initial focus, and return focus to the trigger.
- The scroll container is focusable when needed so Page Up, Page Down, Space and arrow keys scroll it.
- Skip repeated navigation with a skip link only where a persistent rail or long header exists.

## 6. Navigation and URLs in the browser
- Every route is directly loadable and survives refresh. If a route needs state that does not survive refresh, redirect to its parent with a clear message instead of a blank screen.
- Browser back and forward behave like in-app back. Overlays create history entries so back closes them first.
- Internal navigation never triggers a full page load. External links open in a new tab with safe rel values, and are clearly marked.
- The document title updates per screen. Set the theme color meta to the surface token for the active theme.
- No state loss on window resize or rotation. Layout reacts live.

## 7. Styling system
- Layers, in order: reset and base, tokens (file 01), layout primitives, components, screens. A rule lives in exactly one layer.
- Tokens only. No raw colors, radii, shadows, durations, easings or spacing outside the token layer.
- Low specificity: class selectors, flat, at most 3 levels deep. No ID selectors, no `!important` (the reduced motion override is the only exception), no inline style except dynamic values passed as CSS variables (for example a progress width).
- Layout with flex and grid and `gap`. No floats, no layout with margins between siblings, no absolute positioning for normal flow.
- Fluid sizing with `min()`, `max()`, `clamp()`, `minmax()`, `aspect-ratio`. Avoid fixed widths. Avoid fixed heights on anything holding text.
- Flex and grid children that contain text need `min-width: 0` so truncation and wrapping work. Use `overflow-wrap: anywhere` for user content, `line-clamp` for titles and descriptions, and an ellipsis for truncated text.
- Logical properties (`padding-inline`, `margin-block`, `inset-inline-start`) everywhere for RTL readiness.
- Use `100dvh` or `100svh`, never `100vh`. Use sticky positioning over fixed where possible. Fixed bars must account for insets and the keyboard.
- z-index tokens only: content 0, sticky 10, bars 20, FAB 30, scrim 40, sheet 50, dialog 60, snackbar 70. No numbers like 9999.
- Overlays render at the root, lock body scroll while open, and restore scroll on close.
- Reserve space for async content (images with dimensions or aspect-ratio, skeletons at final size) so nothing shifts after load.
- Animate transform and opacity only. Honor reduced motion.
- Dark mode is a token swap, never separate overrides in components.
- Delete dead CSS and unused classes found during audits. Keep component styles next to the component, screen styles next to the screen, and shared styles in the shared layer.
- Print: only the resume preview needs a print layout (light background, no bars, page margins). Everything else may ignore print.

## 8. Browser audit matrix
For every screen, check:
- Viewports: 360x800, 412x915, 600x960, 840x1180, 1280x800, 1920x1080.
- Input: touch emulation, then mouse and keyboard only.
- Browsers: Chrome, Firefox, Safari (desktop and iOS), Edge, Android Chrome.
- Actions: refresh on the screen, open the URL in a new tab, browser back and forward, window resize, rotate, zoom to 200 and 400 percent, text-only zoom, system dark mode toggle.

## 9. Browser anti-patterns (fail on any)
- A bottom navigation bar or action bar stretched across a 1920 px window.
- Cards, inputs or buttons stretched edge to edge on desktop.
- A tiny phone layout floating in a huge empty window with no background treatment.
- Hover-only features, missing focus rings, mouse-only gestures, a keyboard trap.
- Refresh or deep link shows a blank page or loses the user's place.
- A native-only API call that throws in the browser.
- Disabled zoom in the browser, horizontal scroll at 320 px, double scrollbars.
- Browser alert, confirm or prompt dialogs.
- Fixed bars covering content, or content hidden under the iOS Safari toolbar.
- Different visual design for desktop than for mobile for the same screen.

## 10. Browser acceptance checklist
- Phone layout unchanged and correct at 360 and 412.
- 600, 840, 1280 and 1920 show the adaptive layout with correct column widths, rail and centering.
- Fully usable by keyboard and by mouse. Focus rings visible. Escape and Enter work.
- Refresh, deep link, back and forward work on every screen.
- No horizontal scroll at 320 CSS px, including at 400 percent zoom.
- No console errors or warnings, no hydration or layout shift problems, and no plugin errors in the browser.
- Same screens, same components, same tokens as the phone. Only layout adapts.
