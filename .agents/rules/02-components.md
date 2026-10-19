---
trigger: model_decision
description: Material 3 Expressive component specs (bars, buttons, fields, cards, lists, chips, sheets, dialogs, feedback) for the native-feel mobile UI
---

# Component Specs (Material 3 Expressive, Android 15/16)

Build each component once in the in-house component layer using tokens from file 01. Screens compose these. Do not restyle per screen. Do not install anything.

## 1. Top app bar
- Small: 64 px high, title Title Large, left-aligned (center-aligned allowed for a root screen only), leading icon 48 px target, up to 3 trailing actions.
- Medium (112) and Large (152) collapse to small on scroll. Use for root and list screens with long titles.
- Background: surface at rest, surface-container when content scrolls under it. No border-bottom, no shadow.
- Top padding equals the status bar inset. Title truncates with an ellipsis, never overlaps actions.
- Exactly one back or close control. Never a second back arrow inside the content.
- Max 3 actions. Extra actions go to an overflow menu. Primary action may be a button only if one filled button fits without crowding the title.
- Document title that is editable shows a trailing edit icon and truncates to one line.

## 2. Navigation bar (bottom)
- Height 80 px plus bottom inset (flexible Expressive bar may be 64). 3 to 5 destinations.
- Container: surface-container. No top border.
- Active item: icon in a 64 x 32 full-radius indicator using secondary-container, icon filled, label bold. Inactive: outlined icon, on-surface-variant label.
- Labels always shown, Label Medium, one line, sentence case.
- Badges: 6 px dot or numeric badge in error color.
- Selecting the active destination scrolls to top, a second time refreshes.
- Hide it in focused flows (interview session, chat thread, multi-step forms, onboarding, camera). Do not stack it with a bottom input bar.
- Reserve bottom padding in every scroller equal to the bar height plus inset.
- Medium width: switch to a navigation rail (80 px wide, left). Expanded: rail with labels or a permanent drawer.

## 3. Buttons
- Types: filled, tonal (secondary-container), outlined, text, elevated. One filled button per screen section.
- Sizes (Expressive): XS 32, S 40, M 56, L 96, XL 136 px high. Default S or M. Horizontal padding 24 (16 for XS and S icon buttons).
- Shape full. Pressed state morphs one radius step and shows a ripple.
- Label: Label Large, one line, never wrap. Leading icon 18 px with 8 px gap.
- Full-width buttons only for primary actions in forms, sheets and bottom action bars, not for repeated list items.
- Disabled: 38 percent content, 12 percent container. Loading: replace the label with a 18 px progress indicator and keep width.
- Icon buttons: 40 visual, 48 target. Standard, filled, tonal or outlined variants. Toggle icon buttons show a filled selected state.
- Button group and segmented button: height 40, outlined, selected segment uses secondary-container with a leading check. Use for Edit or Preview style toggles. Max 5 segments.
- FAB: 56 px (large 96), radius large, primary-container, 16 px from edges, above the navigation bar. Extended FAB 56 high with icon and label. Hide or shrink on scroll down.
- "Download" style secondary actions on cards are tonal or text buttons or an icon button, not a loud filled button repeated on every card.

## 4. Text fields
- Outlined default: 56 px high, 1 px outline, 2 px primary on focus, error uses error color and error container supporting text.
- Label sits inside and floats above on focus or value. Placeholder shows only when focused. Never use placeholders as labels.
- Supporting text below in Body Small, 16 px side inset. Character counters at the end of supporting text.
- Leading icon 24 px optional. Use icons on all fields of a form or none.
- Always set: `type`, `inputmode`, `autocomplete`, `enterkeyhint`, `autocapitalize`, and `spellcheck` appropriately. Email uses the email keyboard, phone the tel keypad, numbers numeric.
- Multi-line fields grow with content up to a max, then scroll. Show counter if limited.
- On focus, scroll the field into view above the keyboard (file 03).
- Dropdown: use an exposed menu for under 8 options, a bottom sheet with search for long lists such as country. Native date and time inputs may be used because the WebView opens the system picker.
- Required marker: put "(optional)" on optional fields or mark required consistently with an asterisk in the label. Choose one pattern for the app.
- Validate on blur and on submit, not on every keystroke. Never block typing.

## 5. Cards
- Types: elevated, filled (surface-container-highest), outlined (outline-variant). Prefer filled or outlined. Radius medium to large.
- Padding 16. Content order: media, headline, supporting text, then actions. Title Medium or Title Large for the headline, Body Medium for text.
- The whole card is the tap target with a ripple and opens a detail screen. Inner actions are secondary.
- All cards in a list share one elevation, one radius and one action style. Card icon tile has a fixed square size so titles align.
- Badges inside cards: small chip, Label Small, one line, never wrap, never push the title to wrap. Place above the title or top-end corner with the title using full width.
- Limit visible chips to 3 to 4 plus a "+N" chip. No orphan single-chip rows.

## 6. Lists
- Row heights: one line 56, two lines 72, three lines 88. Padding 16 sides, 8 vertical.
- Leading avatar or icon 40, trailing icon, text, switch or metadata. Supporting text Body Medium in on-surface-variant.
- Dividers are inset 16 px, 1 px outline-variant, or none with spacing. Never full-bleed gray lines with shadows.
- Swipe actions: swipe end to delete or archive with a colored container reveal and an Undo snackbar.
- Long lists are virtualized. Pull-to-refresh at the top of the scroller (section 12).

## 7. Chips and tabs
- Chips: height 32, radius small, Label Large. Types: assist, filter (leading check when selected), input (trailing close), suggestion.
- Chip rows are horizontally scrollable with a trailing edge fade, or wrap cleanly. Do not clip a chip silently.
- Primary tabs: equal width for 2 to 4 labels, indicator 3 px under the active label, labels one line, short ("Setup", "Live", "History"). More than 4 tabs scroll with an edge fade.
- Step indicators: use "Step 2 of 5" with a linear progress bar. Completed steps show a check, the current step shows its number, upcoming steps are muted. Keep one sticky step indicator, not two.

## 8. Dialogs
- Radius extra-large, container surface-container-high, padding 24, width 280 to 560, scrim at 32 percent.
- Title Headline Small, body Body Medium, actions are text buttons right-aligned (confirm on the right).
- Use only for confirmation, short choices and errors. For anything long use a bottom sheet or a full-screen dialog.
- Destructive confirmation names the object and the consequence ("Delete resume? This cannot be undone"). Confirm for End session or unsaved changes.
- Prefer the native alert through the platform wrapper for simple confirm and alert. No dialog on top of a dialog.
- Back dismisses the dialog (file 03).

## 9. Bottom sheets
- Modal sheet: top corners extra-large, surface-container-low, drag handle 32 x 4, scrim, max height 90 percent of the screen minus the top inset.
- Drag to dismiss with a spring. Snap points for content that needs them (peek, half, full).
- Use for pickers, filters, action menus, share targets, long selections. Content scrolls inside, with the handle area draggable.
- Sheet respects the bottom inset and moves above the keyboard when a field inside is focused.
- Standard (non-modal) sheets are allowed on expanded widths.

## 10. Menus, snackbars, tooltips
- Menus: anchored popup, radius medium, surface-container, items 48 high, open with scale and fade from the anchor, close on outside tap or back.
- Snackbar: inverse-surface, 4 px radius, 48 px min height, 16 px side margin, 8 px above the navigation bar or bottom bar, one action text button, 4 to 10 seconds, one at a time. Use for save, offline, undo and non-blocking errors. Announce through a live region.
- No toast stacks, no top banners that push layout, no red full-width bars. An offline notice is a persistent snackbar or a slim inline banner under the app bar.
- Tooltips are not used on touch. Long press on icon-only controls may show a label.

## 11. Selection controls and progress
- Switch: track 52 x 32, handle 24 growing to 28 when pressed, check icon in the handle when on, 48 px target.
- Checkbox 18 in a 48 target, radio 20 in a 48 target, both with a state layer circle on press.
- Slider: 4 px track with a 20 px handle (Expressive thicker track allowed), value label on drag.
- Progress: linear 4 px, circular 40 px. Use the Expressive wavy or contained loading indicator for waiting states if available in existing assets, else standard. Prefer skeletons for content, and determinate progress for exports and uploads.
- Search bar: 56 px, full radius, surface-container-high, leading search icon, trailing clear or voice. Tapping expands to a full-screen search view with suggestions.

## 12. Pull to refresh and empty states
- Pull to refresh: Material circular indicator appears from the top inside the scroller, threshold about 80 px, then spins until data returns, with haptic tick on release.
- Empty state: 96 px illustration or icon, Title Medium, one line of Body Medium, one clear action button. Error state: same layout with Retry.

## 13. Per-component checklist
Tokens only, 48 px target, ripple, disabled and error states, dark mode, long-text and 200 percent font scale behavior, RTL safe, accessible name and role, and a single reusable implementation.
