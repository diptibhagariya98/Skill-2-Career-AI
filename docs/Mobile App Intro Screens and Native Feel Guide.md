# Mobile App Intro Screens and Native Feel Guide

Oct 18, 2026 · @vaginsynci

## Purpose and how to use this guide

This guide defines the first-launch intro screens, the navigation, and the native-feeling components the app needs so that it reads as a mobile app, not as the website shrunk into a phone frame.

**Rules for whoever implements this (person or coding assistant):**

- Do not install, add, or set up any package, tool, plugin, or project scaffold because of this document. Work only with what the project already uses.
- This guide names no technology on purpose. "The router", "the local storage", "the database", "the background jobs" mean whatever the project already has.
- Change only what each section asks for. Do not restructure unrelated screens.

**The core shift from website to app:**

| Website habit | Mobile rule |
| --- | --- |
| Top navigation bar with many links | Bottom tab bar with 3 to 5 destinations |
| Hover states, tooltips | Pressed states, long-press menus, inline hints |
| Wide multi-column pages | One column, vertical scroll, cards |
| Modal dialogs centered on screen | Bottom sheets for choices and forms |
| Click targets of any size | Touch targets of at least 48 x 48 dp (44 x 44 pt on iOS) |
| Page loads and spinners | Skeletons, cached content first, pull to refresh |
| Browser back button | System back gesture and button, handled on every screen |
| Login wall at the start | Short intro first, value before sign-up, optional guest browsing |

## Intro screens (before onboarding or login)

Use three intro screens for a first-time user. Two is acceptable for a very simple app; four is the hard maximum. Each screen sells one benefit, not a feature list, and the user can leave the sequence at any time.

**Count and purpose**

| Screens | When to use | Role of each |
| --- | --- | --- |
| 2 | Single clear value | 1 = what the app does, 2 = why it is better than the website |
| 3 (default) | Most apps | 1 = main promise, 2 = key benefit or how it works, 3 = trust or personalisation, then call to action |
| 4 | Several distinct audiences | Only if each screen adds a different benefit; never repeat the same idea |

**Layout of one intro screen (portrait phone)**

| Zone | Share of screen height | Content |
| --- | --- | --- |
| Top bar | About 8% | Skip button on the right; optional logo on the left |
| Illustration area | About 50 to 55% | One image or animation, shown inside a 4:5 or 1:1 box, centered, never stretched |
| Text block | About 20% | Headline (one line, up to 6 words, 24 to 28 sp bold), body (up to 2 lines, 15 to 16 sp) |
| Page dots | About 4% | One dot per screen, active dot longer or filled |
| Primary button | About 10% | Full-width button, 52 to 56 dp high, 16 dp side margins, "Next"; on the last screen "Get started" |
| Bottom safe area | Device inset | Never place content under the home indicator or system navigation bar |

**Illustration ratios and assets**

- Design the artwork on a 4:5 canvas and let it scale to fit; keep important content inside the central 80% so tall and short phones both crop safely.
- Provide each image at 1x, 2x, and 3x density, or as vector art, so it stays sharp on every device.
- Use the same style, colours, and motion on all intro screens; one screen must not look like it came from another app.
- Prefer real product visuals (actual app screens in a phone frame) over generic stock art on at least one screen.

**Behavior**

- Swipe left and right moves between screens; the dots and the button update with the swipe. The button "Next" moves forward the same way.
- Skip is visible on screens 1 and 2 and goes straight to the end action. On the last screen Skip is replaced by the primary button.
- A subtle motion on entry (image fades and rises 16 dp over 300 ms, text follows 100 ms later) is enough. No auto-advance; the user controls the pace.
- Respect the reduce-motion setting: replace animation with a plain fade.
- Light haptic tap on the primary button and on each page change.
- Total time to read all screens should be under 15 seconds.

**Copy rules**

- Headline states the outcome ("Find events near you"), not the feature name.
- No permissions, sign-up forms, or long text on the intro screens.
- The last screen ends with two actions: "Get started" (primary) and "I already have an account" (text link).

## First-launch flow and logic

The intro shows once, to a user who has never opened the app on this device. The decision happens during the splash screen, before any other screen is drawn, so the user never sees a flash of the wrong screen.

**Start-up order**

1. Splash screen appears instantly with the logo on a solid background that matches the system launch screen.
2. While it shows, read two values from the device's local storage: "intro seen" and "session present".
3. If "intro seen" is false: show the intro screens.
4. If "intro seen" is true and "session present" is false: show the login or sign-up screen (or the guest home, if guest browsing exists).
5. If a session is present: go straight to the main app with the bottom tab bar.
6. Hide the splash only after this decision is made; keep it under 1.5 seconds and never block it on a network call.

**Rules**

- "Intro seen" is saved when the user taps "Get started", "I already have an account", or Skip. It is never saved by merely opening the first screen.
- Intro is not shown again after logout, after sign-in on another account, or after an app update. Provide a way to replay it from Settings ("How it works") only if the product wants it.
- If the app is reinstalled, the intro may show again; this is expected.
- Local storage must be read in a safe way: if the read fails or the value is missing, treat it as a first launch.
- The back gesture on intro screen 1 exits the app; on screens 2 and 3 it goes to the previous intro screen.
- Intro screens work with no internet connection. All their images and text ship inside the app.

**Where the intro ends**

| User choice | Next screen |
| --- | --- |
| Get started | Onboarding or sign-up |
| I already have an account | Login |
| Skip | Same as Get started, or guest home if guests are allowed |

**Permissions timing**

- Do not ask for notifications, location, camera, or contacts on the intro or the splash.
- Ask for each permission at the moment the user needs it, preceded by a short custom explanation screen or sheet ("Allow notifications so we can tell you when a ticket is confirmed").
- If the user denies a permission, keep the feature visible and show a gentle prompt that links to the device settings.

## Navigation architecture

The app uses three layers of navigation. Every screen belongs to exactly one layer.

| Layer | What it holds | Behaviour |
| --- | --- | --- |
| Entry flow | Splash, intro, onboarding, login, sign-up, verification | Linear; replaces itself with the main app on success; user cannot go back into it with the back gesture once signed in |
| Main tabs | 3 to 5 top destinations (for example Home, Search, Saved, Messages, Profile) | Bottom tab bar, always visible on top-level screens; each tab keeps its own history and scroll position |
| Detail stacks | Item detail, settings pages, checkout steps | Pushed on top of a tab with a slide-in transition; tab bar hides on deep or immersive screens |

**Bottom tab bar rules**

- Maximum 5 tabs; each has an icon and a short label (one word). The active tab uses a filled icon and the brand colour.
- Tapping the active tab scrolls that screen to the top; tapping it again at the top returns to the tab's root screen.
- Switching tabs never reloads the screen from scratch; it restores the previous state and scroll offset.
- A badge dot or number on a tab is for real unread items only.
- Bar height is 56 to 64 dp plus the bottom safe area. Do not put a hamburger menu in an app that already has a tab bar.

**Back behaviour**

- Every pushed screen has a back arrow at the top left (iOS: chevron with optional parent title) and responds to the system back gesture or button.
- Back from a top-level tab goes to the first tab; back from the first tab asks nothing and exits the app (or shows "press again to exit" on Android).
- Back from a screen with unsaved input shows a short confirmation sheet ("Discard changes?"), never a browser-style dialog.
- Leaving a modal flow (a sheet or a full-screen modal) uses a close button at the top, not a back arrow.

**Transitions**

- Push: new screen slides in from the right (platform default). Modal: slides up from the bottom. Tab change: instant or a short cross fade, no slide.
- Shared elements (an image growing from a list card into the detail page) are encouraged for lists of visual items.
- Keep all transitions between 200 and 350 ms.

**Auth gate and deep links**

- A screen that needs a session checks it when opened. If the user is not signed in, show a login sheet over the screen; after success, return to the same screen and complete the action the user started.
- Links opened from outside the app (notification, shared link, email) go straight to the target screen, with the tab bar and a sensible back path underneath it. If the user is signed out, show login first and then continue to the target.
- Every screen that can be shared or linked must have a stable address defined in one central place.

**Header (top bar)**

- Large title that collapses to a small title when scrolling on top-level tabs; small fixed title on detail screens.
- Actions on the right: at most two icons; further actions go into an overflow menu.
- Search lives either as a field at the top of the Search tab or as a search icon that expands the header into a search field.

## Native-feeling components

Replace each website component with its mobile counterpart below.

| Website component | Mobile replacement | Key rules |
| --- | --- | --- |
| Search box in header | Search screen or expanding search field | Opens with keyboard up and focus set; recent searches below the field; suggestions as the user types; clear (x) button; search key on keyboard runs the search; results keep their scroll position when coming back |
| Filter sidebar or dropdowns | Filter bottom sheet | Opens from a Filter button with a count badge; chips for quick options; sticky bottom bar with "Reset" and "Show N results" |
| Centered modal or popup | Bottom sheet | Rounded top corners, drag handle, swipe down to dismiss, tap outside to dismiss, height fits content or snaps at half and full |
| Confirmation popup | Action sheet or small alert | Destructive option in red, Cancel always present; two buttons maximum on alerts |
| Select dropdown | Picker sheet or wheel picker | Date and time use the platform's own pickers |
| Fixed "Back to top" link | Tap on the header or the active tab | No extra button needed |
| Floating chat or help bubble | Floating action button (FAB) | One per screen, 56 dp, bottom right, 16 dp above the tab bar; hides when scrolling down, returns when scrolling up |
| Table or data grid | Stacked cards or a list | Show 2 to 3 key values per row; details on tap |
| Hover menu | Long-press menu | Same actions also reachable by an explicit button for accessibility |
| Pagination links | Infinite scroll with a loading row | Show "No more results" at the end; keep position after returning |
| Page refresh button | Pull to refresh | On every list screen; shows the platform's refresh indicator and a "Updated just now" time if useful |
| Row of action buttons | Swipe actions on list rows | Swipe left for delete or archive, right for save or mark; always also available in the detail screen |
| Inline success or error banner | Toast or snackbar | Appears near the bottom above the tab bar for 3 to 4 seconds; has an Undo action for reversible changes |
| Long forms on one page | Step-by-step form | One question group per step, progress indicator at the top, "Next" button fixed above the keyboard |
| File upload button | Source sheet | Options: Camera, Photo library, Files; permission requested at tap time |
| Tabs inside a page | Segmented control or top tabs | Swipeable content; maximum 4 segments |
| Skeleton or spinner on whole page | Skeleton placeholders matching the final layout | Show cached data first, then refresh quietly in the background |

**Floating and overlay elements**

- Only one floating item at a time on a screen (a FAB, a mini player, or a sticky bar). Never stack them.
- Sticky bottom action bars (for example "Buy ticket" with a price) sit above the tab bar or replace it, include the safe area, and move up with the keyboard.
- Sheets, toasts, and floating buttons must never cover the main content the user is interacting with, and must not cover the system gesture area.
- Dim overlays behind sheets use a 40 to 50% black scrim.

**Empty, error, and loading states**

- Every list and detail screen has three designed states: loading (skeleton), empty (illustration, one sentence, one action), and error (short message, Retry button).
- Never show raw error text or a blank white screen.

## Touch, gestures, keyboard, and screen sizes

**Touch**

- Every tappable element is at least 48 x 48 dp with at least 8 dp between neighbours, even when the visible icon is smaller.
- Every tap gives instant feedback: a ripple or highlight within 100 ms. A button that starts a request shows a loading state and ignores repeat taps.
- Put primary actions in the lower half of the screen, within thumb reach. Destructive actions are never next to primary ones.

**Gestures**

| Gesture | Use |
| --- | --- |
| Swipe from left edge | System back |
| Swipe down on a sheet | Dismiss the sheet |
| Pull down at top of a list | Refresh |
| Swipe sideways on a row | Quick actions |
| Long press | Context menu or multi-select |
| Pinch or double tap | Zoom on images and maps only |

No gesture may be the only way to do something. Each has a visible button alternative.

**Haptics**

- Light tap for selection changes, toggles, and page changes; success pattern after a completed action; warning pattern for errors.
- Use sparingly: at most one haptic per user action.

**Keyboard**

- Each text field sets the right keyboard (email, number, phone, search) and the right action key (Next, Done, Search, Send).
- When the keyboard opens, the focused field scrolls into view and the primary button stays visible above the keyboard.
- Tapping outside a field or scrolling a form dismisses the keyboard.
- Turn on autofill hints for email, password, one-time codes, and addresses so the platform can fill them.

**Safe areas and cutouts**

- All content respects the top inset (status bar, notch, camera cutout) and the bottom inset (home indicator, system navigation).
- Backgrounds and images may extend behind the status bar; text and buttons may not.

**Screen sizes and layout**

| Device class | Width | Layout |
| --- | --- | --- |
| Small phone | up to 360 dp | Tighter spacing, one-line headlines, no clipped buttons |
| Normal phone | 360 to 430 dp | Reference design |
| Large phone or small tablet | 430 to 600 dp | Same layout, wider margins, content capped at about 560 dp |
| Tablet | 600 dp and above | Optional two-pane (list and detail); otherwise center the phone layout |

- Use flexible layouts and spacing units, never fixed pixel widths. Test at 320, 360, 390, 412, and 430 dp wide.
- Text must survive the user's largest system font size without overlapping or cutting off: let containers grow and wrap.
- Portrait is the default; lock orientation unless a screen (video, gallery) truly benefits from landscape.

## Converting each website screen to a mobile screen

Do not copy website pages. Rebuild each one for the phone, using the steps below.

1. **List the page's jobs.** Write the 1 to 3 things a user comes to this page to do. Drop everything else from the first view.
2. **Pick the screen type.** Each screen is one of: list, detail, form, search, settings, or dashboard. Use the patterns of that type.
3. **Order for the thumb.** Content top to bottom by importance; the main action fixed at the bottom or inside the thumb zone.
4. **Cut the chrome.** Remove footers, breadcrumbs, sidebars, and link clusters. Move secondary links into the Profile or Settings tab.
5. **Collapse the secondary.** Put details behind expandable sections, sheets, or a "See more" row.
6. **Rewrite the copy.** Shorter headlines, one idea per paragraph, buttons that start with a verb.
7. **Design the states.** Loading, empty, error, offline, and no-permission versions of the screen.
8. **Place it in navigation.** Decide its layer (tab root, pushed detail, or modal) and what back does.

**Per-screen checklist**

| Check | Pass condition |
| --- | --- |
| One main job | The screen has one primary action, visually clear |
| Single column | No horizontal scrolling of the page itself |
| Touch size | All targets at least 48 x 48 dp |
| Safe areas | Nothing hidden under notch, home bar, or keyboard |
| Back | System back works and goes where the user expects |
| Cached first | Last known data shows immediately; refresh happens quietly |
| States | Loading, empty, error, offline all designed |
| Text | Readable at the largest system font size |
| Motion | Transitions under 350 ms; respects reduce-motion |
| Native element | Uses a sheet, picker, or swipe where the website used a popup, dropdown, or hover |

**Typical mapping for common pages**

| Website page | Mobile screen |
| --- | --- |
| Home with many sections | Home tab: header, one featured carousel, then vertical sections with "See all" |
| Listing with filters | Search tab or list screen with a filter sheet |
| Detail page | Pushed detail screen with hero image, sticky bottom action bar |
| Account and settings | Profile tab with grouped rows leading to small settings screens |
| Checkout or booking | Step-by-step flow with a progress bar and a final confirmation screen |
| Help and legal pages | Rows inside Settings that open a simple reading screen |
| Login and sign-up | Short, one-field-per-step flow; social sign-in buttons on top; password visibility toggle |

## Platform differences, accessibility, and offline behavior

One shared design, with small adjustments so each platform feels familiar.

| Area | iOS | Android |
| --- | --- | --- |
| Back | Edge swipe plus back chevron | System back gesture or button, plus top-left arrow |
| Title | Centered or large collapsing title | Left-aligned title |
| Switches and pickers | Platform switch and wheel pickers | Platform switch and dialog pickers |
| Sheets | Rounded sheet with drag handle, can sit at half height | Bottom sheet with drag handle |
| Alerts | Centered alert with stacked or side-by-side buttons | Dialog with right-aligned text buttons |
| Scrolling | Bounce at the edges | Glow or stretch at the edges |
| Status and bottom bars | Home indicator inset | Gesture or three-button navigation inset |
| Haptics | Fine-grained taps | Shorter, coarser vibration |

Rule of thumb: keep brand colours, spacing, and copy identical; let the platform decide transitions, scroll physics, pickers, and system dialogs.

**Accessibility**

- Every icon-only button has a text label for screen readers; images that carry meaning have a description, decorative ones are hidden from readers.
- Reading order matches visual order on every screen, including intro screens (headline, body, button).
- Colour contrast at least 4.5:1 for text and 3:1 for icons and borders; never use colour alone to show state.
- Page changes and toasts are announced to screen readers; focus moves to the new screen's title after navigation.
- Support light and dark appearance from the start; intro artwork needs a version for each or a neutral background.

**Offline and slow network**

- The app opens and shows the intro and the last cached content with no connection.
- A slim banner under the header says "You are offline" and disappears when the connection returns; actions that need the network are disabled with a short reason, not hidden.
- Failed requests offer Retry; actions the user started offline are queued and sent when the connection returns, with a visible "Waiting to send" state.
- Never leave the splash or a blank screen waiting on the network.

## Acceptance checklist and implementation rules

**Rules for the coding assistant**

- Do not install, add, or configure any new package, tool, or project setup. Use only what the project already contains.
- Before changing anything, inspect how the app currently handles start-up, navigation, storage, and shared components, and follow those existing patterns.
- Build in this order: (1) start-up decision and splash, (2) intro screens, (3) entry flow into login, (4) tab bar and navigation layers, (5) shared components (sheet, toast, search, empty and error states), (6) conversion of existing screens one by one.
- Put every size, spacing, colour, duration, and text style in shared design values, not scattered through screens.
- Create each shared component once (bottom sheet, toast, empty state, search field, sticky action bar) and reuse it everywhere.
- After each step, run the app on a small phone size and a large phone size and tick the relevant checks below before moving on.

**Acceptance checklist**

- [ ] First launch shows the splash and then 2 to 4 intro screens; second launch skips them.
- [ ] Intro works offline, supports swipe, Next, Skip, and dots, and reaches login or onboarding from the last screen.
- [ ] No permission request appears during intro; each permission is requested in context.
- [ ] Intro text and buttons sit clear of the notch and home indicator on every test size.
- [ ] Bottom tab bar has 3 to 5 tabs, keeps each tab's state, and scrolls to top when the active tab is tapped.
- [ ] System back works on every screen and never traps the user or reopens the entry flow after sign-in.
- [ ] Popups are replaced by bottom sheets; dropdowns by pickers; hover actions by long press or visible buttons.
- [ ] Every list has pull to refresh, loading skeleton, empty state, and error state.
- [ ] Search opens with the keyboard, shows recent searches, and keeps results when the user returns.
- [ ] Only one floating element per screen; none covers content or the system gesture area.
- [ ] All touch targets are at least 48 x 48 dp; text survives the largest system font size.
- [ ] Light and dark appearance both look correct, including intro artwork.
- [ ] Offline banner appears and clears correctly; cached content opens without a connection.

**Open questions for the product owner**

- Should guests be able to browse before signing up, or must the intro lead straight into sign-up?
- Should the intro be replayable from Settings?
- Which 3 to 5 destinations become the bottom tabs?
