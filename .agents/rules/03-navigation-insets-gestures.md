---
trigger: always_on
description: Navigation, edge-to-edge insets, predictive back, transitions, scrolling, keyboard, haptics and native bridge rules for the Next.js + Capacitor app
---

# Navigation, Insets, Gestures, Native Bridge

Device features follow files 08 and 09. Install plugins only with the protocol in file 08. Edit native project files only as file 08 allows, and report every native edit.

## 1. Edge-to-edge and insets (Android 15 enforced, Android 16)
- The app draws behind the status bar and the navigation or gesture bar. Bars are transparent. Content must never sit under them unintentionally.
- Read insets in one place (an `insets` helper) and expose CSS variables: `--sat`, `--sar`, `--sab`, `--sal`. Source order: variable injected by the native bridge (system bars or insets support in the installed Capacitor version, or a plugin, file 08), then `env(safe-area-inset-*)`, then `0px`. Use only these variables in layout.
- Top app bar pads by `--sat`. Bottom navigation bar and bottom action bars pad by `--sab`. Full-bleed media may extend under bars, interactive controls may not.
- Display cutouts and rotation: respect left and right insets in landscape.
- System bar icon color follows the content under it: dark icons on light surfaces, light icons on dark. Update through the platform wrapper when the theme changes or a dark hero is shown.
- Test with gesture navigation (thin handle) and 3-button navigation (taller bar). Both must look correct.
- Keep a visible 8 to 16 px breathing gap between the last interactive element and the bottom edge.

## 2. Window size classes
- Compact below 600: single pane, bottom navigation bar.
- Medium 600 to 839: navigation rail, one or two panes, 24 px margins.
- Expanded 840 and up: rail or drawer, list-detail panes, max content width 840 for reading screens.
- Foldables and tablets: layout reacts to width, not device name. Never assume portrait.

## 3. Back behavior (predictive back, Android 15/16)
- There is one central back handler registered through the platform wrapper using the Capacitor app back button event. Screens never register their own global handlers.
- Back priority stack, first match wins:
  1. Close the on-screen keyboard.
  2. Dismiss the topmost overlay (menu, dialog, bottom sheet, search view).
  3. Cancel an in-progress selection or edit mode.
  4. Confirm if there are unsaved changes or a live session, then pop the route.
  5. Pop the route.
  6. On the root of a non-home tab, go to the home tab.
  7. On the home tab, minimize the app. Do not hard exit.
- Never trap the user. A screen that cannot go back must show a visible Close action.
- Overlays push a history entry or register with the stack so back closes them first.
- Emulate predictive back visuals: an edge swipe (first 24 px from either edge) drags the current screen, scaling to about 0.9 with radius extra-large and a slight shift, revealing the previous screen underneath. Commit past about 40 percent or on fast velocity, otherwise spring back. Disable the emulation if the system provides its own animation.
- Back arrow in the app bar behaves exactly like system back.

## 4. Routing and transitions
- Persistent shell in the root layout. Top-level destinations are siblings, each keeps scroll position and state when revisited (keep-alive or restored state). Never refetch a tab just because it was revisited, show cached data and revalidate quietly.
- Transitions (use motion tokens):
  - Top-level switch: fade through, outgoing 90 ms out, incoming 210 ms in with 8 percent scale.
  - Forward and back in a stack: shared axis X, 30 px slide plus fade, 300 ms emphasized.
  - Card to detail: container transform (card grows into the detail screen), 400 ms emphasized.
  - Modal and sheets: slide up with decelerate, dismiss with accelerate.
- Never block navigation on data. Render the destination immediately with skeletons.
- No white flash: both screens have opaque surface backgrounds during transitions.
- Prefetch the likely next route on tap-down or when it becomes visible.
- Deep links and notification taps land on the correct screen with a valid back stack (home, then target).
- Use route groups or layout flags to hide the navigation bar in focused flows.

## 5. Scrolling
- One scroll container per screen. `overflow-y: auto`, `overscroll-behavior: contain`, `-webkit-overflow-scrolling: touch`, padded bottom for navigation bar, insets and FAB.
- Top app bar collapses or tints from the container scroll offset with a passive listener and requestAnimationFrame. No layout reads inside scroll handlers.
- Restore scroll position when returning to a screen. Reset on new navigation.
- Long lists are virtualized or paginated with an intersection-based loader. Show an inline progress row at the end.
- Horizontal scrollers use `scroll-snap`, hidden scrollbars and edge fades. Vertical and horizontal gestures must not fight (`touch-action: pan-y` on horizontal carousels' parents).
- Sticky headers use surface color, not transparent blur.

## 6. Keyboard
- Keyboard resizing mode must keep the layout stable. Use the visual viewport to track the keyboard height and apply `--kb` for docking.
- Input bars (chat, interview answer) dock directly above the keyboard, and above the bottom inset when it is closed. Never behind the navigation bar. Hide the navigation bar on screens with docked inputs.
- Focused field scrolls into view with the label visible (center it). No layout jump on open or close.
- The send or next action sits in the docked bar. `enterkeyhint` matches the action (send, next, done, search).
- Dragging the scroller down dismisses the keyboard. The Done or Next key moves focus through the form in order.
- Dialogs and sheets with fields move above the keyboard.

## 7. Haptics
- Use the haptics function in the platform wrapper. Map: light impact for toggles, segmented selection, chip selection and pull-to-refresh release; medium for long press and drag snap; success, warning and error notifications for form submit result and destructive confirmation.
- Never on every tap, scroll tick or text input. Respect a settings switch and silent mode. Web fallback does nothing.

## 8. Gestures
- Swipe on list rows for secondary actions with Undo. Long press for contextual menus, with haptic. Pull to refresh at the top. Edge swipe for back. Drag handle for sheets.
- Touch feedback within 100 ms. Pressed ripple on every control. Use `touch-action: manipulation` to remove the double-tap delay.
- Do not rely on gestures alone. Every gesture has a visible control alternative for accessibility.

## 9. Native bridge usage (through the platform wrapper only)
- Dialogs and action sheets for simple confirm or choose. Toast only for very short confirmations. Share sheet for sharing and PDF export results. In-app custom tab for external links. File picker or share for export download. Clipboard for copy with a snackbar confirmation.
- Date and time inputs may rely on the system picker.
- Tokens go to secure storage, and settings and small caches to the preferences plugin or the app database (file 09). Install the plugin if it is missing (file 08). Secrets never go in plain web storage on native.
- Network status plugin drives the offline snackbar and retry logic.
- App lifecycle events refresh stale data on resume (revalidate in the background) and lock sensitive screens if required.
- Every plugin call goes through the platform wrapper, which checks capability, uses try and catch, applies a timeout where the user is not interacting, and provides a web fallback (file 08). A missing plugin never crashes a screen.

## 10. Startup and splash
- Use the system splash. Keep it until the first screen can render, then fade out in 150 ms. No second web splash and no spinner on a blank page.
- Cold start renders the shell and skeletons first. Restore the last route and cached data without a login flash.
- Theme color, status bar and splash background match the surface token in the active theme.
- Themed (monochrome) app icon and adaptive icon are native assets. Report if missing.

## 11. Offline and resilience UX
- Offline: show cached content, an unobtrusive offline snackbar or banner, disable only actions that need the network, and queue safe writes if the project already supports it.
- Server errors: inline error state with Retry, never an endless splash or spinner. Use timeouts and an error boundary per screen.
- Session expiry returns to login and restores the user to the same screen afterward.