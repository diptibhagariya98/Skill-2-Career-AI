# Phase 3: Scholarship Matching & Directory and Learn & Practice Hub (Implementation Spec)

Two feature modules that sit beside the resume builder: a scholarship eligibility engine with a recipient registry, and a hub of learning roadmaps and practice quizzes.

## 0. Instructions for the implementing agent (read first)

- This is a specification only. Do not install, initialise, scaffold or set up anything because of it. No package installs, project generators, config files, accounts or keys.
- No technology stack is prescribed. Terms such as "the server", "the database", "the cache", "the background jobs" and "the messaging link" are neutral. Use what the project already uses. If something this spec needs does not exist, stop and ask the owner before choosing a tool.
- Scheme rules, amounts, deadlines and links are **data entered and verified by an admin from the official source**. Never hard-code them, and never fill them in from memory or from a model's guess.
- The two modules are independent. Build them one at a time (Part A, then Part B) and release each separately.
- MUST means required. SHOULD is a strong default. MAY is optional.

## 1. Prerequisites

- [ ] Sign-in, a person profile and sign-out exist (needed for saved eligibility profiles and the directory).
- [ ] An admin role with a protected admin area exists, with an audit trail of changes.
- [ ] The server can validate input, rate-limit, keep secrets and log without personal content.
- [ ] The mobile-first layout, navigation shell and accessibility baseline from the main spec are in place.
- [ ] A way to send an email or in-app notice to a person exists (for verification and moderation messages).

## 2. Scope

### In scope

- **Part A**: Eligibility engine for central and state scholarship schemes (including MYSY), a scheme directory, and a recipient registry with direct messaging links.
- **Part B**: Learning roadmaps with progress tracking, and multiple-choice practice quizzes with immediate answer validation.
- An admin area to manage schemes, recipients, roadmaps and quizzes.

### Out of scope (this phase)

- Submitting scholarship applications on the person's behalf.
- Payments, document storage for applications, or any government portal integration.contine
- AI-generated eligibility decisions. Eligibility is rule-based and explainable.
- Timed, ranked or competitive exams.

---

## 3. Part A: Scholarship Matching & Directory

### 3.1 Goals

1. A student enters a few facts and, within seconds, sees which schemes they are eligible for, likely eligible for, or not eligible for, and exactly why.
2. Every result links to the official source and shows when the rule was last verified.
3. Students can reach successful scholars for help, safely and with the scholar's consent.

### 3.2 Screens

| Screen | Purpose |
| --- | --- |
| Scholarships home | Start the eligibility check, browse all schemes, open the directory |
| Eligibility form | Short step-by-step form (section 3.3) |
| Results | Grouped list: Eligible, Check details, Not eligible, each with reasons |
| Scheme detail | Benefit, criteria, documents, deadline, how to apply, official link, last verified date |
| Scheme directory | Searchable, filterable list of every active scheme |
| Scholar directory | Verified recipients who offered help (section 3.8) |
| Scholar profile | One recipient's offer of help and the contact action |
| My scholar listing | A recipient manages their own listing, visibility and requests |
| Admin | Scheme manager, recipient verification queue, reports queue |

Mobile first: one question group per screen, bottom navigation, large touch targets, results readable without horizontal scrolling.

### 3.3 Eligibility form (student inputs)

The form asks only for what the active schemes actually use. Fields marked \* are required for a result; others improve accuracy.

| Field | Type | Notes |
| --- | --- | --- |
| State of domicile \* | Choice | Needed for state schemes |
| Social category \* | Choice | List is admin-managed because schemes use different category sets; includes "Prefer not to say" which only removes category-specific schemes from the results |
| Annual family income \* | Number with unit | Entered in one unit with a clear label (per year); the form accepts values such as 600000 and shows the figure back in words and in lakh |
| Current level of study \* | Choice | School class, diploma, undergraduate, postgraduate, doctoral |
| Last qualifying result \* | Number plus scale | CGPA with its scale (out of 10, out of 4 or other) or a percentage; see 3.6 for conversion |
| Class 12 or last board result | Percentage | Used by schemes that set an entry marks threshold |
| Course or stream | Choice | Optional; used by course-specific schemes |
| Institution type | Choice | Government, aided, private, university; optional |
| Gender | Choice | Optional; used by schemes for women or other groups |
| Disability | Yes, no, prefer not to say | Optional |
| Year of study | Number | Optional |

Rules:

- Validate each field with sensible ranges and clear messages (income cannot be negative; a percentage cannot exceed 100; a CGPA cannot exceed its scale).
- A guest can run the check without saving anything. A signed-in person MAY save the profile to reuse it; saving requires a clear opt-in.
- Sensitive inputs (income, category, disability, gender) are used only to compute the result and are never shown to anyone else, never logged, and never sent to analytics.

### 3.4 Scheme data model

Each scheme is one record managed in the admin area.

| Field | Notes |
| --- | --- |
| Name, short name, level | Central, state, institution or private; state name when state |
| Issuing body and official source link | Required for publishing |
| Benefit | Text plus optional amount fields (amount, unit, frequency) |
| Eligibility criteria | A structured rule group (section 3.5) |
| Required documents | List of document names |
| Application window | Opens, closes, and a status: upcoming, open, closed, always open |
| How to apply | Short steps and the official application link |
| Notes | Edge conditions the rules cannot express |
| Last verified date and verified by | Required for publishing |
| Status | Draft, in review, published, retired |
| Version | Increments on each published change, with the previous version kept |

A published scheme MUST have an official source link and a last verified date. A published scheme not re-verified within a configurable period (default 90 days) is flagged to admins and shows a "May be out of date, check the official site" notice to students.

### 3.5 Eligibility rule model

Criteria are stored as data, not as code, so admins can change them without a release.

- A **rule** is: a student field, an operator, and a value (or two values for ranges).
- Operators: equals, not equals, is one of, is not one of, less than, less than or equal, greater than, greater than or equal, between, is provided.
- A **rule group** combines rules and other groups with ALL (and) or ANY (or).
- Each rule has a **kind**: *hard* (failing it means not eligible), or *soft* (failing it means "check details"), and an optional human-readable label for the result screen (for example "Family income limit").
- A rule can depend on a field being present; when the student left that field blank, the rule is reported as **unknown** rather than failed.
- Income comparisons are inclusive or exclusive exactly as the scheme states (stored per rule), and always compare the same unit.

### 3.6 Eligibility engine behaviour

The engine is a pure, deterministic function: the same inputs and the same scheme versions always give the same output.

**Step by step**

1. Load all published, non-retired schemes (cached; refreshed when a scheme is published).
2. Normalise the student's inputs: units, scales, trimmed values.
3. Convert the result to the scale each rule expects. Conversion between CGPA and percentage uses a rule set stored as data (for example a per-university multiplier or a custom formula), shown to the student as "We estimated {value}% from your CGPA; check your university's method". If no conversion applies, ask the student for the percentage.
4. Evaluate every rule group for every scheme.
5. Classify each scheme:
   - **Eligible**: all hard rules pass and no rule is unknown.
   - **Check details**: all hard rules pass but some rules are unknown or soft rules fail.
   - **Not eligible**: at least one hard rule fails.
6. For each scheme produce reasons: every rule with its result (met, not met, unknown), the student's value and the required value in plain words ("Your family income is 7,50,000; the limit is 6,00,000").
7. Sort results: Eligible first, then Check details, then Not eligible; within a group by nearest deadline, then by benefit amount.
8. Return the results with the scheme versions used and the evaluation time.

The result screen ALWAYS shows: "This is a guide based on information we verified on {date}. Confirm on the official website before applying."

**Also provide "What would change this?"**: for each Not eligible scheme with exactly one failed rule, show that single rule (for example "Need CGPA 7.0 or above"). Never suggest changing facts the student cannot change.

### 3.7 Scheme directory

- Searchable by name and text; filters: level, state, benefit type, course, status (open now), closing soon.
- Cards show name, issuing body, benefit, deadline and status; tapping opens the scheme detail.
- "Open now" and "closing within 30 days" are computed from the stored dates.
- Students can save schemes and optionally get a reminder before the deadline (in-app or email, opt-in).

### 3.8 Recipient registry (scholar directory)

A directory of people who received a scholarship and chose to help applicants. It lets an applicant reach a scholar through a direct messaging link.

#### Listing data (provided by the scholar, all optional except where noted)

| Field | Notes |
| --- | --- |
| Display name \* | First name or a chosen name; full legal name is never required |
| Scheme received \* | Chosen from the scheme directory |
| Year awarded \* | Year |
| Course and institution | Optional |
| State | Optional |
| Languages spoken | Optional, used for filtering |
| Ways I can help | Choices: understanding eligibility, documents, filling the application, interview, general questions |
| Short note | At most 300 characters, plain text |
| Messaging number \* | The number used for the direct chat link |
| Contact mode \* | See below |
| Availability | For example weekdays, evenings; free text, short |

#### Contact modes (the scholar chooses)

1. **Approve requests (default)**: an applicant sends a short request (a message of up to 300 characters). The scholar sees it in their requests list and accepts or declines. Only after accepting does the applicant get the chat link.
2. **Open to messages**: signed-in applicants see a **Message on WhatsApp** button that opens a chat with the number and a prefilled polite opening message. Numbers are never printed as plain text on the page and never appear in page source in a form that can be copied in bulk.

The scholar can switch mode, pause the listing or delete it at any time. Deleting removes the number and all requests.

#### Eligibility to be listed

- Must be signed in, aged 18 or over (confirmed by a checkbox declaration and enforced as a policy), and must accept the directory terms.
- **Verification**: the scholar uploads proof of the award (for example an award letter). An admin reviews it and approves or rejects with a reason. After the decision, the proof file is deleted. Only verified listings appear in the directory, with a "Verified" badge and the verification date.
- Re-verification MAY be requested after a configurable period.

#### Applicant side

- Must be signed in to view contact actions.
- Filters: scheme, state, course, language, ways of helping.
- Contact actions are rate-limited per person (for example 5 requests or messages per day) and per scholar (for example 20 new requests per week) so scholars are not overwhelmed.
- Show a short safety note before the first contact: never pay anyone for a scholarship, never share bank or password details, and report suspicious behaviour.

#### Safety and moderation

- Every listing and every request has a **Report** action with reasons (spam, asking for money, harassment, fake listing, other).
- Scholars can block an applicant; blocked applicants cannot send further requests.
- Admins have a reports queue: review, warn, suspend a listing or ban a person, with every action logged.
- Automatic checks reject listings or notes that contain money requests, external links to payment pages or promotional content.
- A listing with repeated reports is hidden automatically until reviewed.
- Never show an applicant's income, category or any eligibility data to a scholar.

#### Privacy

- The scholar's number is used only to build the chat link and is stored encrypted; it is revealed only according to the chosen contact mode.
- Explain in plain language, before a scholar lists, what will be visible, to whom, and how to remove it.
- Contact requests and messages are not stored beyond what is needed for the request flow; conversations happen in the messaging app, outside this product.
- **Delete all my data** removes the listing, the number, the requests and the saved eligibility profile.

### 3.9 Admin area for Part A

- Scheme manager: create, edit, preview the result for a test student, submit for review, publish, retire. Changes need a second person to approve before publishing (when more than one admin exists).
- Test console: enter a sample student and see every scheme's classification and reasons, to check rules before publishing.
- Verification queue for recipients and reports queue for moderation.
- Staleness list: schemes past the re-verification period.
- Full audit trail: who changed what, when, from which version.

### 3.10 Part A edge cases

| Situation | Expected behaviour |
| --- | --- |
| Income exactly equals a limit | Follows the rule's inclusive or exclusive setting |
| Income entered in the wrong unit | The form shows the figure in words and lakh before submitting |
| CGPA scale unknown | Ask for the scale or percentage; never guess silently |
| Student leaves optional fields blank | Related rules become "unknown", the scheme moves to Check details |
| A scheme is closed | Shown under Not eligible with the reason "Applications are closed", or hidden by a filter |
| No scheme matches | Friendly message with the closest schemes and the "What would change this?" hints |
| Scheme changed after a result was shown | Saved results show the version date and a prompt to re-check |
| Scholar's number invalid | Reject at entry with a format check; unreachable numbers are reported through the report action |

---

## 4. Part B: Learn & Practice Hub

### 4.1 Goals

1. Give people clear, step-by-step learning pathways they can follow at their own pace.
2. Let them test themselves with short multiple-choice quizzes and get the correct answer and a reason immediately.
3. Keep progress so people can pick up where they left off.

### 4.2 Screens

| Screen | Purpose |
| --- | --- |
| Hub home | Continue where you left off, featured roadmaps, quiz topics |
| Roadmap list | All roadmaps with category, estimated time and progress |
| Roadmap detail | Ordered stages, each with steps and resources |
| Step detail | The step's content, resources and a mark-as-done control |
| Quiz list | Topics and quizzes with question counts and best score |
| Quiz player | One question at a time with instant feedback |
| Quiz result | Score, review of every question, retry options |
| My progress | Roadmap progress and quiz history |
| Admin | Roadmap editor, question bank editor, import, review queue |

### 4.3 Roadmaps

#### Content model

| Level | Fields |
| --- | --- |
| Roadmap | Title, short description, category, audience level, estimated total time, status (draft, in review, published, retired), version, last updated |
| Stage | Title, short description, order |
| Step | Title, summary, body text, estimated time, order, optional prerequisite steps, resources, optional linked quiz |
| Resource | Title, type (article, video, document, tool), link or text, optional note |

#### Behaviour

- Roadmaps show as an ordered vertical path on mobile with clear done, current and upcoming states (shown with text labels and icons, never colour alone).
- Steps can be marked done and undone. Progress shows as steps done out of total, per stage and overall.
- Prerequisites are advisory: a locked-looking step MUST still be openable; the screen shows "Recommended first: {step}".
- Each step may link to a quiz; finishing the quiz with a pass mark offers to mark the step done.
- "Continue" always opens the next not-done step.
- Guests can read roadmaps; progress for guests is stored on the device and offered to be saved on sign-in.
- Roadmaps can be linked from other modules (for example a scholarship scheme can link a "How to apply" roadmap, and the resume builder can link a "Write a strong resume" roadmap).
- All external resource links open in a new view with a visible indicator that they leave the product.

The owner decides the first roadmaps. Suggested starting categories, to be confirmed by the owner: scholarship application basics, resume and interview preparation, and study skills.

### 4.4 Practice quizzes

#### Question model

| Field | Notes |
| --- | --- |
| Question text | Plain text; optional image with alternative text |
| Options | 2 to 6 options, each plain text |
| Correct answer(s) | One option (single choice) or several (multiple correct, labelled "Select all that apply") |
| Explanation | Required; why the correct answer is correct and why a common wrong answer is wrong |
| Topic and tags | For grouping and filtering |
| Difficulty | Easy, medium, hard |
| Status and version | Draft, in review, published, retired |

A quiz is a named, ordered or randomised set of questions with: title, topic, description, question count, pass mark, and settings for shuffling questions and options.

#### Player behaviour (immediate answer validation)

1. One question per screen with a progress indicator ("Question 3 of 10").
2. The person selects an option and taps **Check answer**. For single-choice quizzes, MAY also auto-check on selection if the person has chosen that in settings.
3. Feedback appears instantly: **Correct** or **Not quite**, the right answer highlighted with a text label (never colour alone), and the explanation.
4. A **Next** button moves on. The person cannot change an answer after it is checked (the explanation is already shown).
5. A running score is shown. Skipping is allowed; skipped questions are offered again at the end.
6. Answer options are shuffled per attempt when the quiz setting is on; the correct answer is tracked by option id, never by position.
7. Progress is saved after each answer so an interrupted quiz can be resumed.
8. Feedback appears in under 100 ms. The answer key for a practice quiz is delivered with the quiz so feedback is instant and works offline; if graded or ranked modes are added later, validation MUST move to the server.

#### Result screen

- Score as number correct out of total and a percentage, with a pass or not-yet label against the pass mark.
- Review list: every question with the person's answer, the correct answer and the explanation; filter to "Only the ones I missed".
- Actions: **Retry all**, **Retry only missed**, **Back to topic**, and a link to the related roadmap step when one exists.
- Save the attempt to history for signed-in people (score, date, per-question outcome); guests keep it on the device.

#### Progress and history

- Per quiz: attempts, best score, last score, average, and a simple trend over the last attempts.
- Per topic: percentage correct across all attempts, with weak-topic suggestions ("You miss most questions about documents. Try this roadmap step.").

### 4.5 Admin area for Part B

- Roadmap editor with stage and step ordering by move up and move down (and drag where available), preview, submit for review, publish, retire, version history.
- Question bank editor with the fields in 4.4, duplicate detection, preview in the player, and validation (at least two options, at least one correct answer, explanation present, no duplicate options).
- Bulk import of questions from a simple tabular data file with a downloadable template; the import shows a row-by-row report of errors before anything is saved.
- Quiz builder: pick questions by topic and difficulty, set pass mark and shuffle settings.
- Review queue: content needs approval before publishing when more than one admin exists.
- Every change is audited; published content keeps previous versions.

### 4.6 Part B edge cases

| Situation | Expected behaviour |
| --- | --- |
| Question edited after people attempted it | History keeps the question text and version used at the time |
| Quiz has fewer questions than its count setting | Use all available and show the real count |
| Person leaves mid-quiz | Resume prompt next time, with an option to start over |
| Offline | Roadmaps and already-opened quizzes work; progress syncs when online |
| Roadmap step removed after a person marked it done | Progress recalculates; no error |
| Very long explanation | Scrolls within the feedback area; the Next button stays visible |

---

## 5. Cross-cutting requirements

### 5.1 Responsive and mobile first

- Same breakpoints and rules as the main spec (320 px base, wider layouts added progressively).
- Touch targets at least 44 by 44 px; no hover-only actions; no horizontal scrolling except inside data tables, which scroll inside their own container.
- The on-screen keyboard never hides the focused input or the primary button.

### 5.2 Accessibility (WCAG 2.2 level AA)

- Full keyboard use and visible focus; labels for every input; errors announced and linked to fields.
- Quiz feedback is announced to screen readers; correct and incorrect are communicated by text and icon, not colour alone.
- Roadmap progress is exposed as real lists with state text.
- Support zoom to 200 percent and respect reduced-motion and larger-text settings.

### 5.3 Performance

- Eligibility result in under 1 second after submit for the full scheme set; scheme list and directory pages load their first screen in under 2 seconds on a mid-range phone.
- Quiz question transitions under 100 ms; roadmaps and quizzes are cached for repeat visits.
- Lists are paged (for example 20 items at a time) with a clear "Load more".

### 5.4 Security and privacy summary

- Validate and bound every input on the server; reject unknown fields; sanitise and display all user-provided text as plain text.
- Admin actions require the admin role and are audited; sensitive admin actions require recent re-authentication.
- Rate-limit eligibility checks, directory searches, contact requests, verification uploads and reports.
- Encrypt contact numbers and any saved eligibility profile at rest. Never log them. Never include them in analytics or error reports.
- Uploaded verification files: check type and size, store privately, delete after the decision.
- Provide data export and "Delete all my data" covering the saved profile, the listing, requests, progress and quiz history.
- Publish plain-language terms for the directory and a privacy notice that names every kind of data collected in this phase.

### 5.5 Content responsibility

- Scheme information, roadmaps and questions are reviewed by a named person before publishing, and the last reviewed date is shown.
- Every scheme page states that the official source is authoritative.

---

## 6. Interfaces (neutral)

| Endpoint | Purpose |
| --- | --- |
| Evaluate eligibility | Input: student facts; output: classified results with reasons |
| List and search schemes | Filters, paging |
| Get scheme | Full detail |
| Save and delete eligibility profile | Signed-in only |
| List scholars | Filters, paging, verified only |
| Create, update, pause and delete my listing | Scholar only |
| Submit verification proof | Scholar only |
| Send, list, accept, decline contact requests | Applicant and scholar |
| Report and block | Signed-in only |
| List roadmaps, get roadmap | Public |
| Save and read roadmap progress | Guest on device, signed-in on server |
| List quizzes, get quiz | Public |
| Save quiz attempt, read history | Guest on device, signed-in on server |
| Admin actions for schemes, recipients, reports, roadmaps, questions, quizzes, imports | Admin only |

### Error messages (examples)

| Code | Message shown |
| --- | --- |
| invalid\_value | "Check this value and try again." |
| income\_unit | "Please confirm: is this amount per year?" |
| scale\_missing | "Tell us the scale for your CGPA, such as out of 10." |
| not\_signed\_in | "Sign in to contact a scholar." |
| rate\_limited | "You've reached today's limit. Try again later." |
| listing\_pending | "Your listing is waiting for verification." |
| blocked | "This person is not accepting messages from you." |
| offline | "You're offline. This will sync when you're back." |

---

## 7. Build order

### Part A

1. Scheme data model, the rule model and the admin scheme manager with the test console.
2. The eligibility engine as a pure function with a full unit-test suite, before any screen.
3. Eligibility form and results screens, then the scheme directory and detail pages.
4. Saved profile, saved schemes and deadline reminders.
5. Recipient registry: listing creation, verification queue, directory, contact modes, requests.
6. Safety: reports, blocking, rate limits, automatic content checks, moderation queue.
7. Privacy features: encryption, deletion, export, terms and notices.

### Part B

8. Content models and the admin editors for roadmaps and questions, including import.
9. Roadmap screens and progress tracking.
10. Quiz player with instant feedback, result review and history.
11. Links between modules (roadmap steps to quizzes, schemes to roadmaps).
12. Hardening: accessibility, performance, security review, full test run.

## 8. Test plan

### Eligibility engine

- Every operator with passing, failing, boundary and unknown values; inclusive and exclusive limits.
- Hard versus soft rules; ALL and ANY groups; nested groups.
- Scale conversion and the "ask for percentage" path.
- Determinism: the same input twice gives byte-identical output.
- Reasons text correct for every rule result.
- A set of fixed sample students with expected classifications for every published scheme, re-run on every scheme change.

### Directory and safety

- Contact mode behaviour: approval flow, open mode, blocked applicant, paused and deleted listings.
- Numbers never appear in page source or lists except through the permitted flow.
- Rate limits per applicant and per scholar; report thresholds hide a listing.
- Under-18 declaration and verification flow.
- Verification files are deleted after the decision.

### Hub

- Quiz scoring, shuffling by option id, multiple-correct questions, skip and resume.
- Progress recalculation after content edits.
- Offline use and sync after reconnecting.
- Import: valid file, invalid rows, duplicates, partial failure handling.

### Across everything

- End-to-end flows on small phone, tablet and desktop sizes.
- Keyboard and screen-reader passes on the form, the results, the directory and the quiz player.
- Security tests: injection in every text field, oversized input, access to admin endpoints without the role, access to another person's data.

## 9. Acceptance criteria

### Part A

- [ ] A student completes the eligibility form on a 360 px wide phone and sees grouped results with a reason for every scheme.
- [ ] Every result shows the official link and the last verified date.
- [ ] Changing any one input changes only the results that depend on it.
- [ ] A scheme cannot be published without an official link and a verified date.
- [ ] Stale schemes show the notice and appear in the admin staleness list.
- [ ] A scholar's number is never visible except through the chosen contact flow.
- [ ] Only verified listings are shown, and verification files are deleted after the decision.
- [ ] Reports, blocks and rate limits work as specified.
- [ ] Sensitive inputs never appear in logs or analytics.

### Part B

- [ ] Every roadmap shows ordered stages and steps, with progress that updates on done and undone.
- [ ] A quiz gives correct or not-quite feedback with the explanation immediately after each answer.
- [ ] The result screen lists every question with the person's answer, the correct answer and the explanation.
- [ ] An interrupted quiz resumes at the right question.
- [ ] Progress and history are kept for signed-in people and on the device for guests.
- [ ] Admins can import questions with a clear row-by-row error report.

### Both

- [ ] Accessibility checks pass at level AA.
- [ ] Performance budgets in 5.3 are met.
- [ ] Delete all my data removes everything this phase stores about a person.

## 10. Definition of done

The phase is done when every acceptance item is checked, the test plan passes on small-phone, tablet and desktop profiles, an admin can add and publish a scheme, a roadmap and a quiz without any code change, and a student can check eligibility, find a verified scholar and practise a quiz entirely on a phone.

## 11. Open questions for the owner

- Which central and state schemes should be loaded first, and who verifies their rules and dates?
- Which social category list and grade-conversion rules should be used for the launch region?
- Should the scholar directory start with approval-only contact, or allow open messaging from the start?
- Which roadmaps and quiz topics should ship first, and who writes and reviews them?
- Should guests be allowed to see the scholar directory, or must everyone sign in first?
