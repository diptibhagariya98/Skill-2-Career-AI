---
description: Rule enforcing mandatory issue tracking, timestamping, and resolutions logging in docs/ISSUES_AND_RESOLUTIONS_LOG.md
globs: "**/*"
---

# Issue Logging & Submission Rule

## Requirement

Whenever an issue, bug, build failure, CLI error, mobile UI defect, or platform incompatibility is identified and addressed, it **MUST** be logged in the dedicated project log:

- **Target File:** `docs/ISSUES_AND_RESOLUTIONS_LOG.md`
- **Master Reference:** `.agents/ISSUE_LOGGING_RULES.md`

## Standard

Every logged issue entry **MUST** adhere to the following mandatory structure:

1. **Sequential ID:** `### [ISSUE-XXX] <Descriptive Title>` (e.g., `[ISSUE-011]`, `[ISSUE-012]`).
2. **Date & Timestamp:** Full date (e.g., `October 18, 2026`) and time with timezone (e.g., `07:14:00 IST`).
3. **Component / Subsystem:** List of affected file paths and modules.
4. **Severity:** `Critical` | `High` | `Medium` | `Low`.
5. **Status:** `RESOLVED` | `IN_PROGRESS` | `INVESTIGATING` | `DEFERRED`.
6. **Symptoms:** Observable behavior, device screen clipping, or verbatim terminal error.
7. **Root Cause:** Technical diagnosis of the failure.
8. **Resolution:** Exact code, configuration, or CLI command changes.
9. **Verification:** Concrete proof of fix (e.g., build passing, exit code 0).

## Formatting & Git Protocol

- Blank lines must surround all headings (`###`), lists, and fenced code blocks (`MD022`, `MD031`, `MD032`).
- Never document raw issue debugging logs inside architecture documents (`docs/RESPONSIVE_COMPACT_UI_AND_BUILD_DOCUMENTATION.md`).
- Always commit code changes and the updated issue log together in the same atomic git commit.
