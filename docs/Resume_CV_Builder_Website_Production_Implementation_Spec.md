# Resume / CV Builder Website: Production Implementation Spec

A mobile-first website where a person fills in their resume details, sees a live preview, and exports an ATS-friendly PDF.

## 0. Instructions for the implementing agent (read first)

- This document is a specification only. Do not install, initialise, scaffold or set up anything on the basis of it. No project generators, no package installs, no config files, no accounts.
- No technology stack is prescribed here. Terms such as "the database", "the cache", "the background jobs", "the PDF generator" and "the client" are neutral. Use whatever the existing project already uses. If the project has nothing yet, stop and ask the owner which stack to use before writing code.
- Implement in the order given in section 17, and verify each milestone against its acceptance criteria before moving on.
- Where this document says MUST, it is a requirement. SHOULD is a strong default. MAY is optional.

## 1. Goals and non-goals

### Goals

1. A first-time user on a phone can build a complete resume in under 15 minutes.
2. Output passes ATS parsing: every piece of text in the PDF is real, selectable, correctly ordered text.
3. A live preview that matches the exported PDF exactly (same layout engine and same page breaks).
4. Data is never lost: autosave, restore, and import/export of the raw data.
5. Accessible, fast and private by default.

### Non-goals (first release)

- Job search, job matching or application tracking.
- Collaborative editing.
- AI-written content (may be added later as an optional layer).
- Image-heavy, infographic or multi-column creative designs.

## 2. Users and core flows

### Primary user

A job seeker, often on a phone, who wants a clean resume that gets through automated screening.

### Core flows

1. **Start**: landing page, then choose "Start new resume" or "Continue previous" or "Import data file".
2. **Fill**: step-by-step form, one section at a time, with progress and autosave.
3. **Preview**: full-page preview, template and style switching, page count and ATS checklist.
4. **Export**: download PDF (and optionally the raw data file).
5. **Return**: reopen later and continue editing from the saved state.

## 3. Pages and navigation

| Page | Purpose |
| --- | --- |
| Home | Value proposition, start, continue, import |
| Builder | Section-by-section form with a persistent progress indicator |
| Preview | Full-screen resume preview, template switcher, ATS checklist, export button |
| Templates | Gallery of templates with a thumbnail rendered from the user's own data |
| Settings | Page size, date format, language, font size, data management (export, import, delete) |
| Privacy and Terms | Plain-language data handling statement |
| Not found and Error | Friendly recovery pages |

### Mobile navigation

- Bottom bar with three items: **Edit**, **Preview**, **Export**.
- Inside Edit: a horizontal, scrollable step indicator at the top (Contact, Summary, Experience, Education, Skills, and so on) plus Back and Next buttons pinned at the bottom.
- Primary action buttons MUST sit within thumb reach (bottom of the screen), minimum 44 by 44 px touch target.

### Desktop layout

- Two panes: form on the left, live preview on the right.
- Below 900 px wide the preview collapses into the separate Preview page.

## 4. Data model (all resume fields)

Store the whole resume as a single structured record with a schema version number, so future changes can migrate old data.

### 4.1 Meta

- id, schemaVersion, createdAt, updatedAt
- title (internal name, for example "Resume for design roles")
- selectedTemplate, pageSize (A4 or Letter), fontScale, accentColor, dateFormat, language
- sectionOrder (ordered list of section keys) and sectionVisibility (per section on/off)

### 4.2 Contact (required: full name, email, phone or city)

- Full name (required)
- Professional headline or target title (optional)
- Email (required, validated)
- Phone (optional, international format supported)
- City, region or state, country (at least city or country recommended)
- Website or portfolio URL (optional)
- LinkedIn URL (optional)
- Other links (repeatable: label and URL, for example code profile, publication list)
- Work authorisation or availability note (optional, off by default)
- Photo: **off by default** and not included in ATS-safe templates; if offered, only in an explicitly marked "visual" template

### 4.3 Summary (optional, recommended)

- Free text, soft limit 600 characters, with a live counter and a hint of 2 to 4 sentences.

### 4.4 Work experience (repeatable, drag or button reorder)

- Job title (required)
- Employer (required)
- Location (optional)
- Employment type (full-time, part-time, contract, internship, freelance; optional)
- Start month and year (required)
- End month and year, or "Present" toggle (required one or the other)
- Achievements as a list of bullets (recommended 3 to 6; each soft limit 220 characters)
- Technologies or tools used (optional, tag list)

### 4.5 Education (repeatable)

- Institution (required)
- Degree or qualification (required)
- Field of study (optional)
- Location (optional)
- Start and end (month and year; "Expected" supported)
- Grade or GPA (optional, free text so any grading scheme works)
- Highlights (optional bullets: honours, thesis, relevant coursework)

### 4.6 Skills

- Grouped lists: group name (for example "Languages", "Tools", "Soft skills") and a list of skill tags.
- A simple flat list MUST also be possible.
- No star ratings, bars or percentages anywhere (ATS cannot read them and they carry no meaning).

### 4.7 Projects (repeatable, optional)

- Name, role, URL, start and end (optional), description bullets, technologies.

### 4.8 Certifications and licences (repeatable, optional)

- Name, issuer, issue date, expiry date (optional), credential ID, credential URL.

### 4.9 Languages (spoken) (repeatable, optional)

- Language and proficiency (native, fluent, professional, conversational, basic). Shown as text, never as graphics.

### 4.10 Awards and honours, Publications, Volunteer work, Interests, References

- Awards: title, issuer, date, description.
- Publications: title, venue, date, URL.
- Volunteer: organisation, role, dates, bullets.
- Interests: short tag list (hidden by default).
- References: default text "Available on request"; optional list of name, relationship, contact (hidden by default).

### 4.11 Custom sections

- User can add a custom section with a title and either a bullet list or free text. Titles MUST be mapped to a standard heading where possible (see ATS section).

## 5. Form experience (mobile first)

### 5.1 Principles

- One section per screen on mobile; each screen scrolls vertically with no horizontal scrolling at any width from 320 px.
- Single-column forms. Labels always visible above the field (never placeholder-only labels).
- Correct input types and keyboard hints for each field (email, phone, URL, month and year, numeric). Turn off auto-capitalisation for email and URL fields; keep it on for names.
- Month and year pickers MUST be usable by keyboard and by touch and must also accept typed text such as "03/2021".
- Repeatable items (jobs, schools) appear as collapsed cards showing title and dates; tap to expand and edit. Actions: duplicate, move up, move down, delete (with undo, no blocking confirmation dialog).
- Bullet editor: each bullet is its own line item; Enter creates a new bullet; backspace on an empty bullet removes it; paste of multi-line text splits into bullets.
- Inline hints and example text for every section (for example how to write an achievement bullet: action, scope, result).
- Progress indicator showing completed required fields; completion never blocks export, but warnings are shown.

### 5.2 Validation

- Validate on blur and on step change, never while the user is still typing the first time.
- Messages are specific and polite ("Enter an email like name@example.com").
- Required fields: full name, email, at least one of work experience or education, and a title and dates for each added entry.
- Date rules: end cannot be before start; future end dates require the "Expected" flag or "Present".
- URL fields accept entries with or without a scheme and are normalised on save.
- Strip leading and trailing whitespace, collapse repeated spaces, and remove control characters. Never strip legitimate non-Latin characters.
- The client and the server (if any) MUST both validate with the same rules.

### 5.3 Autosave and recovery

- Save automatically on every change with a short debounce (about 800 ms) and on leaving the page or hiding the tab.
- Show a small status: "Saving…", "Saved", "Offline, will save when back".
- If the user has no account, store locally on the device. If accounts exist, store in the database and keep a local copy as backup.
- Keep the last 10 revisions (timestamped) so a user can restore a previous version.
- Warn before leaving only if there are unsaved changes that could not be stored.

### 5.4 Import and export of data

- Export the raw resume data as a single portable data file (open, documented structure) so users are never locked in.
- Import MUST validate the schema version, reject malformed files with a clear message, and never execute or trust any content inside the file.
- Optional: import text from an existing resume file to pre-fill fields. Treat it as a suggestion that the user reviews, never as final data.

## 6. Preview screen and preview page

### 6.1 Requirements

- Renders the resume as paper pages (A4 or Letter) with visible page boundaries and page numbers like "Page 1 of 2".
- WYSIWYG: the preview MUST use the same layout rules as the exported PDF, including fonts, margins, line breaks and page breaks. Differences are treated as bugs.
- Updates live as the user types (debounced about 200 ms) without losing scroll position.
- Mobile: the preview fits the screen width by scaling the page down; pinch-to-zoom and double-tap-to-zoom are supported; a fit-width and a 100 percent toggle are provided.
- Desktop: side-by-side with the form, or full-screen via a button.
- Tapping a section in the preview jumps to the matching form section (nice to have).

### 6.2 Controls on the preview page

- Template picker (thumbnail strip).
- Style controls: font size (3 steps), line spacing (3 steps), margins (3 steps), accent colour (a small set of accessible colours), date format, page size.
- Section controls: show or hide and reorder sections.
- "Fit to one page" assistant: suggests (and applies on request) reduced spacing or font size and highlights content that causes an overflow. It MUST never shrink text below 9.5 pt.
- Page-count indicator and a warning when over 2 pages.
- ATS checklist panel (section 8.4).
- Export button (always visible; on mobile pinned in the bottom bar).

## 7. Templates

Ship at least four templates, all ATS-safe by default.

1. **Classic**: single column, serif headings, traditional.
2. **Modern**: single column, sans-serif, subtle accent colour on headings and rules.
3. **Compact**: single column, tighter spacing for longer histories.
4. **Academic or CV**: allows 3 or more pages, sections for publications, grants and teaching.

Template rules:

- Templates change presentation only, never the data.
- Templates MUST obey every rule in section 8.
- Switching templates is instant and never loses content.
- A template is a declarative description (layout tokens: fonts, sizes, spacing, colours, heading style) plus a rendering function. Adding a template should not require touching the form code.

## 8. ATS compatibility (critical)

### 8.1 Document structure rules

1. **Real text only.** The PDF MUST be generated as text-based content, never as a screenshot or image of the page. Every character MUST be selectable, searchable and copyable.
2. **Reading order equals visual order.** Extracting the text from top to bottom MUST give: name, contact, summary, experience, education, skills and so on, in the order shown.
3. **Single column in the main flow.** No multi-column body text, no text boxes, no sidebars that split reading order, and no tables used for layout.
4. **Standard section headings** (exact wording, user may not rename these in ATS mode): "Summary", "Work Experience", "Education", "Skills", "Projects", "Certifications", "Languages", "Awards", "Publications", "Volunteer Experience", "References". Custom sections use a plain descriptive title.
5. **Nothing important in headers or footers.** Name and contact details live in the page body on page 1. Headers and footers MAY carry only the page number and name on later pages as a convenience.
6. **No graphics for information.** No icons replacing words (write "Email:" or just the address, not an envelope icon), no skill bars, no rating dots, no charts, no photo in ATS templates.
7. **Standard bullet characters** that map to plain text (a simple round bullet or hyphen). No custom glyphs or private-use characters.
8. **Consistent dates**: one format across the document (for example "Mar 2021 to Present"). Always month and year, spelled consistently, with a standard separator.
9. **Job entries have a predictable order**: job title, employer, location, dates, then bullets. Education: degree, field, institution, dates.
10. **Links are printed as visible text** (for example the full URL or a short readable form) and are also clickable. Never hide a URL behind a vague label only.
11. **Fonts**: use standard, widely available, text-extractable families, embedded in the PDF. Body text between 10 and 12 pt, name up to 20 pt, headings 12 to 14 pt.
12. **No ligature or special-character substitution** that breaks extraction (for example fused letter pairs that extract as one odd character). Turn ligatures off in the PDF text.
13. **Hyphenation off.** Never break words with automatic hyphenation.
14. **Colours**: dark text on white. Accent colour only for headings and thin rules, with contrast of at least 4.5 to 1.
15. **Page size and margins**: A4 or Letter, margins at least 0.6 inch (15 mm).
16. **Length guidance**: aim for 1 page for under 10 years of experience, 2 pages otherwise; academic CV may exceed.

### 8.2 Content quality helpers (non-blocking)

- Detect and warn about: missing email or phone, very long bullets, bullets that start with a weak phrase ("Responsible for"), unexplained employment gaps, inconsistent date formats, missing dates, all-capitals text longer than a heading, excessive length, and placeholder text left in.
- Suggest keyword coverage: an optional "Paste a job description" box that compares words in the description to the resume and lists missing terms the user may add **only if they genuinely apply**. Processing MUST happen without storing the job description unless the user chooses to save it. Never auto-insert keywords.

### 8.3 PDF file properties

- File name: `FirstName-LastName-Resume.pdf` (ASCII-safe fallback if the name has special characters; keep the original in document metadata).
- Document metadata: title "Full Name, Resume", author full name, language tag matching the content, and no tool-identifying junk metadata.
- The PDF MUST be tagged or otherwise structured so headings and lists are identifiable by text extractors and screen readers where the generator supports it.
- Target file size under 300 KB; must never exceed 1 MB.

### 8.4 In-app ATS checklist (shown on the Preview page)

Each item shows pass, warning or fail with a one-line fix.

- Text is selectable (verified by extracting text from the generated file and comparing with the expected content).
- Single-column reading order verified.
- Standard headings present.
- Contact details present in the body.
- Date format consistent.
- No images or icons carrying information.
- Page count within the recommended range.
- Fonts embedded.
- Links readable as text.

### 8.5 Automated ATS self-test

After generating a PDF (in tests, and optionally as an in-app check), extract its text and verify:

1. The extracted text contains every non-empty field the user entered, in order.
2. There are no unexpected characters (replacement characters, private-use code points, doubled letters).
3. Section headings appear on their own lines.
4. Name and email are within the first 10 lines.

## 9. PDF export

### 9.1 Behaviour

- The "Export PDF" button generates and downloads the file with the name from 8.3.
- Same output on every device and browser: layout MUST NOT depend on the viewing device's screen width or print dialog settings.
- Export works offline if the data is stored on the device (the generator runs wherever the preview runs). If generation happens on a server, show progress, time out gracefully after 30 seconds and offer retry.
- Show a clear success state and a "Download again" link. On mobile, open in the system's file save or share sheet.
- Print-to-PDF via the browser's own print command MUST also produce a correct result using dedicated print styles (page size, margins, hidden controls, forced page-break rules), as a fallback.

### 9.2 Layout rules

- Keep each job heading together with at least its first two bullets (avoid orphan headings at the bottom of a page).
- Never split a single bullet across pages if avoidable.
- Avoid a page that contains only one or two lines (widow control).
- Long content flows to page 2 and beyond; repeat a small page footer with name and page number from page 2.
- Respect the user's chosen page size and margins exactly.

### 9.3 Quality gates

- Visual regression snapshots for each template at both page sizes with a short, a typical and a very long sample resume.
- Test with names and text in multiple scripts (Latin with accents, right-to-left, and East Asian) so extraction and fonts behave correctly; if a script is not supported, show a clear message instead of exporting broken output.

## 10. Responsive and mobile-first design

### 10.1 Breakpoints (min-width)

- Base: 320 px (default styles are the mobile styles)
- Small tablet: 600 px
- Tablet and small laptop: 900 px (side-by-side editor and preview begins)
- Desktop: 1200 px (wider preview, three-pane optional)

### 10.2 Rules

- Design and build the mobile layout first; add complexity at larger widths only.
- Use fluid layouts and relative units; no fixed pixel widths for containers.
- Support portrait and landscape; respect safe areas on devices with notches and gesture bars.
- Tap targets at least 44 by 44 px with at least 8 px spacing.
- Body text at least 16 px in forms (prevents unwanted zoom on focus in mobile browsers).
- The on-screen keyboard MUST NOT hide the focused field or the primary button; scroll the field into view.
- No hover-only interactions. No horizontal scroll except inside the zoomable preview and the step indicator.
- Respect the user's system preferences: light or dark mode (the preview page always shows paper as white), reduced motion, and larger text settings.
- Works on current and previous major versions of the common mobile and desktop browsers, and on slow connections.

## 11. Accessibility (target: WCAG 2.2 level AA)

- Full keyboard operation with a visible focus indicator.
- Every field has a programmatically associated label; errors are announced and linked to the field.
- Logical heading structure; landmarks for header, main and navigation.
- Colour contrast of at least 4.5 to 1 for text and 3 to 1 for controls.
- Drag-and-drop reordering MUST always have a non-drag alternative (move up and move down buttons).
- The preview has a text alternative or is exposed as readable structured content for screen readers.
- Do not rely on colour alone to convey status.
- Support zoom to 200 percent without loss of content.

## 12. Performance targets

- First meaningful screen in under 2 seconds on a mid-range phone over a typical mobile connection.
- Interaction response under 100 ms; preview refresh under 300 ms after typing pauses.
- PDF generation under 3 seconds for a 2-page resume on a mid-range phone.
- Initial payload kept small; load the PDF generator and heavy template code only when the user opens the Preview or Export (lazy loading).
- Fonts: limit to what templates need, load with a safe fallback so text never stays invisible.
- Works with throttled CPU and network in testing.

## 13. Security and privacy

- Resume data is personal data. Collect the minimum. State plainly what is stored, where, and for how long.
- Default to local-only storage with no account. If accounts exist: strong password rules, optional passwordless sign-in, rate limiting on sign-in and export endpoints, secure session handling, and encrypted transport and storage.
- Escape or sanitise all user text before rendering in the preview and the PDF (prevent script injection and layout-breaking content). Never render user input as raw markup.
- Validate and bound all inputs on the server (maximum lengths, maximum number of entries per section, maximum file sizes) to prevent abuse.
- Uploaded or imported files: validate type and size, process in isolation, never execute.
- One-click "Delete all my data" that removes server copies, local copies and revisions, with confirmation of completion.
- No third-party tracking of resume content. If analytics are used, they MUST be aggregate, consent-based and free of personal content.
- Public share links (if ever added) are opt-in, unguessable and revocable.
- Do not log resume content or personal fields in server logs or error reports.
- Provide data export (section 5.4) to support the person's right to take their data.

## 14. Error handling and edge cases

| Situation | Expected behaviour |
| --- | --- |
| Storage full or blocked | Warn, offer immediate data-file download as backup |
| Offline | Everything except server-only features continues to work; status shows "Offline" |
| PDF generation fails | Clear message, retry button, and the print-to-PDF fallback |
| Very long content | Warn about length; still export; never truncate silently |
| Empty optional sections | Omit the section (and its heading) from preview and PDF |
| Missing end date | Treat as invalid unless "Present" is toggled |
| Emoji or unsupported characters | Warn that ATS may drop them; allow user to keep or remove |
| Corrupt saved data | Detect, offer restore from the latest valid revision |
| Two tabs open | Last write wins with a notice; never silently overwrite newer data |
| Schema upgrade | Migrate automatically and keep a backup of the previous version |

## 15. Content and copy

- Friendly, plain, encouraging tone. Every empty state explains what to do next.
- Provide a sample resume (clearly fictional) that can be loaded to explore, and cleared in one tap.
- Provide short writing tips inline: start bullets with action verbs, quantify results, keep to relevant experience, tailor to the role.
- Internationalisation ready: all visible text comes from translatable strings; date, number and phone formats are locale aware; layout supports longer text and right-to-left scripts.

## 16. Testing and acceptance criteria

### 16.1 Test layers

1. **Unit tests**: validation rules, date handling, normalisation, section ordering, bullet splitting.
2. **Component tests**: each form section and the preview rendering for each template.
3. **End-to-end tests** on a small phone size, a tablet size and a desktop size: create resume, preview, change template, export, reload and confirm data persisted.
4. **PDF tests**: text extraction (section 8.5), page count, fonts embedded, file size, metadata.
5. **Accessibility tests**: automated scan plus manual keyboard and screen-reader pass.
6. **Performance tests**: budgets in section 12 on a throttled device profile.
7. **Security tests**: injection attempts in every field, oversized input, malformed import files.

### 16.2 Acceptance criteria (release gates)

- [ ] A new user can complete and export a resume on a 360 px wide phone without horizontal scrolling.
- [ ] All fields in section 4 can be entered, edited, reordered, hidden and deleted.
- [ ] Preview matches exported PDF page-for-page in every template and both page sizes.
- [ ] Extracted PDF text passes every check in 8.5 for all sample resumes.
- [ ] No information is lost on reload, template switch or offline use.
- [ ] Import and export of the data file round-trips with no changes.
- [ ] Accessibility checks pass at level AA.
- [ ] Performance budgets are met.
- [ ] No personal data appears in logs or third-party requests.
- [ ] "Delete all my data" removes everything and is verified.

## 17. Implementation order

1. **Foundation**: data model and schema versioning, validation rules, normalisation helpers, section registry.
2. **Builder form**: contact, summary, experience, education, skills first; then the remaining sections. Autosave and restore.
3. **Preview engine**: one template rendered to paper pages with accurate page breaks.
4. **PDF export**: from the same render source as the preview; text-extraction self-test; metadata and file naming.
5. **Mobile-first polish**: bottom navigation, step indicator, keyboard handling, zoomable preview, touch targets.
6. **More templates** and the style and section controls.
7. **ATS checklist** and content quality helpers; optional job-description keyword comparison.
8. **Data portability**: export and import data file, revision history, delete-all.
9. **Accessibility, performance and security hardening**; full test suite.
10. **Release**: privacy and terms pages, final regression of the acceptance criteria.

## 18. Definition of done

The site is done when every acceptance criterion in 16.2 is checked, the test suites pass on small-phone, tablet and desktop profiles, and a real resume exported from the product can be pasted as plain text into a text editor and read in the correct order with nothing missing or garbled.

## 19. Future enhancements (not in scope now)

- Optional AI assistance for bullet wording and tailoring (always user-reviewed).
- Cover letter builder sharing the same contact data.
- Additional locales and region-specific resume conventions.
- Shareable read-only link and a plain-text or word-processor export.
- Multiple resume versions per user with side-by-side comparison.
