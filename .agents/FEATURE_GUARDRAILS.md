# FEATURE_GUARDRAILS.md

**Project:** ResuMentor (offline-first mobile app: Next.js static export + Capacitor)
**Purpose:** Make sure one feature never changes, redirects, breaks or "improves" anything outside its own boundary.
**Read with:** `NEXTJS_RULES.md` (NJS-xx), `CAPACITOR_RULES.md` (CAP-xx), `PRODUCTION_READINESS_RULES.md` (PRD-xx).

**Keywords:** MUST / MUST NOT = non-negotiable, a PR violating it is rejected. SHOULD = default, deviation needs a written reason in the PR.
Rule IDs use the prefix `FG-`.

---

## 0. TL;DR

1. **One PR = one feature or one fix.** No drive-by refactors, renames, or "while I was here" changes. (`FG-01`)
2. Every feature has a written **Feature Contract** (scope, routes, storage keys, APIs, offline behaviour) before code starts. (`FG-02`)
3. Features live in their own folder, expose a small public API, and **never import another feature's internals**. (`FG-05`)
4. **A feature never sends the user somewhere they did not choose to go.** All redirects are rare, central and documented. (`FG-10` to `FG-16`)
5. Background events (sync finished, network back, AI result) **never navigate**. They update state or show a toast. (`FG-13`)
6. Shared code changes are **additive and backward compatible**. Behaviour changes need a migration and a changelog. (`FG-20`)
7. Each piece of state has **one owner**. No copies, no hidden global mutation. (`FG-17`)
8. AI coding assistants follow the same rules, with a minimal diff, no invented APIs, no deleted tests. (`FG-30`)

---

## 1. Scope control

### FG-01: One change, one purpose
- A PR MUST contain a single feature, a single bug fix, or a single refactor. Never a mix.
- A PR MUST NOT include: unrelated formatting changes, file moves or renames, dependency upgrades, config changes, or style rewrites that the feature does not require.
- If you notice another bug or improvement, **open a separate issue**. Do not fix it in the same PR.
- Keep PRs small: aim for under ~400 changed lines (excluding generated files and lockfiles). Larger changes are split into stacked PRs, each releasable on its own.

### FG-02: Feature Contract (required before coding)
Create `features/<name>/FEATURE.md` from this template and get it approved in the PR or issue:

```md
# Feature: <name>
## Purpose (one sentence)
## In scope
## Out of scope (explicitly)
## Routes owned          e.g. /resume/, /resume/edit/?id=
## Storage keys owned    e.g. resumentor:v1:resume:*
## APIs used             endpoints + what happens when offline
## Other features touched  (should be "none" or a typed interface only)
## States                loading / empty / error / offline / success
## Acceptance criteria   testable bullets
## Rollback              how to disable or revert
```

- Anything not in "In scope" is out of scope. Scope additions go back through the contract.
- Reviewers reject a PR whose diff touches files outside the contract's declared areas without an explanation.

### FG-03: Touch list in every PR
The PR description MUST list:
- Files and folders changed, grouped by "feature code", "shared code", "config", "tests".
- Any change to shared code (`lib/`, `components/ui/`, config) with the reason.
- What was **intentionally not changed**.

### FG-04: Protected areas
Changes to the following need an explicit reason, a second reviewer, and a full regression run:

| Area | Why protected |
| :-- | :-- |
| `capacitor.config.ts`, `android/`, `ios/` | Affects every user and store review |
| `next.config.*`, build scripts | Can silently break the static export |
| `lib/storage/*` and migrations | Can destroy user data |
| `lib/api.ts` | Every remote call depends on it |
| `lib/routes.ts` and the root layout | Every screen depends on it |
| Global CSS, theme tokens, Tailwind config | Visual regressions everywhere |
| `package.json` dependencies | Bundle size, security, compatibility |
| Scholarship rules engine and quiz scoring | Wrong results mislead students |

---

## 2. Feature isolation

### FG-05: Folder and import boundaries

```
features/
  resume-builder/
    index.ts          <- the ONLY file other code may import from
    components/
    hooks/
    store/
    FEATURE.md
  quizzes/
  scholarships/
  roadmaps/
  jobs/
lib/                  shared, feature-agnostic utilities (api, storage, native, routes)
components/ui/        shared, feature-agnostic UI primitives
app/                  route files: thin, compose features
```

- Dependency direction: `app -> features -> lib / components/ui`. **Never** `lib -> features`, and **never** `feature A -> feature B` internals.
- A feature exports only what others need through `index.ts`. Deep imports (`@/features/quizzes/components/Card`) from outside the feature are forbidden.
- Enforce with lint (`no-restricted-imports` or an import-boundaries plugin) and make the rule a CI failure.
- Route files in `app/` stay thin: they render a feature entry component and nothing else.

### FG-06: Cross-feature communication
- If feature A truly needs data from feature B, use a **typed public function or hook exported by B**, or pass data via props from the route/page level. Never read B's storage keys directly.
- No hidden channels: no `window.*` globals, no `document.dispatchEvent` custom events, no shared mutable singletons between features.

### FG-07: Storage and API ownership
- Each feature owns a storage namespace (`resumentor:v1:<feature>:*`). Only that feature's code reads or writes it. Others go through its public API.
- Each feature owns its API calls. Shared plumbing stays in `lib/api.ts`, but endpoint-specific logic stays inside the feature.
- A feature that adds a storage key or endpoint MUST document it in its `FEATURE.md` and add a migration/test if it changes an existing shape.

### FG-08: Feature flags for risky or unfinished work
- Unfinished or risky features ship **behind a flag** that is `false` by default and defined in one file (`lib/flags.ts`).
- Because the app is offline-first, flags MUST have **safe local defaults**. A remote flag is an optional override and its absence or failure never breaks startup.
- A flag has an owner and a removal date. Remove dead flags within one release after full rollout.
- A flagged-off feature MUST be inert: no routes reachable, no listeners registered, no storage written.

### FG-09: Shared UI components
- Do not change the behaviour of a shared component for one feature's convenience. **Add an optional prop with a backward-compatible default**, or create a feature-local component.
- Do not add feature-specific logic or text inside `components/ui/*`.
- Visual changes to shared components need before/after screenshots on a small phone width.

---

## 3. Navigation and redirect discipline

The app must never "decide for the user" where to go. These rules prevent surprise redirects, loops, lost data and broken back-button behaviour.

### FG-10: Central route map
- All paths are defined once in `lib/routes.ts` (`routes.resume.edit(id)`, `routes.learn.topic(slug)`). **No hard-coded path strings** in components.
- Adding, renaming or removing a route is a protected change (FG-04). Renames need a documented one-time redirect for old links, and the old path is removed after a stated release.
- Trailing-slash rules from NJS-08 are built into the route helpers.

### FG-11: When a redirect is allowed
A redirect MAY happen only in these cases:
1. **Auth required**, and the user is not signed in (only for features that truly need auth. Resume building, quizzes and scholarship checks work signed out).
2. **First-run onboarding** that has not been completed.
3. A **documented moved route** (FG-10).
4. The user **explicitly pressed** something whose purpose is to navigate.

Everything else is **forbidden**: no redirect because data finished loading, because a request failed, because the network changed, because a timer fired, or because "this seemed like a good next step".

### FG-12: No redirect chains, no loops
- At most **one** redirect per navigation. A→B→C chains are bugs.
- Redirect guards MUST be idempotent and checked against loops (A sends to B, B sends back to A). Add a unit test for each guard with every state combination.
- Redirects run in `useEffect` / router callbacks after state is known, with a loading state while undetermined. **Never redirect on the first render** from default state (this causes flashes and wrong redirects after hydration).

### FG-13: Background events never navigate
Network back online, sync complete, AI scoring finished, storage migrated, token refreshed, push received:
- Update state and show a **non-blocking message** (toast / inline banner). Do **not** call `router.push/replace`.
- Offline/online toggling MUST NOT change the current route or remount the screen.
- Completing an async operation after the user already left the screen MUST be ignored (cancel with `AbortController`, check mounted state). It must not navigate or show stale UI.

### FG-14: Never navigate away from unsaved or in-progress work
- If a form or editor has unsaved changes, navigation is **blocked or auto-saved first**, and the user is told. Never silently discard.
- Android hardware back button and iOS swipe-back follow the same rule (CAP-10).
- Errors stay **in place** with a Retry action. An error never redirects to another page.

### FG-15: `returnTo` and open-redirect safety
- A `returnTo` parameter, when used, MUST be validated: internal path only (starts with `/`, not `//`, no scheme, no host) and in the known route map.
- Deep links and push payloads are validated the same way. Unknown targets go to a safe default (home) and never to arbitrary URLs.
- External links open via the system browser (`@capacitor/browser` or `window.open` with `noopener`), never replacing the app WebView.

### FG-16: History semantics
- `push` for forward navigation the user can go back from; `replace` for steps that should not be revisited (post-onboarding, post-save confirmation).
- Modals, bottom sheets and wizards' inner steps do **not** change the route unless explicitly deep-linkable.
- Never use `window.location.*` for internal navigation (full reload and state loss).
- First launch flow is deterministic and tested: splash, (onboarding if first run), home. It never depends on network.

---

## 4. State ownership and side effects

### FG-17: One owner per piece of state
- Every piece of data has exactly **one source of truth**. Others derive from it. No copying props into state "to edit later" without a reason and a sync rule.
- Global state is limited to genuinely global things (session, theme, network status, flags). Feature state stays inside the feature.
- Derived values are **computed**, not stored.
- Never mutate state, props, or objects loaded from storage in place. Copy, then update.

### FG-18: Side effects
- Side effects (storage writes, network calls, listeners, timers) happen in hooks/effects or event handlers. **Never during render.**
- Every effect that subscribes or starts something MUST clean up (remove listeners, clear timers, abort requests).
- Guard against **race conditions**: when a newer request or action supersedes an older one, ignore the stale result (request IDs or `AbortController`).
- No unbounded timers, polling loops or retry loops. Every loop has a cap and backoff.

### FG-19: Global side effects are forbidden in features
A feature MUST NOT: add global event listeners that outlive it, modify `document.body` styles permanently, change global CSS variables, patch prototypes, or register service workers/background tasks, unless the Feature Contract says so and a second reviewer approves.

---

## 5. Contracts and compatibility

### FG-20: Backward compatible by default
- **Storage shapes, API payloads, route paths, exported function signatures and bundled data formats are contracts.** Changes are *additive*. Never remove or repurpose a field in place.
- Breaking changes require: version bump (`schemaVersion` / `/api/v2`), a migration with tests using old-format fixtures (NJS-15), a changelog entry, and a rollback note.
- Old app versions keep working against the API for the supported window. The API MUST NOT assume all clients are the latest release.

### FG-21: Bundled data is validated
- Quiz banks, scholarship schemes, roadmaps and templates have a **schema** (e.g. Zod/JSON Schema) and a CI check that validates every file at build time.
- Each dataset has a `dataVersion`. Changing questions or eligibility rules requires a reviewer from the content side, since wrong data is a production bug.

### FG-22: Types are the contract
- Shared types live in one place per boundary (`types/` or the feature's `index.ts`). No duplicated interfaces.
- API responses are parsed/validated before use (NJS-13). Never trust `as SomeType`.

---

## 6. Change-impact process

### FG-23: Before changing shared code
1. Search every usage (`grep` / IDE "find references").
2. List affected features in the PR.
3. Run the **full** test suite and the smoke journeys (PRD-12), not just the feature's tests.
4. Attach screenshots for UI changes (small phone width, dark/light if supported).

### FG-24: Dependencies
- A new dependency needs: why it is needed, alternatives considered, bundle-size impact, maintenance status and licence. If the need is small, write a few lines of code instead.
- Never add a second library for something already solved in the project (a second date library, a second state manager, a second icon set).
- Upgrades of existing dependencies are their own PR (FG-01).

### FG-25: Config, environment and generated files
- Feature PRs MUST NOT edit generated folders (`out/`, `android/app/src/main/assets/public/`, `ios/App/App/public/`).
- Feature PRs MUST NOT change env variable names, build scripts or native config unless the feature requires it, and the PR says so.

---

## 7. Rules for AI coding assistants (Claude, Cursor, Copilot and similar)

Add a short `AGENTS.md` / `CLAUDE.md` at the repo root that points to the four rule files. Assistants MUST follow these rules, exactly like humans:

### FG-30: Assistant working rules
1. **Read first**: the Feature Contract, the relevant rule files, and the surrounding code, before editing.
2. **Minimal diff**: change only what the task needs. No reformatting, renaming, reordering imports or "cleanup" outside the task.
3. **Do not invent**: no made-up packages, props, plugin methods or config keys. Verify against `node_modules`, the lockfile, and official docs.
4. **Never delete or weaken** tests, types, validations or error handling to make something pass. Never add `@ts-ignore`, `any`, `eslint-disable`, `.skip` or `.only` to get green.
5. **No new dependency** without asking.
6. **Ask when ambiguous.** If the request conflicts with a rule, or two interpretations exist, stop and ask instead of guessing.
7. **Never touch** protected areas (FG-04) or generated folders unless the task explicitly says so.
8. **After changes**, run: `npm run lint`, `npm run typecheck`, tests, and `npm run build:mobile`. Report the actual results. Do not claim success without running them.
9. **Report**: list of files changed, what was intentionally left alone, and any risk or follow-up.
10. **No secrets** in code, comments, tests, logs or examples.

---

## 8. Review checklist (for the reviewer)

- [ ] Single purpose (FG-01), Feature Contract exists and matches the diff (FG-02)
- [ ] No imports across feature boundaries (FG-05) and no hidden shared state (FG-06, FG-17)
- [ ] No new redirects, or each one fits FG-11 and has a guard test (FG-12)
- [ ] No navigation triggered by background events (FG-13); unsaved work protected (FG-14)
- [ ] Routes come from `lib/routes.ts` (FG-10); `returnTo` validated (FG-15)
- [ ] Effects clean up, no stale-response bugs, no unbounded loops (FG-18)
- [ ] Shared code changes are additive and backward compatible (FG-09, FG-20)
- [ ] Storage or data shape changes include a migration and tests (FG-20, FG-21)
- [ ] No unrelated files changed, no new dependency without reason (FG-24)
- [ ] Offline path works and `build:mobile` passes (NJS-20)

---

## 9. Anti-patterns (reject on sight)

| Anti-pattern | Why it hurts | Do this instead |
| :-- | :-- | :-- |
| `router.push("/home")` after an API finishes | Yanks the user away mid-task | Update state, show a toast (FG-13) |
| `useEffect` redirect on first render with default state | Flash, wrong redirect, hydration issues | Wait for state, show loading (FG-12) |
| Redirect to login on any API 401 in unrelated features | Breaks offline-capable features | Handle per feature, keep local work working (FG-11) |
| Hard-coded `"/resume/edit"` strings | Silent breakage on route rename | `routes.resume.edit(id)` (FG-10) |
| Feature A reads `localStorage["resumentor:...:quiz"]` | Hidden coupling, breaks on schema change | Use feature B's exported API (FG-06, FG-07) |
| Editing a shared `Button` for one screen | Regressions across the app | New prop with default, or local component (FG-09) |
| Fixing three unrelated bugs in one PR | Impossible to review or revert | Separate PRs (FG-01) |
| `try { ... } catch {}` with empty catch | Hidden failures | Log, handle, show state (PRD-03) |
| "Temporary" global listener never removed | Leaks, duplicate handlers | Cleanup in effect (FG-18, FG-19) |
| Deleting a failing test | Hides the bug | Fix root cause (PRD-17) |
