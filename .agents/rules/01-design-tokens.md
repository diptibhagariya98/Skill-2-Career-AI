---
trigger: always_on
description: Material 3 Expressive design tokens (color, type, shape, spacing, elevation, motion, icons) for the native-feel mobile UI
---

# Design Tokens (Material 3 Expressive, Android 15/16)

All visuals come from tokens. Components never contain raw hex values, pixel radii, durations or easings. Define tokens once as CSS variables on the root and reference them everywhere. Map the project's utility classes and theme values (colors, radii, spacing) to these variables so no raw palette value is ever used.

## 1. Color roles
Define these roles for light and dark. Names follow Material 3.
- primary, on-primary, primary-container, on-primary-container
- secondary, on-secondary, secondary-container, on-secondary-container
- tertiary, on-tertiary, tertiary-container, on-tertiary-container
- error, on-error, error-container, on-error-container
- surface, surface-dim, surface-bright, on-surface, on-surface-variant
- surface-container-lowest, -low, -container, -high, -highest
- outline, outline-variant, inverse-surface, inverse-on-surface, inverse-primary, scrim, shadow

Tone mapping (tonal palette tone numbers, 0 black to 100 white):

| Role | Light | Dark |
|---|---|---|
| primary | 40 | 80 |
| on-primary | 100 | 20 |
| primary-container | 90 | 30 |
| on-primary-container | 10 | 90 |
| secondary-container | 90 | 30 |
| on-secondary-container | 10 | 90 |
| surface | 98 | 6 |
| surface-container-lowest | 100 | 4 |
| surface-container-low | 96 | 10 |
| surface-container | 94 | 12 |
| surface-container-high | 92 | 17 |
| surface-container-highest | 90 | 22 |
| on-surface | 10 | 90 |
| on-surface-variant | 30 | 80 |
| outline | 50 | 60 |
| outline-variant | 80 | 30 |
| error | 40 | 80 |

Rules:
- Derive primary, secondary (low chroma), tertiary (shifted hue) and neutral palettes from the brand seed color. Keep the seed in one place.
- Dynamic color (Material You, from wallpaper) needs a native bridge. If a plugin already exists, read the system accent into the primary palette. If not, use the brand seed and offer a small custom plugin as an optional enhancement (file 08, section 8). Never block a task on it.
- Use surface containers for hierarchy instead of shadows or borders. Cards sit on surface using container-low or highest.
- No pure black or pure white backgrounds in dark and light themes. No gradients on buttons, bars or cards. Gradients are allowed only on brand art such as logos and illustrations.
- Text contrast at least 4.5:1, large text and UI controls at least 3:1. Check both themes.
- Color is never the only signal. Pair with icon, text or shape.
- Semantic extras (success, warning) are custom roles with container pairs, built the same way.

## 2. Typography
- Font stack: `"Google Sans Flex", "Google Sans", Roboto, system-ui, sans-serif`. Use system fonts or fonts bundled in the app. Never load fonts from a CDN. A brand font may be added as a self-hosted, subset package using the protocol in file 08.
- Use rem with a 16 px root so system font scaling works. Never use fixed px line heights that break at scale.

| Role | Size / line | Weight | Tracking |
|---|---|---|---|
| Display L / M / S | 57/64, 45/52, 36/44 | 400 | -0.25, 0, 0 |
| Headline L / M / S | 32/40, 28/36, 24/32 | 400 | 0 |
| Title L | 22/28 | 400 | 0 |
| Title M | 16/24 | 500 | 0.15 |
| Title S | 14/20 | 500 | 0.1 |
| Body L | 16/24 | 400 | 0.5 |
| Body M | 14/20 | 400 | 0.25 |
| Body S | 12/16 | 400 | 0.4 |
| Label L | 14/20 | 500 | 0.1 |
| Label M / S | 12/16, 11/16 | 500 | 0.5 |

- Expressive emphasis: use the emphasized variant (weight 600 or 700) for hero titles, selected states and key numbers. Use it sparingly, one emphasized element per region.
- Body text minimum 14 px. Metadata minimum 12 px. Nothing below 11 px.
- Question or reading text uses Body L, not a display size. Headings do not exceed Headline S inside cards.
- Max two weights per screen section. No italics for UI chrome.

## 3. Shape (corner radius)
| Token | Value |
|---|---|
| none | 0 |
| extra-small | 4 |
| small | 8 |
| medium | 12 |
| large | 16 |
| large-increased | 20 |
| extra-large | 28 |
| extra-large-increased | 32 |
| extra-extra-large | 48 |
| full | 9999 |

Component defaults: buttons full, cards medium to large, dialogs extra-large, bottom sheet top corners extra-large, FAB large, outlined and filled text fields extra-small, chips small, search bar full, navigation indicator full, snackbar extra-small, menus medium to large, image thumbnails medium.
- Expressive shape morph: pressed buttons and selected toggles may morph one step in radius (for example full to large) over 100 to 200 ms. Never animate radius on large surfaces.
- Nested radius rule: inner radius = outer radius minus the padding between them.

## 4. Spacing and sizing
- 4 px base grid. Scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Screen horizontal margin: 16 on compact, 24 on medium, 24 or more on expanded with a content max width of 840.
- Gap between related items 8, between groups 16 to 24, between sections 32.
- Touch target at least 48 x 48 px for every tappable element, with at least 8 px between adjacent targets. Visual size may be smaller than the target.
- Icons 24 px (20 in dense chips, 18 inside buttons). Avatars 40.

## 5. Elevation and state layers
- Elevation levels: 0, 1 (1 dp), 2 (3), 3 (6), 4 (8), 5 (12). Prefer tonal color over shadow. Real shadows only for FAB, menus, dialogs, sheets and floating bars.
- Shadows must be soft and low opacity. No heavy colored glows. No `backdrop-filter` blur on scrolling content.
- State layer opacity on the on-color: hover 8 percent (ignore on touch), focus 10, pressed 10, dragged 16. Disabled content 38 percent, disabled container 12 percent.
- Ripple: bounded radial ripple from the touch point, color on-surface at 10 percent, duration about 300 ms. Every tappable item has it, including list rows and cards. No default web `:active` color flash.

## 6. Motion
Easing tokens:
- emphasized `cubic-bezier(0.2, 0, 0, 1)`
- emphasized-decelerate `cubic-bezier(0.05, 0.7, 0.1, 1)`
- emphasized-accelerate `cubic-bezier(0.3, 0, 0.8, 0.15)`
- standard `cubic-bezier(0.2, 0, 0, 1)`
- standard-decelerate `cubic-bezier(0, 0, 0, 1)`
- standard-accelerate `cubic-bezier(0.3, 0, 1, 1)`

Durations (ms): short 50, 100, 150, 200; medium 250, 300, 350, 400; long 450, 500, 550, 600.
- Enter uses decelerate, exit uses accelerate, on-screen movement uses emphasized.
- Expressive motion is spring-like: slight overshoot for spatial movement (sheets, FAB, selection), no overshoot for color and opacity. Approximate springs with CSS `linear()` easing or the Web Animations API.
- Animate only `transform` and `opacity` (and color). Never animate width, height, top, left, margin or box-shadow on large areas.
- Exit animations are about 20 percent shorter than enter.
- Respect `prefers-reduced-motion`: replace movement with a fade of 100 ms.
- Skeleton loading uses a subtle opacity pulse or low-contrast shimmer. Loaders use Material progress indicators (file 02), never a full-screen spinner over content.

## 7. Icons
- Material Symbols, Rounded style, 24 px, weight 400. Outlined for unselected, filled for selected. One icon family only.
- Icons must be bundled or self-hosted. Never load from a CDN. If the project has no Material Symbols set, a self-hosted icon package may be added (file 08). No emoji as icons.
- Icon-only buttons need an accessible name and a 48 px target.
- Stroke or fill weight must match across the app. Do not mix libraries.

## 8. Token hygiene
- A lint-style self check before finishing: search the changed files for hex colors, `px` radius values, `box-shadow` literals, `cubic-bezier(` literals and `transition:` durations outside the token file. Replace them with tokens.
- Dark and light must both be verified. A token missing in dark is a bug.