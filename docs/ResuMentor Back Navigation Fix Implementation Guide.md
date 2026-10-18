# ResuMentor Back Navigation Fix: Implementation Guide

Oct 18, 2026 · @vaginsynci

## Problem and goal

In ResuMentor, the system back (button, edge swipe) and the on-screen back arrow do not return the user to the previous page or previous state. Back skips the section the user came from, leaves the whole editor or the app, and discards what the user typed.

**Goal:** every back action undoes exactly one step of the user's path, in a predictable order, and never loses work.

**Do not install, add, or set up any package, tool, plugin, or project scaffold for this change.** Use the navigation, state storage, and local storage the project already has. This document names no technology on purpose: "the router", "the shared store", and "local storage" mean whatever the project already uses. Change only what each section asks for.

**Observed symptoms**

| Symptom | Likely cause |
| --- | --- |
| Back from the Skills section leaves the resume editor instead of returning to the previous section | Sections are internal state, not history steps |
| Typed skills, categories, or answers disappear after back | Drafts live only in temporary screen state |
| Back from a deep screen jumps to the first tab or exits the app | Screens were replaced instead of pushed, or all tabs share one history |
| Back closes the screen while a sheet or keyboard is open | Sheets and the keyboard do not take the first back press |
| Arrow and system back behave differently | Two separate code paths |

## Global back rules

One single back handler, defined once in a shared place, runs for the system back button, the edge swipe, and the on-screen arrow. No screen may implement its own separate version.

**Priority order.** On every back action, do the first item that applies and stop:

1. Close the keyboard if it is open.
2. Close the topmost overlay: bottom sheet, dialog, menu, picker, or expanded search.
3. Leave a special mode (multi-select, reorder, inline edit).
4. If the screen has unsaved changes that autosave has not yet stored, store them now (see Drafts and state), or ask Save, Discard, Keep editing when the change cannot be stored.
5. Go to the previous in-screen step (section, step of a form, Edit or Preview mode) if one exists in that screen's step history.
6. Pop the screen to the previous screen in the current tab's history.
7. If the screen is a tab root and the current tab is not the first tab: switch to the first tab.
8. If it is the first tab's root: exit the app. On Android show "Press back again to exit" once, and exit on a second press within 2 seconds.

**Rules that apply everywhere**

- The on-screen back arrow runs the same handler as the system back, including every step above.
- Back never reopens the splash, intro, or login after the user is signed in.
- Back never runs a destructive action (delete, discard, sign out) without a confirmation sheet.
- Back is never disabled without an explanation. If back is blocked (for example, while a payment-like or export step is finishing), show a short message.
- A screen that handles back itself must say so to the navigation system in a way that stops the default action; otherwise both run and the user skips a step.

## Navigation structure

Every screen belongs to exactly one of three layers. The layer decides how the screen is opened and what back does.

| Layer | Screens | How it is opened | Back behavior |
| --- | --- | --- | --- |
| Entry flow | Splash, intro, onboarding, login, sign-up, verification | Each step replaces the previous one only where going back would be wrong (splash to intro, login success to main app); steps inside intro, sign-up, and verification are pushed | Back moves one step inside the flow. After sign-in the whole flow is removed from history |
| Main tabs | Home, Resume, Interview, Practice, More | Bottom tab bar; each tab has its own separate history | Back pops inside that tab; at the tab root it goes to Home, then exits |
| Pushed screens | Resume editor, interview session, scorecard, job details, scholarship details, quiz, roadmap, settings pages | Pushed on top of the current tab | Back pops to the exact screen the user came from |

**Tab rules**

- Each of the five tabs keeps its own history, scroll position, and open screens. Switching tabs never clears them.
- Tapping the active tab scrolls to top; tapping it again at the top returns to that tab's root.
- Back from a non-Home tab root goes to Home. Back from the Home root exits the app (with the double-press rule on Android).
- Jobs and Scholarships open from Home cards or from More, and open as pushed screens in that tab's history.

**Tab bar and arrow rules**

- Use either a back arrow or the tab bar, not both, on the same screen. Top-level screens show the tab bar and no arrow. Pushed detail and editor screens show an arrow, and the tab bar is hidden.
- The resume editor and the interview session are pushed screens: arrow shown, tab bar hidden.

**Push versus replace**

- Use push for any forward move the user may want to undo with back.
- Use replace only when the previous screen must not be reachable again (splash, login after sign-in, a finished interview session that moves to its scorecard).
- Never use "clear all history" except after sign-in or sign-out.

## Drafts and state preservation

Back must never destroy work. Content the user is building lives in a shared store and on the device, not inside the screen.

**What is stored, and when**

| Data | Stored where | Saved when |
| --- | --- | --- |
| Resume draft (all sections, skills, categories) | Shared store, mirrored to local storage | After every change, with a pause of about 1 second; also when the app goes to the background and when a screen closes |
| Text typed but not yet confirmed (a skill in the input without pressing Add) | Same draft | On each keystroke batch; on back, it is added as a skill automatically or kept in the field when the screen is reopened |
| Interview session (role, job description, questions, answers so far, scores) | Shared store, mirrored to local storage | After each answer |
| Quiz progress (current question, chosen answers) | Shared store | After each answer |
| Current section, Edit or Preview mode, scroll position of each screen | Shared store (per screen) | When leaving the screen and when the app goes to the background |

**Restoring**

- Reopening the resume editor restores the same draft, the same section, the same mode, and the same scroll position.
- Reopening the app after it was closed by the system restores the last screen of the current tab and its state where it makes sense (editor, interview in progress, quiz in progress). Entry screens are never restored once the user is signed in.
- A stored draft is cleared only when the user deletes the resume or signs out of the account that owns it.

**Unsaved changes**

- The screen shows a small "Saving..." and "Saved" indicator near the title. The user can see that the work is safe.
- Because drafts are saved continuously, back normally needs no question. Show the Save, Discard, Keep editing sheet only when the draft cannot be stored (for example, storage is full or the save failed). Never use a browser-style dialog.
- Data that must be sent to the server (profile data, completed resumes) shows "Waiting to send" when the network is down, and is sent later without the user repeating anything.

**Step history inside a screen**

- A screen with sections or steps keeps a short list of the sections the user visited, in order, with no repeats on top of each other.
- Moving between sections adds to that list. Back removes the last entry and shows that section. When the list is empty, back leaves the screen.
- Only meaningful moves are recorded: section changes, form steps, and Edit or Preview switches. Small toggles (Categorized or Flat List) are not recorded.

## Per-screen back rules

The global priority order applies first on every screen. The table adds what is specific to each screen.

| Screen | Layer | Back result (after overlays and keyboard are closed) | Extra rule |
| --- | --- | --- | --- |
| Splash | Entry | Not reachable by back | Replaced by intro, login, or the main app |
| Intro screen 1 | Entry | Exit the app | Intro is not shown again after "seen" is saved |
| Intro screens 2 and 3 | Entry | Previous intro screen | Swiping and the back action agree |
| Login / sign-up | Entry | Previous step; from the first step go to intro (if never completed) or exit | After success, all entry screens are removed from history |
| Verification / one-time code | Entry | Previous step with entered data kept | Resend timer keeps running if the user returns |
| Home | Tab root | Exit app (double press on Android) | Jobs and Scholarships cards push their screens |
| Resume tab root (list of resumes) | Tab root | Go to Home | Shows drafts with a "Draft" label |
| Resume editor | Pushed | Previous section, then previous screen (see next section) | Autosave; restores section and scroll |
| Resume preview | In-screen step of the editor | Back to Edit mode | Not a separate screen |
| Export / share | Sheet over the editor | Close the sheet | Back never cancels a file that is already being saved; show progress instead |
| Resume analysis result | Pushed | Back to the editor at the same section | Result stays stored; reopening does not run it again |
| Interview tab root | Tab root | Go to Home | Shows "Continue interview" if one is in progress |
| Interview setup (role, job description) | Pushed | Previous screen with fields kept | Draft of the setup is kept |
| Interview session | Pushed | Confirmation sheet: "Pause interview? Your progress is saved." Pause leaves the screen; Keep going stays | Progress stored after each answer |
| Interview scorecard | Pushed (replaces session) | Interview tab root | Back must not return to the finished session |
| Practice tab root | Tab root | Go to Home |  |
| Roadmap / topic | Pushed | Previous screen | Scroll position kept |
| Quiz | Pushed | Confirmation sheet while a quiz is in progress; progress saved | After the quiz ends, results replace the quiz; back goes to the topic |
| More tab root | Tab root | Go to Home |  |
| Jobs search and results | Pushed | Previous screen; search text and results kept | Filters live in a sheet |
| Job details | Pushed | Back to results at the same scroll position | "Apply" opens outside the app; returning keeps the position |
| Scholarship list and eligibility checker | Pushed | Previous screen with entered values kept | Result stays until the user edits the inputs |
| Recipient directory | Pushed | Previous screen | Opening a chat app leaves the app; returning shows the same list |
| Settings pages | Pushed | Previous settings screen | Changes apply immediately or ask on back |
| Profile | Pushed (from More or avatar) | Previous screen |  |

## Resume editor in detail

The editor is one pushed screen with several sections (Contact Information, Professional Summary, Skills, and so on). Today the section chips only change internal state, which is why back skips them.

**Section handling**

1. Tapping a section chip, or the section's Next action, adds that section to the editor's step history, unless it is already the current one.
2. Back from section B, opened after section A, returns to section A with its scroll position and its field values.
3. When the step history is empty, back leaves the editor and returns to the Resume tab root (or to the screen that opened the editor).
4. The chip row scrolls so the active section is always visible and highlighted.
5. Switching sections never discards what is in the fields; the draft already holds it.

**Edit and Preview**

- Preview is a step of the editor, not a separate screen. Back from Preview returns to Edit in the same section and scroll position.
- Switching Edit and Preview is recorded in the step history; the Categorized and Flat List switch in Skills is not.

**Skills input**

- Text typed in a skill field and not yet added is part of the draft. On back, add it as a skill when it is non-empty and valid; otherwise keep it in the field.
- Adding or deleting a category, or deleting a skill, is part of the draft and survives back and reopening.
- Deleting a category shows a confirmation sheet or an Undo message. Back while this sheet is open closes the sheet only.

**Header actions**

- Export, the analysis action, and any other header action open a sheet or a pushed screen. Back returns to the exact editor state it was in, including the section and any unsaved text.
- A request in progress (analysis, export) does not block back. See Edge cases for what happens to the request.

**Opening the editor**

- Opening an existing resume restores the last section, mode, and scroll position.
- Creating a new resume starts at the first section; back from an untouched new resume leaves with no question and does not leave an empty draft in the list.

## Edge cases

| Situation | Required behavior |
| --- | --- |
| Keyboard open, user presses back | Only the keyboard closes. A second back acts on the screen |
| Bottom sheet, dialog, or picker open | Back closes only the topmost one. Tapping outside does the same |
| Floating banner (offline or info) | It is part of the layout, not an overlay. It never takes back presses and never covers the title or toolbar |
| Request in progress (resume analysis, interview answer scoring, job search, export) | Back leaves the screen. The request finishes in the background and its result is stored. Reopening shows the result or a "Still working" state. The request is never started twice |
| Request fails after the user left | The next time the user opens the screen, show the error with a Retry button and the kept inputs |
| App goes to background and the system closes it | On reopening, restore the last screen of the current tab and its draft, per Drafts and state |
| Link or notification opens a deep screen | Build the history underneath: tab root, then any needed parent, then the target. Back from the target goes to its parent, not out of the app. If the user is signed out, show login first and then continue to the target |
| User signs out | Clear all histories and drafts of that account, then show login as the only screen. Back exits the app |
| User signs in on a fresh install | Show the main app with Home as the only entry. Back never returns to login or intro |
| Another app opens (job apply, chat app) and the user returns | The same screen, scroll position, and state are shown |
| Rapid double back | The second back is ignored while a screen transition is running, so no screen is skipped |
| Orientation or window size changes | Screen, step history, and draft are kept |
| Very low memory | Drafts are already in local storage, so nothing is lost |
| Gesture and button navigation, and tablets or foldables | The same handler is used in all modes |

## Test cases and acceptance checklist

**Implementation order**

1. Create the single shared back handler and route the system back, the edge swipe, and every on-screen arrow through it.
2. Give each tab its own history and fix push versus replace on every screen listed in Per-screen back rules.
3. Move drafts and screen state into the shared store with local storage mirroring, then add restore.
4. Add step history to the resume editor, the interview setup, and the quiz.
5. Add sheet, keyboard, and mode handling to the handler.
6. Add the confirmation sheets for the interview session, quiz, and category deletion.
7. Re-check every screen against the per-screen table.

Do not install, add, or set up anything while doing this. Use what the project already has.

**Test cases (run with button navigation, gesture navigation, and the on-screen arrow)**

- [ ] Resume editor: open Contact, then Summary, then Skills. Back shows Summary, back shows Contact, back leaves the editor.
- [ ] Type a skill without pressing Add, press back, reopen: the skill is saved or still in the field.
- [ ] Add a category and two skills, close the app from the system, reopen: all are present, in the same section.
- [ ] Edit to Preview, back: Edit in the same section. Back again: previous section.
- [ ] Open the export sheet, press back: the sheet closes and the editor stays.
- [ ] Start the resume analysis, press back, reopen: the result or the "Still working" state shows, and the request ran once.
- [ ] Open the keyboard in a field, press back: only the keyboard closes.
- [ ] Open the category delete confirmation, press back: only the sheet closes.
- [ ] Switch to Practice, then Interview, then press back on a tab root: Home. Press back again: exit, with the Android double press.
- [ ] Each tab keeps its own history: open a detail in Resume, switch to Interview and back, the detail is still open.
- [ ] Interview in progress, press back: the pause confirmation shows and the progress is saved. Reopen: resume from the same question.
- [ ] Finish an interview: the scorecard shows, back goes to the Interview tab, never to the finished session.
- [ ] Quiz in progress, back: confirmation; progress kept. Finish: back goes to the topic.
- [ ] Sign in: back never returns to splash, intro, or login. Sign out: back exits the app.
- [ ] Open a link to a deep screen while signed in: back goes to its parent, then to the tab root.
- [ ] Press back twice quickly during a transition: only one screen is popped.
- [ ] Turn the phone, change the font size, and switch to dark mode on the editor: section, mode, and draft are unchanged.

**Acceptance criteria**

- [ ] One shared back handler is used by the system back, the swipe, and every arrow.
- [ ] No path loses typed data, selected answers, or the draft.
- [ ] Every per-screen row in the table behaves as written.
- [ ] No screen skips a step, exits the app early, or reopens the entry flow after sign-in.
- [ ] Nothing new was installed or set up.
