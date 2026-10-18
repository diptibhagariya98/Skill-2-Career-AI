# ISSUE_LOGGING_RULES.md

**Project:** ResuMentor (Skill-2-Career AI)  
**Applies to:** All developers, AI agents, and contributors logging, diagnosing, or resolving bugs, build failures, native platform issues, and UI/UX defects.  
**Target Log File:** [`docs/ISSUES_AND_RESOLUTIONS_LOG.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/docs/ISSUES_AND_RESOLUTIONS_LOG.md)  
**Companion Files:** `UI_UX_RESPONSIVE_RULES.md`, `CAPACITOR_RULES.md`, `PRODUCTION_READINESS_RULES.md`  

**Keywords:** **MUST** / **MUST NOT** = non-negotiable standard. **SHOULD** = standard default. Each rule has an ID (e.g., `LOG-01`) for reference in PR reviews, agent prompts, and commit messages.

---

## 0. TL;DR (The Golden Rules of Issue Logging)

1. **Every Issue Must Be Logged:** Never fix a bug, build error, or UI layout collision silently without logging it. (`LOG-01`)
2. **Dedicated Target File Only:** Always write issue entries into `docs/ISSUES_AND_RESOLUTIONS_LOG.md`. Never mix issue logs into architectural reference docs. (`LOG-02`)
3. **Sequential Identifier:** Always use the next sequential ID: `[ISSUE-001]`, `[ISSUE-002]`, ..., `[ISSUE-012]`. (`LOG-03`)
4. **Mandatory Date & Time:** Every issue entry MUST include full date (e.g., `October 18, 2026`) and local timestamp with timezone (e.g., `07:14:00 IST`). (`LOG-04`)
5. **Exact Standard Template:** Every entry MUST have: Title, Date, Timestamp, Component/Subsystem, Severity, Status, Symptoms, Root Cause, Resolution, and Verification. (`LOG-05`)
6. **No Speculation without Evidence:** Include exact terminal errors, CLI outputs, or device screenshots in Symptoms and exact verification proofs in Verification. (`LOG-06`)
7. **Markdownlint Compliant:** Surround all headings, fenced code blocks, and list items with blank lines (`MD022`, `MD031`, `MD032`). (`LOG-07`)
8. **Atomic Commit Protocol:** Commit code fixes together with their documented issue entry in the same atomic git commit. (`LOG-08`)

---

## 1. Rule Definitions

### LOG-01: Mandatory Logging for All Issues
- Any defect encountered during development, build, test, or mobile deployment **MUST** be recorded in `docs/ISSUES_AND_RESOLUTIONS_LOG.md`.
- Triggers requiring an entry:
  - CLI / Node / Build script failures (e.g., Next.js static export errors, missing environment variables).
  - Native build / toolchain errors (e.g., Gradle compilation failures, Android SDK platform mismatches, Java version incompatibilities).
  - Native runtime bugs (e.g., Android status bar overlay, camera notch clipping, back-button handling, safe-area collisions).
  - UI / UX responsive defects (e.g., overlapping navigation bars, font auto-zoom on mobile inputs, tap latency).
  - Database, Firestore, or authentication anomalies.

### LOG-02: Strict File Separation
- **MUST NOT** write issue logs or post-mortems into `docs/RESPONSIVE_COMPACT_UI_AND_BUILD_DOCUMENTATION.md` or `README.md`.
- Architectural docs describe system structure, component hierarchy, design systems, and build commands.
- `docs/ISSUES_AND_RESOLUTIONS_LOG.md` is strictly dedicated to chronological issue tracking, root causes, and resolutions.

### LOG-03: Sequential Identifiers
- Issue entries **MUST** follow three-digit zero-padded sequential naming: `[ISSUE-001]`, `[ISSUE-002]`, ..., `[ISSUE-012]`, etc.
- Before adding an entry, inspect the log file to identify the latest existing ID and increment by 1.
- Identifiers must never be reused or skipped.

### LOG-04: Timestamp & Date Standards
- Every issue header **MUST** specify:
  - **Date:** Full month name, day, and four-digit year. Example: `October 18, 2026`.
  - **Timestamp:** 24-hour time with seconds and timezone indicator. Example: `07:14:00 IST`.
- Relative timestamps like "yesterday", "earlier today", or "just now" are **STRICTLY FORBIDDEN**.

### LOG-05: Standard Entry Template
Every entry in `docs/ISSUES_AND_RESOLUTIONS_LOG.md` **MUST** follow this exact markdown template:

```markdown
---

### [ISSUE-XXX] <Descriptive Title of the Issue>

- **Date:** <Month DD, YYYY>
- **Timestamp:** <HH:MM:SS TIMEZONE>
- **Component / Subsystem:** <Exact file paths, native modules, or subsystems affected>
- **Severity:** <Critical | High | Medium | Low>
- **Status:** <RESOLVED | IN_PROGRESS | INVESTIGATING | DEFERRED>
- **Symptoms:**
  <What went wrong: observable behavior, device UI defects, or exact CLI error message>
- **Root Cause:**
  <Technical explanation of why the failure occurred: missing configs, incompatible flags, race conditions, etc.>
- **Resolution:**
  <Concrete code changes, configuration additions, CLI commands, or scripts applied to fix the issue>
- **Verification:**
  <Concrete evidence proving the resolution: passing build command output, terminal exit code 0, visual layout verification>
```

### LOG-06: Severity Classification

| Severity | Criteria | Examples |
|---|---|---|
| **Critical** | Blocks all builds, crashes app on startup, corrupts data, or exposes security credentials. | Gradle fatal build crash, broken static export script, database corruption. |
| **High** | Major feature broken, mobile UI unusable, system bars covering navigation/buttons. | Status bar overlapping header buttons, login failure, navigation bar collision. |
| **Medium** | Visual defect, touch latency, sub-optimal ergonomics, non-breaking warnings. | Missing `touch-action: manipulation`, input auto-zoom, excessive padding. |
| **Low** | Minor cosmetic styling issue, non-blocking deprecation notice, markdown lint. | Minor color mismatch, non-blocking Gradle deprecation warning. |

### LOG-07: Markdownlint Cleanliness
- Heading 3 (`### [ISSUE-XXX]`) **MUST** have 1 blank line before and 1 blank line after (`MD022`).
- Lists **MUST** have a blank line before the first list item (`MD032`).
- Fenced code blocks (` ``` `) **MUST** have a blank line before and after (`MD031`).
- Never introduce trailing whitespace or empty list markers.

### LOG-08: Atomic Commit Protocol
- Whenever code changes are made to fix an issue, the developer or agent **MUST**:
  1. Implement and test the code changes.
  2. Append the completed entry to `docs/ISSUES_AND_RESOLUTIONS_LOG.md`.
  3. Verify the log file passes markdown guidelines.
  4. Commit both the code changes and the log file in a single git commit:
     ```bash
     git add <changed-code-files> docs/ISSUES_AND_RESOLUTIONS_LOG.md
     git commit -m "fix(<scope>): <short description of fix and log entry [ISSUE-XXX]>"
     ```

---

## 2. Checklist for Submitting / Adding an Issue Entry

Before finalizing an issue log entry, verify:
- [ ] Next sequential ID used (checked against previous entries).
- [ ] Explicit date and timestamp included (e.g., `October 18, 2026`, `07:14:00 IST`).
- [ ] Component / subsystem lists actual file paths with markdown links.
- [ ] Symptoms describe real observed failures, error messages, or device screenshots.
- [ ] Root cause explains the underlying technical flaw, not just restating the symptom.
- [ ] Resolution clearly outlines what was changed, added, or deleted.
- [ ] Verification confirms tests/builds passed (e.g., `BUILD SUCCESSFUL in 8s`, `exit code 0`).
- [ ] Proper blank lines around headings, code blocks, and list items.
- [ ] Staged and committed together with code fixes.
