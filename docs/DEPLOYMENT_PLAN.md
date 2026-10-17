# DEPLOYMENT_PLAN.md (Server Side)

**Project:** ResuMentor
**Scope:** The two server-side applications: the **Web app** and the **API**. The mobile app is **out of scope**: it is distributed as an APK and is built and shared separately. It still matters here because **already-distributed APKs keep calling this server**, so the API must stay backward compatible (DEP-03).
**Read with:** `NEXTJS_RULES.md`, `CAPACITOR_RULES.md`, `FEATURE_GUARDRAILS.md`, `PRODUCTION_READINESS_RULES.md`.

**Assumptions (change this section if your stack differs):**
- Next.js hosted on **Vercel** (web app and API as two projects from one repo).
- **Firebase** (Auth, Firestore) for cloud backup/sync.
- **Gemini API** for AI ATS scoring, called only from the server.
- Domain names are placeholders: `app.example.com` (web), `api.example.com` (API), plus staging equivalents.

Rule IDs use the prefix `DEP-`.

---

## 0. TL;DR

1. Two deployables: **Web** and **API**, each with its own Vercel project, domain and env vars. (`DEP-01`)
2. Four environments: local, preview (per PR), **staging**, **production**. Staging and production use **separate** Firebase projects and Gemini keys. (`DEP-02`)
3. The APK points at a **stable custom domain**, never a `*.vercel.app` URL, because the API URL is baked into the app. (`DEP-04`)
4. **Backward compatible API**: old APKs can't be force-updated. Additive changes only, versioned routes. (`DEP-03`)
5. Deploy path: PR preview, merge to `main`, auto-deploy to **staging**, verify, then **manual promote to production**. (`DEP-10`)
6. Database/rules changes use **expand, then contract**, and ship **before** the code that needs them. (`DEP-11`)
7. Every release has a tested **rollback** and a **kill switch** for the AI endpoint. (`DEP-14`, `DEP-15`)
8. Monitoring and cost alerts are live **before** the first user. (`DEP-16`, `DEP-18`)

---

## 1. Architecture

### DEP-01: Two deployables

```
                Users / APKs
                     |
        +------------+-------------+
        |                          |
  app.example.com            api.example.com
  (Web app, Vercel)          (API, Vercel project #2)
  Next.js, SSR allowed       /api/v1/resume/analyze
                             /api/v1/jobs
                             /api/health
                                   |
                  +----------------+----------------+
                  |                |                |
              Gemini API     Firebase Auth     Firestore
                          (verify ID tokens)   (backup/sync)
```

| | Web app | API |
| :-- | :-- | :-- |
| Purpose | Public site / web version of the product | Endpoints used by web and APK |
| Hosting | Vercel project `resumentor-web` | Vercel project `resumentor-api` |
| Domain | `app.example.com` | `api.example.com` |
| Root directory | `apps/web` (or repo root) | `apps/api` (separate deployable, see NJS-05) |
| Secrets | None server-side beyond what the site needs | `GEMINI_API_KEY`, Firebase service account, etc. |
| Scaling | Platform-managed | Platform-managed, with rate limits (DEP-08) |

- Keeping the API separate means a web deploy cannot break the APK's API, and the API can be rolled back independently.
- If you must keep a single project at first, still use the **`/api/v1`** prefix and the same rules, and plan the split.

---

## 2. Environments and configuration

### DEP-02: Environments

| Env | Purpose | Trigger | Data | URL |
| :-- | :-- | :-- | :-- | :-- |
| Local | Development | Developer machine | Firebase **emulators** | `localhost` |
| Preview | Per-PR review | Every PR | Staging services (read-mostly) | Auto preview URL |
| **Staging** | Release candidate verification | Merge to `main` | **Staging** Firebase + staging Gemini key | `staging-app...`, `staging-api...` |
| **Production** | Real users | Manual promotion | **Production** Firebase + production Gemini key | `app...`, `api...` |

Rules:
- Staging and production MUST NOT share Firebase projects, databases, service accounts, or Gemini keys.
- Never test against production data. Never copy production user data to staging without anonymising.
- Preview deployments MUST NOT use production secrets.
- A **staging APK** (pointing at the staging API) is built for testing. The production APK points at production only.

### Environment variable matrix (API project)

| Variable | Local | Staging | Production | Notes |
| :-- | :-- | :-- | :-- | :-- |
| `GEMINI_API_KEY` | dev key | staging key | production key | Server only. Budget and quota alerts per key |
| `FIREBASE_SERVICE_ACCOUNT` | emulator / none | staging SA | production SA | Server only. Least privilege |
| `FIREBASE_PROJECT_ID` | demo | staging project | production project | |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | staging web + `https://localhost` + `capacitor://localhost` | prod web + `https://localhost` + `capacitor://localhost` | Comma-separated, exact matches |
| `RATE_LIMIT_*` | relaxed | like prod | strict | See DEP-08 |
| `AI_KILL_SWITCH` | `false` | `false` | `false` | Flip to `true` to disable AI (DEP-15) |
| `MIN_SUPPORTED_APP_VERSION` | `0.0.0` | current | per support policy | DEP-03 |
| `SENTRY_DSN` (or similar) | empty | staging | production | |

Rules:
- Secrets exist **only** in Vercel's environment settings (scoped per environment) and the team's password vault. Never in the repo, chat, tickets, or screenshots.
- `.env.example` lists every variable with fake values. The deploy checklist verifies that all required variables exist in each environment (add a startup check that fails fast with a clear error if one is missing).
- Rotate secrets on a schedule and immediately if exposed (runbook DEP-19).

---

## 3. API compatibility with already-distributed APKs

### DEP-03: Backward compatibility policy
Because an APK shared outside a store cannot be force-updated, assume **multiple old versions are live at once**.

- Routes are versioned: `/api/v1/...`. Breaking changes go to `/api/v2/...`. Keep `v1` running until usage of old versions is negligible and the support window you announced has ended.
- Changes within a version are **additive only**: new optional request fields, new response fields. Never remove or rename fields, change types, or change meaning.
- The APK sends `X-App-Version: <semver>`. The server logs it (to see which versions are alive).
- `GET /api/v1/config` returns `{ minSupportedVersion, aiEnabled, message }`. The app reads it when online. If its version is below the minimum, it shows a friendly "please update" message and **keeps local features working**. It never crashes or blocks offline features.
- When an old version must stop using a feature, the server returns a clear error code (for example `UPGRADE_REQUIRED`) that the app already knows how to display. Design that error code **now**, in the first release.

### DEP-04: Stable API domain
- The API URL is compiled into the APK (`NEXT_PUBLIC_API_URL`, NJS-12). Use a **custom domain you control** (`api.example.com`), not `*.vercel.app`, so you can move hosting providers later without breaking installed apps.
- Keep the domain registration and DNS under a team account with 2FA and auto-renew. Losing the domain strands every installed APK.
- Use short DNS TTL before a planned cutover, longer once stable.

---

## 4. Prerequisites checklist (one-time setup)

- [ ] Domain registered, DNS access shared with at least two team members
- [ ] Vercel team account; projects `resumentor-web` and `resumentor-api` created; Git repo connected; production branch = `main`
- [ ] Custom domains attached; HTTPS certificates issued; HTTP redirects to HTTPS
- [ ] Two Firebase projects (staging, production); billing alerts set; Auth providers configured per project
- [ ] Gemini API keys created per environment, with **quota and budget alerts**
- [ ] Error tracking project(s) created (staging + production) with source map upload in CI
- [ ] Uptime monitor created for `/api/health` on staging and production
- [ ] Password vault entries for: registrar, DNS, Vercel, Firebase, Gemini, monitoring
- [ ] Branch protection on `main` (PRD-14)
- [ ] `AGENTS.md` / contribution docs link the rule files

---

## 5. API implementation requirements (before first deploy)

### DEP-05: CORS

```ts
// lib/cors.ts (API project)
const ALLOWED = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

export function corsHeaders(origin: string | null): Record<string, string> {
  const base = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-App-Version",
    "Access-Control-Max-Age": "86400",
  };
  return origin && ALLOWED.includes(origin)
    ? { ...base, "Access-Control-Allow-Origin": origin }
    : base;
}
```

- Every route handler implements `OPTIONS` and attaches these headers to **all** responses, including errors.
- Never use `*` together with credentials. Allowlist exact origins only (CAP-15).

### DEP-06: Authentication
- Verify the Firebase **ID token** on the server for endpoints that need identity (`Authorization: Bearer <token>`). Reject missing or invalid tokens with 401.
- Authenticated endpoints MUST NOT trust a user ID sent in the body. Take it from the verified token.
- Public endpoints (if any) are explicitly listed and still rate-limited.

### DEP-07: Request hardening
- Validate body with a schema. Enforce a **maximum body size** (a resume is small, so cap it tightly).
- Set `maxDuration` on AI routes within your plan's limits, and add an explicit upstream timeout to the Gemini call that is shorter than the platform limit, so you return a clean error and not a platform timeout.
- Return consistent error JSON: `{ "error": { "code": "RATE_LIMITED", "message": "..." } }` with correct HTTP status codes.
- Do not log request bodies. Log request ID, route, status, duration, app version.

### DEP-08: Rate limiting and abuse control
- Rate limit per user (verified token) and per IP, using a shared store (for example a managed Redis/KV), not in-memory (serverless instances don't share memory).
- AI endpoint: **per-user daily quota** and a **global daily spend cap**. When the cap is hit, return `AI_TEMPORARILY_UNAVAILABLE` (the app shows the offline-style message) and alert the team.
- Enable platform bot/DDoS protection and firewall rules available on your plan.
- Return `429` with `Retry-After`. The client honours it (PRD-06).

### DEP-09: Health and config endpoints
- `GET /api/health`: fast, no secrets, returns `{ status, version, commit }` and checks critical dependencies **lightly** (config present; optional cheap Firestore ping). Never calls Gemini.
- `GET /api/v1/config`: see DEP-03. Cached briefly.

---

## 6. Deployment procedure

### DEP-10: Pipeline

```
PR opened  ->  CI gates (PRD-14)  ->  Preview deployment
Merge to main  ->  CI gates  ->  Auto-deploy to STAGING (web + API)
Staging verification (DEP-12)  ->  Manual PROMOTE to PRODUCTION
Post-deploy verification (DEP-13)  ->  Watch dashboards 30-60 min
```

Rules:
- **Production is never deployed by a direct push or a local CLI upload.** It is promoted from a build that already ran on staging (same commit, same artifact where the platform supports promotion).
- Releases are tagged `vX.Y.Z`; the commit SHA is exposed in `/api/health`.
- Avoid deploying risky changes late in the day or right before the team is unavailable. Pick a release window when someone can watch.
- One release at a time. No overlapping deploys.

### DEP-11: Database and rules changes (expand, then contract)
Firestore rules, indexes and data shapes are deployed **separately and first**:

1. **Expand**: add new fields/indexes/rules that are compatible with the **current** code. Deploy to staging, then production.
2. Deploy the application code that uses them.
3. **Contract** (remove old fields/rules) only after all clients that need the old shape are gone. For APKs, that means after the support window (DEP-03).

Commands (run from CI or by a maintainer, **staging first**):

```bash
firebase deploy --only firestore:rules,firestore:indexes --project <staging-project-id>
# verify, then:
firebase deploy --only firestore:rules,firestore:indexes --project <production-project-id>
```

- Rules and indexes live in the repo and are reviewed like code. Test rules against the **emulator** in CI.
- Never edit production rules or data by hand in the console without a ticket and a second person.
- Enable **App Check** (where compatible with the APK flow) and keep rules least-privilege: users access only their own documents.
- Schedule automated **Firestore exports/backups**, and test a restore at least once before launch and then quarterly.

### DEP-12: Staging verification (before promotion)
- [ ] Staging deployment is the exact commit to be released
- [ ] `/api/health` OK and shows the expected commit
- [ ] A **staging APK** (pointing at the staging API) completes: AI ATS scoring online, offline message offline, sign-in, sync/backup, config endpoint
- [ ] CORS verified from web origin, `https://localhost` and `capacitor://localhost`
- [ ] **Previous APK version** still works against the new staging API (compatibility check, DEP-03)
- [ ] Rate limit and kill switch behave correctly in staging
- [ ] No new errors in staging error tracking
- [ ] Database/rules expand step (DEP-11) already applied

### DEP-13: Production deploy and post-deploy checks

1. Announce the release in the team channel (version, commit, owner).
2. Apply any **expand** changes (DEP-11) to production.
3. Promote the staging build to production.
4. Run the production smoke checks:

```bash
curl -s https://api.example.com/api/health
curl -s https://api.example.com/api/v1/config
# CORS preflight from the Capacitor origin
curl -si -X OPTIONS https://api.example.com/api/v1/resume/analyze \
  -H "Origin: https://localhost" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization"
```

5. Do one real AI request and one authenticated call using a test account and the production APK/web app.
6. Watch error rate, latency, 429s and Gemini usage for **30 to 60 minutes**.
7. Record the release (version, commit, time, notes). Post "done" in the channel.

---

## 7. Rollback and kill switches

### DEP-14: Rollback
**Triggers** (any one): error rate or latency far above baseline, auth failures, CORS failures, wrong results, a data-integrity concern, or an S0/S1 bug (PRD-15).

**Steps:**
1. Announce the rollback.
2. **API/Web:** use the hosting platform's instant rollback or re-promote the **previous production deployment**. It takes minutes. Do not "fix forward" under pressure unless the fix is tiny and tested.
3. **Rules/indexes:** because changes are expand-only (DEP-11), the old code works with the new rules. Do **not** roll back data/rules unless a rule itself is the problem.
4. Verify with the production smoke checks (DEP-13).
5. Write a short postmortem (PRD-15) and add a test or rule that prevents a repeat.

Rollback rules:
- The previous production deployment MUST remain available (do not delete old deployments).
- Never run destructive data migrations in the same release as code that depends on them.

### DEP-15: Kill switches (no deploy needed)
- `AI_KILL_SWITCH=true` disables the Gemini endpoint. It returns `AI_TEMPORARILY_UNAVAILABLE` and the app falls back to the friendly offline-style message (CAP-14).
- `GET /api/v1/config` can return `aiEnabled: false` so the app avoids calling at all.
- Switches are tested in staging before every release, and documented in the runbook. Changing a variable may require a redeploy on some platforms, so prefer a **runtime flag stored in Firestore/KV** for instant effect, and keep the env var as a backup.

---

## 8. Monitoring, alerting and cost

### DEP-16: What to monitor

| Signal | Source | Alert when |
| :-- | :-- | :-- |
| Uptime of `/api/health` | Uptime monitor (1-min interval) | 2 consecutive failures |
| 5xx rate | Platform logs / error tracking | Above threshold (for example over 2 percent for 5 min) |
| p95 latency (non-AI) | Platform metrics | Above target for 10 min |
| AI endpoint latency and failure rate | Logs | Failure rate elevated for 10 min |
| 429 / rate-limit hits | Logs | Sudden spike (abuse or bug) |
| Auth failures (401/403) | Logs | Sudden spike (token or config problem) |
| CORS rejections | Logs | Any spike after a release |
| Gemini usage and spend | Provider dashboard + budget alerts | 50, 80 and 100 percent of the budget |
| Firestore reads/writes/quota | Firebase console + alerts | Approaching quota or budget |
| App version distribution | `X-App-Version` logs | Informational (drives the support window) |
| Crash-free sessions (app) | Crash reporter (PRD-13) | Drop after a release |

Alerts go to a channel the team actually watches, with a named **on-call/owner** per release week. Every alert has a runbook link (DEP-19).

### DEP-18: Cost controls
- Hard **budget caps and alerts** on Gemini and Firebase (staging and production separately).
- AI per-user quotas and global caps (DEP-08).
- Set log retention and sampling to avoid surprise logging bills.
- Review cost weekly during the first month after launch, then monthly.

---

## 9. Security hardening

### DEP-17: Server and web
- HTTPS only with HSTS. Security headers on the web app (CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame protections) set in `next.config` for the **web target only** (they are not supported in the static export, NJS-02).
- Least-privilege service accounts. The API's Firebase service account can only do what the API needs.
- 2FA required on Vercel, Firebase, the Gemini/cloud console, the registrar and the Git host.
- Dependency audit in CI (PRD-14), and Dependabot/Renovate for security updates (in their own PRs, FG-24).
- No secrets in logs, error messages, or client bundles. Run a secret scanner in CI.
- Production access is limited to the people who need it, reviewed monthly.

---

## 10. Runbooks

### DEP-19: Incident playbooks

**A. Gemini outage or elevated errors**
1. Confirm via provider status page and logs.
2. Flip the kill switch (DEP-15). The app shows the friendly message.
3. Post a status note. Re-enable when stable, watch the error rate.

**B. Sudden spike in 429 / abuse / cost**
1. Check logs for the top IPs, users and app versions.
2. Tighten rate limits or block abusive IPs via the firewall. Lower the global AI cap.
3. If cost is at risk, kill switch first, investigate second.

**C. Bad deployment**
1. Roll back (DEP-14). 2. Verify. 3. Postmortem.

**D. Leaked or suspected-leaked secret**
1. **Rotate immediately** (create the new key, update the secret in Vercel, redeploy or restart, revoke the old key).
2. Check usage logs for misuse. 3. Find how it leaked and add a guard (scanner, rule).
4. Note: a key compiled into the APK can never be rotated for installed apps, which is why **no secret may ever be in the APK** (CAP-20).

**E. CORS failures after release**
1. Check `ALLOWED_ORIGINS` in the affected environment includes `https://localhost` and `capacitor://localhost`.
2. Run the preflight `curl` from DEP-13. Fix the variable, redeploy, verify.

**F. Firestore quota or permission errors**
1. Check the Firebase console for quota/billing. 2. Check the most recent rules deployment. 3. Revert the rules to the previous version from Git if the rules caused it.

**G. Domain or DNS problem**
1. Check registrar status, expiry, and DNS records. 2. Restore from the documented DNS export kept in the vault.

---

## 11. Ownership and documentation

- Each release has an **owner** (runs the checklist) and a **second person** (verifies staging and watches production).
- Keep in the repo: this file, an `ADR/` folder for decisions (domain choice, hosting, API versioning), `RUNBOOK.md` (DEP-19 content with real links), and `CHANGELOG.md`.
- Keep a **release log** (version, date, commit, owner, notes, issues).
- Review this plan after the first production release and after every S0/S1 incident.

---

## 12. Go-live checklist (first production launch)

- [ ] Prerequisites (section 4) all complete
- [ ] Staging verified end to end with the staging APK (DEP-12)
- [ ] Old-version compatibility policy implemented: `/api/v1`, `X-App-Version`, `/api/v1/config`, `UPGRADE_REQUIRED` handling shipped **in the first APK**
- [ ] CORS, auth, validation, size limits, rate limits, and AI quotas tested in production configuration
- [ ] Kill switch tested in staging and documented
- [ ] Monitoring, alerts, and budget caps active (DEP-16, DEP-18)
- [ ] Backups scheduled; **restore tested** (DEP-11)
- [ ] Rollback rehearsed once on staging (DEP-14)
- [ ] Secrets only in the platform vault; secret scan clean; 2FA on all accounts
- [ ] Production APK built against the **production custom domain**, with no `server.url` and no staging values (CAP-03)
- [ ] Release owner and second person assigned; release log started
