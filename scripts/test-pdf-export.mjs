import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";
import { ResumeDocument } from "../src/components/resume/ResumeDocument.tsx";
import { createSampleResume } from "../src/lib/resume/schema.ts";
import { generateResumePdf } from "../src/lib/server/pdfRenderer.ts";

console.log("🧪 Testing Server-Side Headless Chromium PDF Generation...\n");

async function runTest() {
  const resume = createSampleResume("modern");
  console.log(`1. Rendering sample resume ("${resume.contact.fullName}") with template "${resume.meta.selectedTemplate}" to static markup...`);
  
  const startTime = Date.now();
  const html = renderToStaticMarkup(React.createElement(ResumeDocument, { resume, isPrintMode: true }));
  console.log(`   HTML markup generated in ${Date.now() - startTime}ms (${html.length} chars).`);

  console.log("2. Launching headless browser engine and generating vector PDF...");
  const pdfStartTime = Date.now();
  const pdfBuffer = await generateResumePdf(html, { pageSize: "A4" });
  const duration = Date.now() - pdfStartTime;
  console.log(`   PDF rendered in ${duration}ms (${pdfBuffer.byteLength} bytes).`);

  // Verify PDF header magic bytes
  const header = pdfBuffer.slice(0, 5).toString("ascii");
  if (header !== "%PDF-") {
    throw new Error(`Invalid PDF header: expected "%PDF-", got "${header}"`);
  }
  console.log(`✅ [PASS] Magic bytes verified: starts with "${header}"`);

  // Verify PDF size
  if (pdfBuffer.byteLength < 5000) {
    throw new Error(`PDF size suspiciously small (${pdfBuffer.byteLength} bytes)`);
  }
  if (pdfBuffer.byteLength > 1000000) {
    throw new Error(`PDF size exceeds 1MB limit (${pdfBuffer.byteLength} bytes)`);
  }
  console.log(`✅ [PASS] File size verified: ${(pdfBuffer.byteLength / 1024).toFixed(1)} KB`);

  // Save artifact for inspection
  const outDir = path.join(process.cwd(), "scripts", "artifacts");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "test-modern-resume.pdf");
  fs.writeFileSync(outPath, pdfBuffer);
  console.log(`✅ [PASS] PDF saved to ${outPath}`);

  console.log("\n🎉 Server-side PDF generation test passed with 100% success!");
}

runTest().catch((err) => {
  console.error("\n❌ PDF Generation Test Failed:", err);
  process.exit(1);
});
