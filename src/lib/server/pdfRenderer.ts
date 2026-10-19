import puppeteer, { Browser } from "puppeteer-core";
import fs from "fs";
import path from "path";

/**
 * Finds an available browser executable on the host machine.
 * Local development (Windows/macOS) uses pre-installed Edge/Chrome.
 * Vercel serverless / Linux container uses @sparticuz/chromium-min.
 */
async function resolveBrowserExecutable(): Promise<{ executablePath: string; args: string[] }> {
  // 1. Windows: Check pre-installed Microsoft Edge or Google Chrome
  if (process.platform === "win32") {
    const windowsPaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, "Google\\Chrome\\Application\\chrome.exe")
        : "",
      "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    ].filter(Boolean);

    for (const exePath of windowsPaths) {
      if (fs.existsSync(exePath)) {
        return {
          executablePath: exePath,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--font-render-hinting=none",
          ],
        };
      }
    }
  }

  // 2. macOS: Check pre-installed Google Chrome or Edge
  if (process.platform === "darwin") {
    const macPaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ];
    for (const exePath of macPaths) {
      if (fs.existsSync(exePath)) {
        return {
          executablePath: exePath,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        };
      }
    }
  }

  // 3. Linux / Vercel Serverless: Use @sparticuz/chromium-min
  try {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const execPath = await chromium.executablePath();
    return {
      executablePath: execPath,
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    };
  } catch (err) {
    throw new Error(
      `Could not resolve Chromium or Chrome executable for PDF rendering: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Embedded CSS stylesheet guaranteeing 100% layout and typography parity
 * without requiring external network requests inside headless Chromium.
 */
const EMBEDDED_PRINT_CSS = `
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    background-color: #ffffff !important;
    color: #111827;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  .font-serif {
    font-family: Georgia, Cambria, "Times New Roman", Times, serif;
  }

  .font-sans {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  /* Page setup & Break avoidance */
  @page {
    size: A4 portrait;
    margin: 0;
  }

  .page-break-avoid {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  h1, h2, h3 {
    break-after: avoid !important;
    page-break-after: avoid !important;
  }

  /* Utility classes matching Tailwind styles */
  .mx-auto { margin-left: auto; margin-right: auto; }
  .flex { display: flex; }
  .flex-wrap { flex-wrap: wrap; }
  .justify-between { justify-content: space-between; }
  .justify-center { justify-content: center; }
  .items-center { align-items: center; }
  .items-baseline { align-items: baseline; }
  .shrink-0 { flex-shrink: 0; }

  .text-center { text-align: center; }
  .text-justify { text-align: justify; }

  .uppercase { text-transform: uppercase; }
  .capitalize { text-transform: capitalize; }
  .italic { font-style: italic; }

  .font-light { font-weight: 300; }
  .font-normal { font-weight: 400; }
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }
  .font-extrabold { font-weight: 800; }
  .font-black { font-weight: 900; }

  .text-\\[11px\\] { font-size: 11px; line-height: 14px; }
  .text-xs { font-size: 12px; line-height: 16px; }
  .text-sm { font-size: 14px; line-height: 20px; }
  .text-base { font-size: 16px; line-height: 24px; }
  .text-xl { font-size: 20px; line-height: 28px; }
  .text-2xl { font-size: 24px; line-height: 32px; }
  .text-3xl { font-size: 30px; line-height: 36px; }

  .tracking-tight { letter-spacing: -0.025em; }
  .tracking-wide { letter-spacing: 0.025em; }
  .tracking-wider { letter-spacing: 0.05em; }
  .tracking-widest { letter-spacing: 0.1em; }

  .leading-tight { line-height: 1.25; }
  .leading-snug { line-height: 1.375; }
  .leading-normal { line-height: 1.5; }
  .leading-relaxed { line-height: 1.625; }

  .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
  .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
  .border-l-2 { border-left-width: 2px; border-left-style: solid; }

  .border-gray-200 { border-color: #e5e7eb; }
  .border-gray-300 { border-color: #d1d5db; }
  .border-gray-400 { border-color: #9ca3af; }
  .border-gray-900 { border-color: #111827; }

  .text-white { color: #ffffff; }
  .text-white\\/80 { color: rgba(255, 255, 255, 0.8); }
  .text-white\\/90 { color: rgba(255, 255, 255, 0.9); }
  .text-gray-400 { color: #9ca3af; }
  .text-gray-500 { color: #6b7280; }
  .text-gray-600 { color: #4b5563; }
  .text-gray-700 { color: #374151; }
  .text-gray-800 { color: #1f2937; }
  .text-gray-900 { color: #111827; }
  .text-gray-950 { color: #030712; }

  .bg-white { background-color: #ffffff; }
  .bg-gray-100 { background-color: #f3f4f6; }

  .rounded-sm { border-radius: 2px; }
  .rounded { border-radius: 4px; }
  .rounded-lg { border-radius: 8px; }
  .rounded-full { border-radius: 9999px; }

  .p-4 { padding: 16px; }
  .p-5 { padding: 20px; }
  .pb-0\\.5 { padding-bottom: 2px; }
  .pb-1 { padding-bottom: 4px; }
  .pb-1\\.5 { padding-bottom: 6px; }
  .pb-2 { padding-bottom: 8px; }
  .pb-3 { padding-bottom: 12px; }
  .pb-4 { padding-bottom: 16px; }
  .pl-4 { padding-left: 16px; }
  .px-2 { padding-left: 8px; padding-right: 8px; }
  .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }

  .mb-0\\.5 { margin-bottom: 2px; }
  .mb-1 { margin-bottom: 4px; }
  .mb-1\\.5 { margin-bottom: 6px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-2\\.5 { margin-bottom: 10px; }
  .mb-3 { margin-bottom: 12px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-5 { margin-bottom: 20px; }
  .mt-0\\.5 { margin-top: 2px; }
  .mt-1 { margin-top: 4px; }
  .mr-1 { margin-right: 4px; }
  .mr-2 { margin-right: 8px; }
  .mr-3 { margin-right: 12px; }
  .ml-3\\.5 { margin-left: 14px; }
  .ml-4 { margin-left: 16px; }

  .gap-1 { gap: 4px; }
  .gap-1\\.5 { gap: 6px; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .gap-4 { gap: 16px; }
  .gap-x-2 { column-gap: 8px; }
  .gap-x-3 { column-gap: 12px; }
  .gap-x-4 { column-gap: 16px; }
  .gap-y-0\\.5 { row-gap: 2px; }
  .gap-y-1 { row-gap: 4px; }

  .space-y-0\\.5 > * + * { margin-top: 2px; }
  .space-y-1 > * + * { margin-top: 4px; }
  .space-y-1\\.5 > * + * { margin-top: 6px; }
  .space-y-2 > * + * { margin-top: 8px; }
  .space-y-2\\.5 > * + * { margin-top: 10px; }
  .space-y-3 > * + * { margin-top: 12px; }

  .w-2\\.5 { width: 10px; }
  .h-2\\.5 { height: 10px; }
  .w-32 { width: 128px; }
  .w-36 { width: 144px; }
  .min-w-28 { min-width: 112px; }

  .list-disc { list-style-type: disc; }
  .list-outside { list-style-position: outside; }
  a { text-decoration: none; color: inherit; }
`;

export interface GeneratePdfOptions {
  pageSize?: "A4" | "Letter";
}

import os from "os";

/**
 * Renders an HTML string containing ResumeDocument into a high-res vector PDF.
 */
export async function generateResumePdf(
  htmlContent: string,
  options: GeneratePdfOptions = {}
): Promise<Buffer> {
  const { executablePath, args } = await resolveBrowserExecutable();

  let browser: Browser | null = null;
  let tempUserDataDir: string | null = null;

  try {
    if (process.platform === "win32") {
      tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "resumentor_pdf_"));
    }

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      userDataDir: tempUserDataDir || undefined,
      args: [
        ...args,
        "--remote-debugging-port=0",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-sync",
        "--hide-scrollbars",
      ],
    });

    const page = await browser.newPage();

    // Construct full HTML shell with inlined styles
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Resume</title>
          <style>${EMBEDDED_PRINT_CSS}</style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    // Load content into page and wait for complete DOM rendering
    await page.setContent(fullHtml, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    const isA4 = (options.pageSize || "A4") === "A4";

    // Generate vector PDF using Chromium print engine
    const pdfUint8Array = await page.pdf({
      format: isA4 ? "A4" : "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (tempUserDataDir && fs.existsSync(tempUserDataDir)) {
      try {
        fs.rmSync(tempUserDataDir, { recursive: true, force: true });
      } catch {}
    }
  }
}
