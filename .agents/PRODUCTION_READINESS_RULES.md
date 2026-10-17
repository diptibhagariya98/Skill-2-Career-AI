# PRODUCTION_READINESS_RULES.md

**Project:** ResuMentor (offline-first app: Next.js static export + Capacitor, with a hosted API)
**Purpose:** Define what "production ready" means, and the testing, error-handling and release rules that keep the app free of failures during development, testing and real use.
**Read with:** `NEXTJS_RULES.md` (NJS), `CAPACITOR_RULES.md` (CAP), `FEATURE_GUARDRAILS.md` (FG), `DEPLOYMENT_PLAN.md` (DEP).

**Keywords:** MUST / MUST NOT = non-negotiable. SHOULD = default, deviation needs a written reason.
Rule IDs use the prefix `PRD-`.

---

## 0. TL;DR

1. "Done" means it passes the **gates in PRD-01**, not "it works on my machine".
2. Every external input (storage, API, deep link, file, user text) is **validated at the boundary**. (`PRD-02`)
3. Every async action has **loading, error, empty and offline states**. Errors are never swallowed. (`PRD-03`)
4. The app can **recover from corrupted local data** without a crash loop. (`PRD-04`)
5. User data is never lost: atomic saves, migrations, backups. (`PRD-05`)
6. **Every bug fix ships with a regression test.** Tests are never deleted or skipped to get green. (`PRD-08`, `PRD-17`)
7. A fixed set of **critical user journeys** is smoke-tested before every release. (`PRD-12`)
8. Crashes are visible within minutes (**crash reporting**) and releases can be **rolled back**. (`PRD-13`, `DEP-xx`)

---

## 1. Definition of production ready

### PRD-01: Gates

| Gate | When | Required |
| :-- | :-- | :-- |
| **G1: Merge** | Every PR | Lint, typecheck, unit + component tests, `build` and `build:mobile` pass (PRD-14). Review checklist in `FEATURE_GUARDRAILS.md` section 8 done. |
| **G2: Release candidate** | Before building the APK / deploying to production | G1 on `main`, E2E suite green, critical journeys (PRD-12) passed on real devices, migration test from previous version, no open S0/S1 bugs. |
| **G3: Go-live** | Deploy / distribute | Go/no-go checklist (PRD-20) signed off, rollback plan confirmed, monitoring dashboards open. |

A feature is not "done" until it passes G1, and not "shipped" until G2 and G3.

---

## 2. Input validation and data integrity

### PRD-02: Validate at every boundary
Treat all of these as untrusted: `localStorage`/IndexedDB contents, API responses, request bodies on the server, deep-link parameters, imported backup files, file/photo inputs, AI output.

- Parse with a schema (Zod or equivalent) and handle failure explicitly. Never cast with `as`.
- Server routes validate body, query and headers, enforce **size limits**, and reject with a clear 4xx. Never trust client-side validation.
- Imported backups: validate schema and version, show a preview, and **never overwrite** existing data without confirmation.
- AI responses: validate structure, cap length, render as plain text (NJS-18). If invalid, show a graceful "try again" state.

### PRD-05: Data integrity
- Writes are **atomic** (write new, verify, then swap) and **debounced**. Flush on app pause/hidden (NJS-16).
- Storage errors (quota exceeded, unavailable) are caught and shown to the user with a recovery action. Never fail silently.
- Never delete user data without **confirmation and undo** (or a recoverable trash for a period).
- Migrations are tested against fixtures from **every released schema version** (CAP-16, FG-20).
- Operations that can be retried (sync, uploads) are **idempotent**.
- IDs are generated client-side (UUID) so offline-created data never collides.

---

## 3. Error handling and resilience

### PRD-03: Error handling rules
- **No empty `catch`.** Every catch does at least one of: handle, show state, report. Never `catch {}` to silence.
- Typed errors (`ApiError`, `StorageError`, `ValidationError`), mapped to **friendly messages**. Raw error text and stack traces are never shown to users.
- Every screen that loads or saves data has these states, each designed and tested: **loading, empty, error (with Retry), offline, success**.
- **Error boundaries** around each major route/feature (resume editor, PDF export, quizzes, scholarships). A crash in one feature shows a fallback with "Go back / Reload", and never blanks the app (NJS-21).
- Global handlers (`window.onerror`, `unhandledrejection`) report to crash reporting (PRD-13). They never navigate (FG-13).
- Errors stay in place (FG-14). They never redirect.
- No `console.log` of data in production builds. Use a logger that strips or scrubs PII and is a no-op or reporter in production.

### PRD-04: Crash-loop protection
If startup fails (corrupted storage, bad migration, unexpected schema):
1. Catch the failure before rendering the main UI.
2. Show a **Recovery screen**: explain the problem, offer **"Export my data (backup)"**, **"Retry"**, and **"Reset local data"** (with confirmation).
3. Keep a **startup crash counter**. If the app failed to start N times in a row, go straight to the Recovery screen.
4. Never auto-delete data to "fix" a crash.

### PRD-06: Network resilience
- Every request: timeout, abort on unmount, typed error, and a user-visible failure state (NJS-13).
- Retries: only idempotent calls, with exponential backoff and jitter, and a cap. No retry on 4xx (except 429 with `Retry-After`).
- Handle: no network, slow network, server 5xx, 429, partial responses, and the server returning an unexpected shape.
- Debounce user-triggered calls (double taps must not send two AI requests). Disable the button while pending.
- Feature degradation: if the server is down, local features keep working (CAP-14).

---

## 4. Testing

### PRD-07: Test pyramid and tooling

| Layer | What | Tooling (suggested) | Runs |
| :-- | :-- | :-- | :-- |
| Unit | Pure logic: scholarship engine, quiz scoring, storage migrations, API client, validators, route guards | Vitest / Jest | Every PR |
| Component | Screens and states (loading/error/empty/offline) | Testing Library | Every PR |
| API / contract | Server routes: validation, auth, CORS, rate limits, error shapes | Vitest + supertest-style or route-handler tests | Every PR |
| E2E (web build) | Critical journeys in a real browser, including **offline** (`context.setOffline(true)`) | Playwright | PR (smoke) + release candidate (full) |
| Device (native) | Journeys on real Android devices with the APK | Manual matrix (CAP-30), optionally Maestro / Appium | Release candidate |
| Accessibility | Automated checks on key screens | axe | Every PR (key screens) |
| Performance | Bundle size, startup, Lighthouse on web | Lighthouse CI, bundle analyzer | Release candidate |

### PRD-08: Test rules
- Tests are **deterministic**: no real network (mock), no real time (fake timers), no randomness (seed), no dependence on test order.
- Test **behaviour users see**, not implementation details.
- **Every bug fix includes a regression test** that fails before the fix and passes after.
- Cover the awkward cases: empty data, huge data, special characters / emoji / RTL text in resumes, very long fields, slow/failed network, double taps, app killed mid-save.
- Flaky tests are **quarantined within 24 hours** and fixed within the sprint. A flaky test is never "just re-run".
- Shared fixtures for resumes, quiz banks and scheme data live in one `test/fixtures/` folder, including **old-version fixtures** for migration tests.

### PRD-09: Coverage targets (guidance, not a substitute for judgment)
- Critical logic (scholarship rules, scoring, migrations, validators, API client): **at least 90 percent** line and branch coverage.
- Overall: aim for **70 percent or more**.
- Coverage can fail a PR only for critical modules. Never write meaningless tests just to raise the number.

### PRD-10: Offline testing is mandatory
- Playwright suite runs every offline-capable journey with the network **off from the start** and also **toggled mid-flow**.
- Test: go offline during an AI request, the response arrives after leaving the screen, back-online sync, and reload while offline.
- On devices: airplane mode on a fresh install (CAP-30).

### PRD-11: Accessibility and device coverage
- Labels for all inputs, visible focus, sufficient contrast, 44 px touch targets, screen-reader names for icon buttons.
- Test at font scale 130 percent and the smallest supported screen width.
- Test on at least: one low-end Android (2 to 3 GB RAM), one mid-range Android, one recent Android, across API levels in the supported range.

### PRD-12: Critical user journeys (smoke suite)
These MUST pass on every release candidate (automated where possible, manual on device otherwise):

1. First launch (offline) reaches home. Onboarding behaves deterministically.
2. Create a resume, fill sections, add a photo.
3. Edit, kill the app, reopen: data intact (auto-save).
4. Switch template and reorder sections: no data loss.
5. Export PDF offline: the file opens and the share sheet works.
6. Take a quiz: shuffle, instant feedback, review screen, progress saved.
7. Scholarship eligibility check: known inputs give the expected eligible/ineligible results.
8. Roadmap: mark steps done and undone, progress persists.
9. Online: AI ATS scoring works. Offline: friendly offline message, no crash.
10. Upgrade from the previous version: data migrated, nothing lost.
11. Backup export and import round trip.
12. Network flaps during use: no navigation, no crash, no duplicate data.

### PRD-17: When a test fails (protocol)
1. **Reproduce** it locally and read the real error.
2. **Find the root cause.** Do not mask it with retries, longer timeouts, `skip`, `only`, snapshot updates, or loosened assertions.
3. Fix the code (or, if the test is truly wrong, fix the test with a reviewer's agreement and explain why).
4. Add or extend a test so the failure cannot return silently.
5. Never delete a failing test to unblock a merge.
6. Snapshot updates need a human review of the diff.

---

## 5. Observability

### PRD-13: Crash and error reporting
- Crash reporting in the app (web and native) with release/version tagging and source maps. Use a Capacitor-compatible reporter.
- **Scrub PII** (names, emails, phone numbers, resume text) before sending. Never attach resume contents.
- Reports are queued offline and sent when online.
- A dashboard shows crash-free sessions and top errors per release. Alert on a spike after a release.
- The server logs structured events (request ID, route, status, duration, error code). No PII, and no full request bodies.
- Analytics, if any, are minimal and optional, and never block UI.

---

## 6. CI and release gates

### PRD-14: CI pipeline (all required for merge)
1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. Unit, component and API tests
5. Data validation (quiz banks, schemes, roadmaps against schemas) (FG-21)
6. `npm run build` (web/API target)
7. `npm run build:mobile` (static export) (NJS-20)
8. E2E smoke (Playwright) on the built output
9. `npm audit --audit-level=high` (blocking for production dependencies)
10. Bundle-size check against the stored budget (PRD-18)

- `main` is protected: no direct pushes, at least one approving review, all checks green, up-to-date branch.
- Conventional commits and semantic versioning. Every release is **tagged**, with release notes.

### PRD-18: Performance and resource budgets
- Cold start to interactive: under about 2 s on a mid-range Android (measure on a low-end device and record it).
- Per-route first-load JS: set a budget per route in CI. Fail on unexplained growth (NJS-17).
- Memory: PDF export of a long resume with photo must not crash a 2 GB device. Test it.
- No leaks: listeners, timers and requests cleaned up (FG-18). No infinite re-render loops.
- No long main-thread tasks during typing. Auto-save and scoring are debounced or deferred.
- Battery and data: no background polling, no unneeded wake-ups.

---

## 7. Bug management

### PRD-15: Severity and response

| Severity | Definition | Response |
| :-- | :-- | :-- |
| **S0** | Data loss, crash on launch, security leak, app unusable | Stop other work. Hotfix. Disable server features via kill switch if relevant. Postmortem. |
| **S1** | Core journey broken (cannot save, cannot export PDF, wrong scholarship results) | Fix before the next release. Hotfix if already released. |
| **S2** | Feature degraded, workaround exists | Scheduled fix in the next release |
| **S3** | Cosmetic or minor | Backlog |

- Hotfix process: branch from the released tag, minimal fix + regression test, full smoke suite (PRD-12), release, merge back to `main`.
- Every S0/S1 gets a short written postmortem: what happened, why it was not caught, what test or rule prevents it next time. Add the rule to these files when it is generalisable.

---

## 8. Server-side production rules (summary, details in `DEPLOYMENT_PLAN.md`)

### PRD-19
- Every endpoint: authenticated (or intentionally public), validated, rate-limited, size-limited, timeout-bounded.
- LLM endpoints (Gemini): per-user daily quota, global spend cap, timeout, and graceful failure. Never loop-retry.
- CORS allowlist includes the web origin, `https://localhost` and `capacitor://localhost` (CAP-15).
- **Backward compatibility with old APKs.** APKs distributed outside a store cannot be force-updated, so the API MUST keep serving every released app version for a stated support window (FG-20). Version the API (`/api/v1`), only make additive changes, and keep a `minSupportedVersion` behaviour that **degrades gracefully** (a clear "please update" message), never crashes.
- Health endpoint, structured logs, alerts, and a **kill switch** for AI features.
- Secrets live only in the hosting provider's secret store and are rotated if exposed.

---

## 9. Go / no-go checklist

### PRD-20: Before any release

**Code and tests**
- [ ] G1 gates green on the release commit
- [ ] E2E suite green (including offline scenarios)
- [ ] Critical journeys (PRD-12) passed on real devices (low-end Android included)
- [ ] Migration from the previous released version verified with real data
- [ ] No open S0 or S1 bugs. S2 list reviewed and accepted

**Quality**
- [ ] No unhandled errors in console on a clean install
- [ ] No new redirects or navigation side effects (FG-11 to FG-16)
- [ ] Performance budgets met (PRD-18)
- [ ] Accessibility checks on key screens

**Operations**
- [ ] Crash reporting active with source maps for this version (PRD-13)
- [ ] Server deployed to **staging** first and verified against this exact build (`DEPLOYMENT_PLAN.md`)
- [ ] Rollback plan written and tried (previous server deployment promotable, previous APK retained)
- [ ] Kill switch tested
- [ ] Release notes written, version tagged, and APK archived with its checksum

**Security**
- [ ] No secrets in bundle or repo (CAP-20, NJS-12)
- [ ] `npm audit` reviewed
- [ ] CORS, rate limits and auth verified on the production API
