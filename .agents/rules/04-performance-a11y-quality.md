---
trigger: model_decision
description: Performance budgets, accessibility, anti-patterns and the quality gate checklist for the native-feel Next.js + Capacitor app
---

# Performance, Accessibility, Anti-patterns, Quality Gate

Meet these rules with the project's existing code first. If a rule needs a native or web capability that is missing, add it with the protocol in file 08 and report it.

## 1. Performance budgets
- Target 60 fps on a mid-range Android phone, 120 fps on high refresh screens. Interaction response within 100 ms.
- Cold start to first meaningful screen under about 1.5 s on a mid-range device. Route to route navigation shows the next screen in under 100 ms (skeleton counts).
- Initial JS per route under about 250 KB gzipped. Split heavy screens (editor, charts, PDF tools) and load them on demand.
- Main thread: no task over 50 ms during interaction. Defer heavy work with idle callbacks, transitions or workers.
- Layout: no forced reflow in scroll or touch handlers. Batch DOM reads and writes.
- Animate only `transform` and `opacity`. Use `will-change` only on the element currently animating and remove it after.
- Avoid `backdrop-filter`, large blurs, big shadows and filters on scrolling content. Avoid fixed-position layers that cover the whole screen with transparency.
- Use `content-visibility: auto` and CSS containment for long off-screen sections.
- Images: explicit dimensions, modern formats, lazy loading below the fold, decode async, placeholders in surface color.
- Fonts: bundled, subset, `font-display: swap`. No CDN. Icons are bundled.
- React state: keep state local, memoize heavy rows, avoid wide context re-renders, use transitions for non-urgent updates, key lists by stable ids.
- Debounce search and autosave. Cancel stale requests on navigation.

## 2. Data freshness and caching (UX side)
- Cache first, revalidate in background (stale while revalidate). Show cached data instantly and update silently.
- After a mutation (save, delete, status change) update the local cache optimistically and invalidate related lists so other screens are not stale. Roll back and show a snackbar on failure.
- On app resume and on screen focus, revalidate data older than its freshness window. Do not refetch on every render.
- Never require logout or restart to see updated state. Offer pull to refresh as a manual fallback.
- Persist the minimum needed for instant restore (route, drafts, small caches). Clear everything on logout.
- Use HTTPS only. Handle timeouts, retries with backoff, and clear error states.

## 3. Accessibility (TalkBack and system settings)
- Every control has a role and accessible name. Icon buttons use an `aria-label`. Decorative icons are hidden from assistive tech.
- Reading order matches visual order. Focus moves into a dialog or sheet when it opens, is trapped, and returns to the trigger on close.
- Touch targets 48 px. Contrast 4.5:1 text and 3:1 controls, checked in light and dark.
- Font scale: layouts work at 200 percent without clipping, overlap or hidden actions. Use flexible containers and wrapping.
- Display size changes (zoomed UI) must not break layouts at 320 px width equivalents.
- Announce snackbars, errors, loading completion and step changes through live regions (`polite`, `assertive` only for errors).
- Form errors are linked to fields and described in text.
- Respect reduced motion and keep essential info out of animation only.
- Gestures always have a visible alternative. Time limits are extendable.
- Set the document language and use semantic headings in order (one level 1 per screen).

## 4. Anti-patterns (what makes it look like a website)
Never ship any of these:
- Hamburger-only navigation on mobile, footer link columns, breadcrumb trails.
- Hover tooltips, hover-only menus, pointer cursors, visible focus rings on tap.
- Gradient filled buttons, heavy shadows, glassy blur bars, 1 px gray borders plus shadow on every card.
- iOS patterns on Android: back chevron with text label, large centered title everywhere, action sheets styled like iOS, bounce overscroll, switch with iOS look.
- ALL CAPS badges, tiny gray low-contrast text, giant heavy question text, mixed icon styles, emoji as icons.
- Two back arrows, duplicated headings, a toolbar that hides the title, a text field cut off by the navigation bar.
- Bottom navigation bar visible during a live session, chat input or form flow.
- Prefilled fake guest values in required fields.
- Browser `alert`, `confirm`, `prompt`. Native-looking but wrong select popups on desktop style.
- Modal on modal, nested scroll areas that trap the finger, horizontal page scroll.
- Full-screen spinners over loaded content, blank screens while fetching, endless loading with no timeout.
- Hard page reloads during navigation, flashes of white, layout shifts after load.
- Text clipped mid-sentence, labels wrapping to two lines in buttons, chips, tabs, badges.
- Placeholder text used as the field label.
- Web-style pagination, "Read more" links that open new tabs, target blank.
- Buttons smaller than 48 px, tap targets touching each other.

## 5. Screen review recipe (audit first)
For each screen, in this order:
1. Anatomy: bars, content scroller, actions. Count stacked chrome. Remove duplicates.
2. Layout stress: widths 320, 360, 412, 600, 840 and font scale 1.0, 1.3, 2.0. Find wrapping, clipping, overlap.
3. Tokens: remove hard-coded values, fix radius, type, color, elevation.
4. Components: replace ad hoc elements with the shared components (file 02).
5. Insets and keyboard: gesture bar, 3-button bar, keyboard open, rotation.
6. Back and navigation: central handler, transitions, unsaved changes.
7. States: loading, empty, error, offline, success.
8. Motion and haptics: appropriate, optional, reduced motion fallback.
9. Accessibility and contrast: sections 3 and 6.
10. Performance: no jank on scroll, no heavy effects.
Report issues as critical (blocks core action), high (layout breakage), medium, low.

## 6. Quality gate checklist
A change is not done until every item passes. Record failures in the final report.
- Looks like Material 3 Expressive on Android 15 and 16, with no web-isms (section 4).
- Tokens only. No raw hex, radius, duration, easing or shadow in components.
- Light and dark verified. Contrast verified.
- Edge-to-edge correct with gesture and 3-button navigation, with no overlap of bars.
- Keyboard open: focused field visible, docked bars correct, no jump.
- Back: central handler order is correct, overlays close first, root minimizes, no trap.
- Font scale 2.0 and widths 320 to 840 have no clipping or overlap, and no button label wraps.
- All touch targets are 48 px with ripple feedback.
- Loading, empty, error and offline states exist and look native.
- No console errors, no hydration mismatch, no layout shift after load.
- Scroll and transitions stay smooth. No animation of layout properties.
- TalkBack names and order verified. Reduced motion verified.
- Every new dependency or native edit follows file 08 and is listed in the report. No unrelated changes.
- The native gap audit (file 10) shows no Critical or High gaps, and every device-dependent feature has a matrix row.

## 7. Test matrix
- Devices: a small phone (360 wide), a large phone (412), a tablet or foldable width (600+), plus Android 15 and 16 images.
- Modes: gesture nav, 3-button nav, dark mode, system font scale 1.3 and 2.0, display size large, TalkBack on, reduced motion, airplane mode, slow network, low memory.
- Flows to run: cold start, resume from background, deep link, rotation, back from each depth, keyboard on each form, offline then online, session expiry, export and share a file, permission denied then granted, plugin missing in the browser.
- Compare screenshots against the Material 3 reference spacing, type and color. Fix any visible difference above 4 px in spacing or any wrong token.

## 8. Maintenance rules
- New screens start from the shell, the shared components and the tokens. No one-off styles.
- Changing a token changes it everywhere. Never patch a single screen to look right.
- When a rule here conflicts with a native plugin capability or a system behavior on a given device, the platform behavior wins and the deviation is documented in the report.
- Keep rule files short and in sync. If a file approaches 12,000 characters, split by topic into a new numbered file and update the index in file 00.
