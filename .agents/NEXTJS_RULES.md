# NEXTJS_RULES.md

**Project:** ResuMentor (offline-first mobile app, packaged with Capacitor)
**Applies to:** All code under the Next.js app (`app/`, `components/`, `lib/`, `public/`, `next.config.*`).
**Companion file:** `CAPACITOR_RULES.md`.

**Keywords:** MUST / MUST NOT = non-negotiable, a PR violating it is rejected. SHOULD = default, deviation needs a written reason in the PR.
Each rule has an ID (e.g. `NJS-03`) so reviewers can cite it.

---

## 0. TL;DR

1. We ship **two targets** from one codebase: the **web/API deployment** (full Next.js, e.g. Vercel) and the **mobile build** (static export bundled in Capacitor). Every change must work for both. (`NJS-01`)
2. The mobile build uses `output: "export"`. **No server features** may be required by any page that ships in the mobile app. (`NJS-02`)
3. API routes (Gemini, jobs) live on the **hosted deployment only**. The app calls them through `NEXT_PUBLIC_API_URL`. (`NJS-05`)
4. Browser-only code is guarded or lazy-loaded with `ssr: false`. (`NJS-09`)
5. `NEXT_PUBLIC_*` is public and inlined at build time. **Never put a secret in it.** (`NJS-12`)
6. Dynamic routes need `generateStaticParams`, or use query parameters instead. (`NJS-07`)
7. Use `trailingSlash: true` and `images.unoptimized: true` for the mobile export. (`NJS-03`)
8. Offline-capable features never wait on the network. (`NJS-14`)
9. `npm run build:mobile` MUST pass in CI before merging. (`NJS-20`)

---

## 1. Dual-target architecture

### NJS-01: Two builds, one codebase

| | Web / API deployment | Mobile build (Capacitor) |
| :-- | :-- | :-- |
| Command | `next build` | `BUILD_TARGET=mobile next build` |
| Output | Server build | Static `out/` folder |
| API routes | Yes | **No** |
| SSR / middleware / server actions | Allowed (web only) | **Not allowed** |
| Env file | `.env.production` | `.env.mobile` (via env vars in the script) |
| Hosted at | Vercel (or similar) | Inside APK/IPA |

- Any page or component that is part of the mobile experience MUST be fully client-renderable.
- Server-only features (API routes, admin pages, SSR-only SEO pages) are kept in clearly marked areas and **excluded from the mobile build** (see NJS-05).

### NJS-02: Features that are forbidden in mobile-shipped code
With `output: "export"`, Next.js does not support (or cannot export) the following. Do not use them in anything the app ships:

- `getServerSideProps`, per-request SSR, `cookies()`, `headers()`, `searchParams` read on the server for dynamic output
- Middleware / `proxy`, rewrites, redirects, custom `headers()` in `next.config`
- Server Actions
- ISR / `revalidate`, draft mode
- The default Image Optimization loader
- Dynamic route segments **without** `generateStaticParams` (see NJS-07)
- Route Handlers that depend on the incoming request (only fully static `GET` handlers can be exported)

Always check the official "Static Exports" page for the Next.js version in use. The supported-features list changes between versions.

### NJS-03: `next.config.ts` baseline

```ts
import type { NextConfig } from "next";

const isMobile = process.env.BUILD_TARGET === "mobile";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isMobile
    ? {
        output: "export" as const,
        trailingSlash: true,          // /resume/ -> /resume/index.html (reliable in WebView)
        images: { unoptimized: true } // no optimizer server in the app
      }
    : {}),
};

export default nextConfig;
```

- Do not put `rewrites`, `redirects` or `headers` under the mobile branch. They are ignored or cause the export to fail.
- Do not switch `output: "export"` on globally. It would break the API routes on the hosted deployment.
- `distDir` stays default so the export lands in `out/` (matches Capacitor `webDir`).

### NJS-04: Required `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:mobile": "cross-env BUILD_TARGET=mobile next build",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": { "cross-env": "^7" }
}
```

(Use `cross-env` so the script works on Windows, macOS and Linux CI.)

### NJS-05: API routes and the mobile build
The in-app bundle cannot contain server code. Choose **one** strategy and document it in the README:

1. **Recommended: separate deployable.** Put API routes in a deployable that is never exported (second Next.js app in a monorepo, or a standalone backend). The mobile app contains no `app/api` at all.
2. **Single repo, build-time exclusion.** The mobile build script excludes `app/api` (and any server-only route groups) before `next build`, then restores them. This is fragile. It MUST be scripted, tested in CI, and must never leave the working tree dirty.

In both cases:
- Client code calls APIs **only through the API client** (NJS-13), never with relative `/api/...` paths in the mobile build (relative URLs resolve to `https://localhost/api/...` inside the app and fail).
- The hosted API MUST allow CORS from `https://localhost` and `capacitor://localhost` (see `CAPACITOR_RULES.md` CAP-15), authenticate callers, and rate-limit AI endpoints.

---

## 2. Routing and pages

### NJS-06: Navigation
- Use `next/link` and `useRouter` for in-app navigation. Never use `window.location.href` for internal routes (full reload, breaks state).
- Do not depend on server redirects. Perform redirects client-side (`router.replace`) after checking local state.
- Handle "unknown route" with a client-side not-found page (`not-found.tsx`) that offers a way home.

### NJS-07: Dynamic routes
In a static export, every dynamic path must be known at build time.

```tsx
// app/learn/[topic]/page.tsx
export const dynamicParams = false;

export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.slug })); // topics bundled with the app
}
```

- For **user-generated IDs** (e.g. a resume ID) you cannot pre-generate pages. Use **query parameters** on a single static page: `/resume/edit/?id=abc123`, and read the ID client-side (`useSearchParams` inside a `<Suspense>` boundary).
- Wrap `useSearchParams` consumers in `<Suspense>`, otherwise the export build fails.

### NJS-08: File-style URLs and WebView
- `trailingSlash: true` is required so each route exports to `route/index.html`. Without it, direct loads of nested routes can 404 in the WebView.
- Always write internal links with a trailing slash (`/learn/`), to avoid redirect-like behaviour.
- Test hard navigation: open a deep page, reload, and use back/forward on both Android and iOS.

---

## 3. Client/server boundaries and browser APIs

### NJS-09: Guard browser-only code
Pre-rendering runs in Node. Browser APIs (`window`, `document`, `localStorage`, `navigator`, `indexedDB`) do not exist there.

```tsx
"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Heavy / browser-only libs (PDF, canvas) are loaded on demand, client-only
const PdfExporter = dynamic(() => import("@/components/PdfExporter"), { ssr: false });

export function useLocalValue<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch { /* corrupted or unavailable: keep initial */ }
  }, [key]);
  return [value, setValue] as const;
}
```

- Read browser storage in `useEffect`, **not** during initial render, to avoid hydration mismatches.
- Wrap every `localStorage` / `JSON.parse` in try/catch. Storage can be unavailable or corrupted.
- `"use client"` goes on the smallest component that needs it. Do not mark whole page trees as client without need, but since the mobile app is client-driven, correctness beats micro-optimisation.

### NJS-10: Hydration safety
- Do not render values that differ between server and client on first paint (`Date.now()`, `Math.random()`, `window.innerWidth`, locale-dependent formats). Compute them after mount.
- Quiz answer shuffling MUST happen on the client after mount (or be seeded), otherwise hydration warnings appear.

### NJS-11: Third-party scripts
- No runtime CDN scripts or fonts for features that must work offline (CAP-11). Bundle with npm and `next/font`.
- Analytics or tracking scripts (if any) MUST be optional, non-blocking, and silently skipped when offline.

---

## 4. Environment variables and secrets

### NJS-12: Rules
- `NEXT_PUBLIC_*` values are **inlined into the JS at build time**. They are public and cannot be changed after the app is built and shipped.
- **Never** put these in a `NEXT_PUBLIC_*` variable or in client code: Gemini keys, service-account credentials, DB URLs, admin tokens.
- Keep server secrets only in the hosted deployment's environment settings, read only in server code (API routes).
- Use separate files: `.env.local` (dev), `.env.production` (web), `.env.mobile` (mobile). Do not commit real secrets. Commit a `.env.example` listing every variable name with fake values.
- Because the API URL is baked in at build time, **changing the API host requires a new app release**. Pick a stable domain (e.g. `api.yourdomain.com`), not a throwaway preview URL.

```env
# .env.example
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_FIREBASE_API_KEY=public-web-key-only
```

---

## 5. Data fetching and API client

### NJS-13: One API client, always with timeout
All remote calls go through a single module (`lib/api.ts`):

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(public code: "OFFLINE" | "TIMEOUT" | "HTTP" | "UNKNOWN", message: string, public status?: number) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new ApiError("OFFLINE", "You are offline.");
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new ApiError("HTTP", `Request failed (${res.status})`, res.status);
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === "AbortError") throw new ApiError("TIMEOUT", "The request timed out.");
    throw new ApiError("UNKNOWN", "Network error.");
  } finally {
    clearTimeout(timer);
  }
}
```

- No `fetch("/api/...")` scattered in components.
- UI maps `ApiError.code` to friendly messages (offline / timeout / server error). Raw error text is never shown to users.
- Retries: only for idempotent requests, with backoff and a cap. Never auto-retry AI calls in a loop (cost).
- Validate API responses (e.g. with a schema library) before using them. Never trust the shape.

### NJS-14: Offline-first rules for features
- Resume builder, PDF export, quizzes, scholarship engine, and roadmaps MUST work with **zero network calls** on their critical path.
- Pure logic (e.g. `engine.ts` scholarship rules) MUST be **deterministic, pure, and unit-tested**, with no `fetch`, `window`, or `Date.now()` hidden inside (pass dependencies in).
- Data the app needs offline (quiz banks, scheme data, templates) is **bundled at build time** (imported JSON/TS), not fetched. Version it (`dataVersion`).
- Online-only features show a clear offline state before attempting the call, not after a long hang.

---

## 6. State and storage in the app code

### NJS-15: Storage abstraction
- Components never call `localStorage` directly. They use `lib/storage` which wraps: environment guards, try/catch, JSON parse safety, `schemaVersion` + migrations, debounced writes, and (on native) the Capacitor-appropriate backend.
- Keys are namespaced and centralised in one file (`resumentor:v1:resume:<id>`). No magic strings in components.
- State shape changes require a **migration** and a unit test with an old-format fixture.

### NJS-16: Forms and auto-save
- Auto-save is debounced and flushes on `visibilitychange` (hidden), `pagehide`, and Capacitor `App` pause events, because mobile OSes can kill the app without notice.
- Show save status ("Saved on this device"). Do not fail silently when storage is full.

---

## 7. Performance

### NJS-17: Budgets and practices
- Track the First Load JS per route (`next build` output). Fail review if a route grows unexpectedly. Use the bundle analyzer when adding libraries.
- Lazy-load heavy modules: PDF generation, charts, rich editors, per-subject quiz banks.
- Fonts via `next/font` (self-hosted at build). Limit weights and subsets.
- Images: pre-optimise assets before committing (since `unoptimized: true` means no automatic resizing). Use modern formats, proper dimensions, and explicit `width`/`height` to avoid layout shift.
- Memoise expensive derived data (ATS-style scoring, filtering). Avoid re-rendering big lists on each keystroke (use debouncing, `useDeferredValue`, or virtualisation).
- Framer Motion: animate `transform`/`opacity` only, keep animated trees small, and respect `prefers-reduced-motion`. Test on a low-end Android.

---

## 8. Security

### NJS-18: Client security
- Never use `dangerouslySetInnerHTML` with user or API content. If rich text is needed, sanitise with a vetted library and a strict allowlist.
- Do not put PII in URLs, query strings (beyond opaque IDs), logs, or analytics events.
- Treat API responses (including AI output) as untrusted text. Render as text, never as code/markup.
- Keep dependencies patched. `npm audit` runs in CI.

### NJS-19: Server (hosted API) security, for the web deployment
- Authenticate and rate-limit `/api/resume/analyze` and any LLM-backed endpoint. Enforce request size limits, input validation, and per-user quotas, otherwise it is an open door to your AI bill.
- CORS: explicit allowlist (web origin, `https://localhost`, `capacitor://localhost`). Never `*` with credentials.
- Never log full resume contents.

---

## 9. Code quality and CI

### NJS-20: Required CI gates (all must pass to merge)
1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. Unit tests (scholarship engine, storage migrations, API client, quiz scoring)
5. `npm run build` (web target)
6. `npm run build:mobile` (**static export target**)
7. `npm audit --audit-level=high` (report-only at first, then blocking)

The mobile build step catches the most common breakage: someone adds a server feature or an un-exportable dynamic route.

### NJS-21: Conventions
- TypeScript `strict: true`. No `any` without a comment. No `@ts-ignore` without a linked reason.
- Folder layout (recommended):

```
app/                 routes (client-friendly pages)
components/          UI components
lib/
  api.ts             API client (NJS-13)
  storage/           storage abstraction + migrations (NJS-15)
  native/            Capacitor wrappers with web fallbacks
  scholarship/engine.ts   pure rules engine
data/                bundled quiz banks, schemes (versioned)
public/              static assets
```

- Capacitor plugin imports live **only** in `lib/native/*`.
- One component per file, small and focused. No business logic inside JSX.
- Accessibility: labelled inputs, focus order, contrast, semantic elements, and minimum touch target size 44 px.
- Error boundaries on each major route (resume editor, PDF export, quiz) so one crash does not blank the whole app.

---

## 10. Pre-merge and pre-release checklists

### Every PR
- [ ] No new server-only feature in mobile-shipped code (NJS-02)
- [ ] Browser APIs guarded or in `useEffect` / `ssr:false` (NJS-09)
- [ ] No secrets or `NEXT_PUBLIC_` misuse (NJS-12)
- [ ] API calls go through `apiFetch` with timeout and typed errors (NJS-13)
- [ ] Offline path tested (airplane mode in the browser DevTools at minimum)
- [ ] Storage shape changes include a migration + test (NJS-15)
- [ ] `build` **and** `build:mobile` pass locally
- [ ] Bundle size impact checked if a dependency was added

### Before each release
- [ ] `build:mobile` produced a fresh `out/` using the **production** `.env.mobile`
- [ ] `NEXT_PUBLIC_API_URL` is the production HTTPS API
- [ ] Deep links and reloads tested for every route type (static, dynamic, query-param)
- [ ] All bundled data versioned and validated
- [ ] No console errors on first launch in a clean install
- [ ] Follow the pre-release checklist in `CAPACITOR_RULES.md` (section 11)

---

## 11. Common errors and fixes

| Error / symptom | Cause | Fix |
| :-- | :-- | :-- |
| `Page "/x/[id]" is missing "generateStaticParams()"` | Dynamic route in static export | Add `generateStaticParams` or switch to query params (NJS-07) |
| `Route /api/... couldn't be rendered statically` | API route included in the export build | Separate or exclude API routes (NJS-05) |
| `useSearchParams() should be wrapped in a suspense boundary` | Missing `<Suspense>` | Wrap the component (NJS-07) |
| `Image Optimization using the default loader is not compatible with export` | `next/image` without `unoptimized` | `images: { unoptimized: true }` in mobile config (NJS-03) |
| `window is not defined` / `localStorage is not defined` | Browser API during prerender | Guard, `useEffect`, or `dynamic(..., { ssr: false })` (NJS-09) |
| Hydration mismatch warning | Client-only values on first render | Compute after mount (NJS-10) |
| `Failed to fetch` only in the app | CORS or relative `/api` URL | Use `apiFetch` + `API_BASE`; fix CORS allowlist (NJS-05, NJS-13) |
| Deep page 404 inside the app | Missing `trailingSlash` or non-exported route | NJS-03, NJS-08 |
| API URL change has no effect | `NEXT_PUBLIC_*` inlined at build | Rebuild and release a new app version (NJS-12) |
| Redirects in `next.config` ignored in app | Not supported in export | Client-side `router.replace` (NJS-06) |

---

## 12. Definition of Done (feature level)

A feature is done only when:
1. It works in `next dev` **and** in the exported mobile build running inside Capacitor.
2. It behaves correctly offline, or clearly explains why it cannot.
3. It has loading, empty, error and offline states.
4. It is tested (unit tests for logic, manual device test for native interactions).
5. It adds no secrets, no server-only dependency, and no unexplained bundle growth.
