# Server-Side PDF Generation & Multi-Template Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fragile client-side `html2pdf.js` with a high-fidelity server-side Next.js headless PDF generation engine (`/api/resumes/export`) supporting 6 professional ATS templates and seamless, crash-free delivery on both Web and native Android (Capacitor).

**Architecture:** A universal `ResumeDocument` React component serves as the single source of truth for both the in-app preview and headless Chromium rendering (`renderToStaticMarkup`). On the server, `puppeteer-core` auto-resolves Microsoft Edge / Chrome in Windows dev and `@sparticuz/chromium-min` on Vercel to generate vector PDFs with real selectable text and `@page` print pagination. Delivery occurs via direct stream download on Web and `@capacitor/filesystem` Cache + `@capacitor/share` Sheet on Android.

**Tech Stack:** Next.js 14 App Router, `puppeteer-core`, `@sparticuz/chromium-min`, `zod`, React 18 (`react-dom/server`), Tailwind CSS, `@capacitor/filesystem`, `@capacitor/share`, `@capawesome-team/capacitor-file-opener`.

**Spec:** [docs/superpowers/specs/2026-10-19-server-side-pdf-generation-design.md](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/docs/superpowers/specs/2026-10-19-server-side-pdf-generation-design.md)

## Global Constraints
- Zero `any` policy (TypeScript strict, typed errors, `unknown` with type guards).
- Mandatory TypeScript Enums for discrete states, templates, and error codes (`ResumeTemplateId`, `ExportStatus`, `ExportErrorCode`).
- Zero hardcoded magic strings or validation regex in UI components.
- Zero canvas rasterization or `html2canvas` inside the Android WebView.
- Single source of truth: `ResumeDocument` renders identically in preview and printed PDF.

---

### Task 1: Core Types, Enums & Zod Schema Validation

**Files:**
- Modify: `src/types/resume.ts`
- Create: `src/lib/resume/schema-zod.ts`
- Modify: `src/lib/resume/schema.ts`
- Test: `scripts/test-resume-schema.mjs`

**Interfaces:**
- Consumes: Existing `ResumeData` interface from `src/types/resume.ts`.
- Produces: `ResumeTemplateId` enum, `ExportStatus` enum, `ExportErrorCode` enum, `ResumeZodSchema`, updated `createEmptyResume` and `createSampleResume` supporting 6 template IDs.

- [ ] **Step 1: Install `zod` dependency**
Run: `npm install zod`

- [ ] **Step 2: Update `src/types/resume.ts` with Enums and expanded templates**
Add `ResumeTemplateId` enum (`CLASSIC`, `MODERN`, `COMPACT`, `ACADEMIC`, `MINIMALIST`, `CREATIVE`), `ExportStatus` enum (`IDLE`, `PREPARING`, `GENERATING`, `READY`, `FAILED`), and `ExportErrorCode` enum. Update `TemplateId` type alias to match `ResumeTemplateId`.

- [ ] **Step 3: Create `src/lib/resume/schema-zod.ts`**
Implement the strict Zod validator validating all `ResumeData` fields (contact, summary, experience, education, skills, projects, certifications, meta). Enforce string arrays for bullets and hex color constraints.

- [ ] **Step 4: Update `src/lib/resume/schema.ts`**
Add predefined sample profiles for all 6 templates in `createSampleResume(templateId?: ResumeTemplateId)`. Ensure `createEmptyResume` sets defaults properly.

- [ ] **Step 5: Write and run verification script**
Create `scripts/test-resume-schema.mjs` using Node.js to validate sample resumes against `ResumeZodSchema`.
Run: `node scripts/test-resume-schema.mjs`
Expected: PASS with 6/6 template samples validated successfully.

- [ ] **Step 6: Commit**
```bash
git add src/types/resume.ts src/lib/resume/schema-zod.ts src/lib/resume/schema.ts scripts/test-resume-schema.mjs package.json package-lock.json
git commit -m "feat(resume): add strict enums, zod validation schema, and 6-template definitions"
```

---

### Task 2: Multi-Template Suite & Universal `ResumeDocument` Component

**Files:**
- Create: `src/components/resume/templates/ClassicTemplate.tsx`
- Create: `src/components/resume/templates/ModernTemplate.tsx`
- Create: `src/components/resume/templates/CompactTemplate.tsx`
- Create: `src/components/resume/templates/AcademicTemplate.tsx`
- Create: `src/components/resume/templates/MinimalistTemplate.tsx`
- Create: `src/components/resume/templates/CreativeTemplate.tsx`
- Create: `src/components/resume/ResumeDocument.tsx`
- Modify: `src/components/resume/ResumePreview.tsx`
- Test: `scripts/test-render-templates.mjs`

**Interfaces:**
- Consumes: `ResumeData`, `ResumeTemplateId` from Task 1.
- Produces: `ResumeDocument` pure React component capable of rendering both in React DOM and via `renderToStaticMarkup`.

- [ ] **Step 1: Create the 6 template components in `src/components/resume/templates/`**
Implement pure, semantic, ATS-compliant layouts:
  - `ClassicTemplate.tsx`: Traditional serif, centered header, formal horizontal dividers.
  - `ModernTemplate.tsx`: Clean sans-serif, dynamic accent line, badge pills.
  - `CompactTemplate.tsx`: 1-Page high-density layout with 8mm padding, inline dividers, compact skills.
  - `AcademicTemplate.tsx`: Formal CV, chronological publications, grants, citations, awards.
  - `MinimalistTemplate.tsx`: Clean Swiss typography, borderless sections, high readability.
  - `CreativeTemplate.tsx`: Two-tone accent banner header, dual-column structure.

- [ ] **Step 2: Create `src/components/resume/ResumeDocument.tsx`**
Root presentation component:
  - Accepts `{ resume: ResumeData, isPrintMode?: boolean }`.
  - Dispatches to the appropriate template component based on `resume.meta.selectedTemplate`.
  - Applies `@page { size: A4 portrait; margin: 12mm 14mm; }`, `.page-break-avoid { break-inside: avoid; }`, and `h2 { break-after: avoid; }` print styles.
  - No client-only hooks or DOM APIs (pure presentation for SSR and static markup).

- [ ] **Step 3: Refactor `src/components/resume/ResumePreview.tsx`**
Update `ResumePreview` to wrap `ResumeDocument` with client-side zoom, responsive container scaling, and A4 canvas framing.

- [ ] **Step 4: Create and run static markup render test**
Create `scripts/test-render-templates.mjs` using `react-dom/server` (`renderToStaticMarkup`) to verify that all 6 templates render without errors.
Run: `node scripts/test-render-templates.mjs`
Expected: PASS with 6 HTML strings generated with proper section headers and zero undefined elements.

- [ ] **Step 5: Commit**
```bash
git add src/components/resume/templates/ src/components/resume/ResumeDocument.tsx src/components/resume/ResumePreview.tsx scripts/test-render-templates.mjs
git commit -m "feat(resume): implement 6 ATS templates and universal ResumeDocument component"
```

---

### Task 3: Headless Chromium Engine & Next.js Export Route

**Files:**
- Install: `puppeteer-core`, `@sparticuz/chromium-min`
- Create: `src/lib/server/pdfRenderer.ts`
- Create: `src/app/api/resumes/export/route.ts`
- Modify: `src/constants/endpoints.ts`
- Test: `scripts/test-pdf-export.mjs`

**Interfaces:**
- Consumes: `ResumeDocument` from Task 2, `ResumeZodSchema` from Task 1.
- Produces: `POST /api/resumes/export` endpoint that returns a downloadable vector PDF stream.

- [ ] **Step 1: Install Puppeteer and Chromium packages**
Run: `npm install puppeteer-core @sparticuz/chromium-min`

- [ ] **Step 2: Implement `src/lib/server/pdfRenderer.ts`**
  - Auto-resolve browser executable: checks Windows Edge/Chrome paths first on local dev (`msedge.exe`, `chrome.exe`).
  - Falls back to `@sparticuz/chromium-min` in serverless / Linux production.
  - Injects print stylesheet (`@page`, fonts, page break avoids).
  - Configures `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })`.
  - Ensures browser instances are properly closed in `finally` blocks to prevent zombie processes.

- [ ] **Step 3: Implement `src/app/api/resumes/export/route.ts`**
  - Route handler with `export const dynamic = "force-dynamic"` and `export const runtime = "nodejs"`.
  - Validates request body with `ResumeZodSchema`.
  - Renders `ResumeDocument` with `renderToStaticMarkup`.
  - Invokes `generateResumePdf(html)`.
  - Returns binary `Response(pdfBuffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="..."' } })`.

- [ ] **Step 4: Update `src/constants/endpoints.ts`**
Register `RESUME_EXPORT: `${API_BASE}/api/resumes/export`` in `API_ROUTES`.

- [ ] **Step 5: Write and run end-to-end PDF export test**
Create `scripts/test-pdf-export.mjs` that runs `generateResumePdf` directly and checks:
  1. PDF file is created and size is > 5KB and < 500KB.
  2. First 5 bytes are `%PDF-`.
  3. Text is extractable and selectable.
Run: `node scripts/test-pdf-export.mjs`
Expected: PASS with verified `%PDF-` output.

- [ ] **Step 6: Commit**
```bash
git add src/lib/server/pdfRenderer.ts src/app/api/resumes/export/route.ts src/constants/endpoints.ts scripts/test-pdf-export.mjs package.json package-lock.json
git commit -m "feat(api): implement server-side headless PDF generation route"
```

---

### Task 4: Client & Native Android Delivery Flow Integration

**Files:**
- Modify: `src/shared/platform/savePdf.ts`
- Modify: `src/components/ResumeBuilder.tsx`
- Modify: `src/components/resume/StepIndicator.tsx` (or template selector)
- Test: `scripts/test-client-delivery.mjs`

**Interfaces:**
- Consumes: `/api/resumes/export` endpoint from Task 3.
- Produces: Seamless export button handling in `ResumeBuilder.tsx` with Web browser download and Android native Share Sheet.

- [ ] **Step 1: Refactor `src/shared/platform/savePdf.ts`**
  - Add `exportResumeFromServer(resume: ResumeData): Promise<SavePdfResult>`.
  - Performs `fetch(API_ROUTES.RESUME_EXPORT, { method: 'POST', body: JSON.stringify({ resume }) })`.
  - Web: Creates Object URL from blob and triggers `<a download>`.
  - Android (Capacitor): Reads ArrayBuffer, writes to `Directory.Cache` via `@capacitor/filesystem`, triggers native `@capacitor/share` sheet, with fallback to `@capawesome-team/capacitor-file-opener`.

- [ ] **Step 2: Update `src/components/ResumeBuilder.tsx`**
  - Replace `html2pdf.js` client call with `exportResumeFromServer`.
  - Wire state transitions using `ExportStatus` enum (`IDLE`, `PREPARING`, `GENERATING`, `READY`, `FAILED`).
  - Add friendly user status and error toasts with retry capability.

- [ ] **Step 3: Update Template Switcher UI**
  - Expose all 6 template options (`classic`, `modern`, `compact`, `academic`, `minimalist`, `creative`) with icons and descriptive badges in the builder's design controls.

- [ ] **Step 4: Commit**
```bash
git add src/shared/platform/savePdf.ts src/components/ResumeBuilder.tsx
git commit -m "feat(client): integrate server-side PDF export with Android native share sheet"
```

---

### Task 5: End-to-End Verification, ATS Quality Gate & Build Check

**Files:**
- Test: `scripts/verify-all-templates-pdf.mjs`
- Verify: Full TypeScript compilation and Next.js build

- [ ] **Step 1: Write multi-template PDF batch test**
Create `scripts/verify-all-templates-pdf.mjs` generating PDFs for all 6 templates in parallel and validating headers, file sizes, and non-empty text content.
Run: `node scripts/verify-all-templates-pdf.mjs`
Expected: 6/6 PDFs successfully generated in output directory.

- [ ] **Step 2: Run linter and build check**
Run: `npm run lint` and `npm run build`
Expected: 0 errors, successful production build.

- [ ] **Step 3: Commit and summarize**
```bash
git add scripts/verify-all-templates-pdf.mjs
git commit -m "test: add multi-template PDF verification test suite and quality gate"
```
