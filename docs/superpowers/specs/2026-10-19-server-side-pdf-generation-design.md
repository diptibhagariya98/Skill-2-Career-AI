# Architecture Design Specification: Server-Side PDF Generation & Multi-Template Delivery Engine

- **Date:** 2026-10-19
- **Target Project:** ResuMentor (`Skill-2-Career-AI-1`)
- **Status:** Proposed Specification for User Approval

---

## 1. Executive Summary & Goals

### 1.1 Objective
Move PDF compilation from client-side WebViews (`html2canvas` / `html2pdf.js`) to a dedicated server-side rendering pipeline in Next.js (`/api/resumes/export`). The solution must:
1. **Work in One Try with Zero Overhead**: Launch reliably without complex binary compilation, fragile system packages, or slow retry loops.
   - **Local / Windows Development**: Auto-detects native Microsoft Edge or Google Chrome executables already installed on the OS (instant launch, 0 MB downloaded).
   - **Vercel Serverless Production**: Leverages `@sparticuz/chromium-min` + `puppeteer-core` with optimized compressed Lambda layers.
2. **Exact 100% Visual Parity**: The same `ResumeDocument` React component draws both the client interactive preview and the server-rendered vector PDF.
3. **Instant Front-End Delivery**:
   - **Web**: Direct binary stream download (`Content-Disposition: attachment; filename="Firstname_Lastname_Resume.pdf"`).
   - **Android APK (Capacitor)**: Downloads the generated PDF to the app's cache directory via `@capacitor/filesystem`, then surfaces the native Android Share Sheet (`@capacitor/share`) and system PDF viewer (`@capawesome-team/capacitor-file-opener`).
4. **Rich Multi-Template Suite**: Expand beyond basic templates to provide 6 polished, ATS-optimized templates with pre-configured sample data profiles.

---

## 2. System Architecture

```
+-----------------------------------------------------------------------------------+
|                              Client Layer (Web & Android)                         |
|                                                                                   |
|  +--------------------------------+       +------------------------------------+  |
|  | ResumeBuilder (Live UI)        |       | Template Selector & Presets        |  |
|  | - Debounced autosave to local  |       | - classic, modern, compact,        |  |
|  | - Syncs with Supabase profiles |       |   academic, minimalist, creative   |  |
|  +---------------+----------------+       +-----------------+------------------+  |
|                  |                                          |                     |
|                  v                                          v                     |
|  +-----------------------------------------------------------------------------+  |
|  |                        Universal ResumeDocument Component                   |  |
|  |                (Shared single source of truth for UI and Print)             |  |
|  +-----------------------------------------------------------------------------+  |
|                                          |                                        |
|                          POST /api/resumes/export (JSON)                          |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        Server Layer (Next.js Node.js Route)                       |
|                                                                                   |
|  1. Validate Payload with Zod Schema (strict types, ATS constraints)              |
|  2. Resolve Browser Executable (Auto-detect Edge/Chrome on Win, @sparticuz on AWS)|
|  3. Render ResumeDocument to Static HTML string (renderToStaticMarkup)           |
|  4. Load Static HTML into isolated page context (JavaScript disabled)            |
|  5. Apply @page print CSS (A4 / Letter, 12mm margins, break-inside: avoid)        |
|  6. Generate Vector PDF via page.pdf({ printBackground: true })                   |
|  7. Optional: Cache in Supabase Storage bucket ('resume-exports') if authenticated|
|  8. Return binary PDF stream or signed URL instantly to caller                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Strict Types, Enums & Schema Contract

Conforming to project coding standards (Rule GEMINI.md: zero `any`, mandatory enums):

### 3.1 Mandatory Enums
```ts
export enum ResumeTemplateId {
  CLASSIC = "classic",         // Executive / Traditional serif
  MODERN = "modern",           // Tech / Engineering sans-serif with accent bars
  COMPACT = "compact",         // 1-Page High-Density ATS
  ACADEMIC = "academic",       // CV / Research / Publications
  MINIMALIST = "minimalist",   // Clean Swiss typography, ultra-refined spacing
  CREATIVE = "creative",       // Two-tone header & sidebar accent layout
}

export enum ResumePageSize {
  A4 = "A4",
  LETTER = "Letter",
}

export enum ResumeFontScale {
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
}

export enum ExportStatus {
  IDLE = "idle",
  PREPARING = "preparing",
  GENERATING = "generating",
  READY = "ready",
  FAILED = "failed",
}

export enum ExportErrorCode {
  UNAUTHENTICATED = "UNAUTHENTICATED",
  INVALID_PAYLOAD = "INVALID_PAYLOAD",
  RENDER_FAILED = "RENDER_FAILED",
  RATE_LIMITED = "RATE_LIMITED",
  BROWSER_UNAVAILABLE = "BROWSER_UNAVAILABLE",
}
```

### 3.2 Zod Validation Schema
Located at `src/lib/resume/schema-zod.ts`:
- Validates `fullName`, `email`, `phone`, `experience`, `education`, `skills`, `projects`, `certifications`.
- Enforces plain string arrays for bullet points (no raw HTML tags).
- Enforces hex color regex (`^#[0-9a-fA-F]{6}$`) for custom accents with contrast ratio checks.

---

## 4. Multi-Template Suite Specifications

All templates are rendered cleanly by `ResumeDocument` based on `resume.meta.selectedTemplate`:

| Template ID | Name & Focus | Typography | Layout & Styling Highlights |
|---|---|---|---|
| `classic` | **Executive / Classic** | Serif (Merriweather / Georgia) | Centered header, clean horizontal rules, bold serif section headers, traditional chronological layout. Best for Law, Finance, Business. |
| `modern` | **Tech & Engineering** | Sans-serif (Inter / Roboto) | Left-aligned header, dynamic accent-colored sub-bars, inline skill pills, clean project bullet cards. Best for Software, IT, PM. |
| `compact` | **High-Density 1-Page ATS** | Sans-serif (Dense, 10pt) | 8mm margins, inline contact delimiters (`•`), compact two-column skill list, condensed metadata. Fits max content on 1 page. |
| `academic` | **Research & Faculty CV** | Serif / Sans | Formal structure, highlighted publications, grants, citations, chronological teaching & research appointments. |
| `minimalist` | **Clean Swiss** | Neutral Sans (Inter) | Ample whitespace, borderless sections, subtle slate typography, zero noise, high readability. |
| `creative` | **Creative / Consulting** | Modern Sans + Accent Header | Colored header banner with white text, modern dual-column contact & skill section, high visual impact. |

---

## 5. Server-Side Headless Engine Implementation

### 5.1 Auto-Resolving Browser Executable
```ts
// src/lib/server/pdfRenderer.ts
import puppeteer, { Browser } from "puppeteer-core";
import fs from "fs";

export async function getBrowserInstance(): Promise<Browser> {
  // 1. Windows / Local Dev: Check known Chrome/Edge locations
  if (process.platform === "win32") {
    const candidates = [
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return puppeteer.launch({
          executablePath: p,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
        });
      }
    }
  }

  // 2. Production / Vercel Serverless
  const chromium = (await import("@sparticuz/chromium-min")).default;
  return puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
}
```

### 5.2 Print CSS & Exact Page Pagination
The server injects dedicated print stylesheet:
```css
@page {
  size: A4 portrait;
  margin: 12mm 14mm;
}
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.page-break-avoid {
  break-inside: avoid;
  page-break-inside: avoid;
}
h2 {
  break-after: avoid;
  page-break-after: avoid;
}
```

---

## 6. Front-End Integration & Native Android Delivery

### 6.1 Unified Client Export Service (`src/lib/resume/exportService.ts`)
- Client invokes `exportResumePDF(resume: ResumeData)`.
- Sends `POST /api/resumes/export` with `{ resume }`.
- Receives direct PDF binary or signed URL.

### 6.2 Platform Delivery Flow
- **Web**:
  ```ts
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  ```
- **Android APK (Native WebView)**:
  ```ts
  // 1. Convert arrayBuffer to Base64 in chunks (avoid memory peaks)
  // 2. Write to Cache directory using @capacitor/filesystem
  await Filesystem.writeFile({
    path: filename,
    data: base64Data,
    directory: Directory.Cache,
  });
  // 3. Trigger native Android Share Sheet
  await Share.share({
    title: filename,
    files: [fileUri],
    dialogTitle: `Save or share ${filename}`,
  });
  // 4. Fallback: FileOpener to open directly in system PDF viewer
  ```

---

## 7. Phased Implementation Plan

1. **Phase 1: Shared Models, Enums & Multi-Template Architecture**
   - Update `src/types/resume.ts` with `ResumeTemplateId` enums and support for the 6 templates.
   - Refactor `src/components/resume/ResumePreview.tsx` to support the 6 distinct templates with uniform typography and print styling.
   - Add template presets with sample prefilled data for each template style.
2. **Phase 2: Server-Side PDF Rendering Route (`/api/resumes/export`)**
   - Install `puppeteer-core` and `@sparticuz/chromium-min`.
   - Build `src/lib/server/pdfRenderer.ts` with the auto-resolving browser launcher.
   - Implement `src/app/api/resumes/export/route.ts` with validation, HTML rendering, and PDF streaming.
3. **Phase 3: Client Delivery & Native Android Integration**
   - Refactor `src/shared/platform/savePdf.ts` to consume the server PDF endpoint.
   - Update `src/components/ResumeBuilder.tsx` export buttons to use the new server pipeline with clear state management.
4. **Phase 4: Automated Verification & Testing**
   - End-to-end test script verifying PDF generation across all 6 templates.
   - Validate PDF header `%PDF-1.`, ATS text selectability, and file size (<500 KB).
   - Test both Web and Android Capacitor delivery paths.
