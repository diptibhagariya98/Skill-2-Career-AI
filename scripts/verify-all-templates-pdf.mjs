import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";
import { ResumeDocument } from "../src/components/resume/ResumeDocument.tsx";
import { createSampleResume } from "../src/lib/resume/schema.ts";
import { generateResumePdf } from "../src/lib/server/pdfRenderer.ts";
import { ResumeTemplateId } from "../src/types/resume.ts";

console.log("🧪 Verifying High-Resolution Server-Side PDF Generation for ALL 6 ATS Templates...\n");

const templates = [
  ResumeTemplateId.CLASSIC,
  ResumeTemplateId.MODERN,
  ResumeTemplateId.COMPACT,
  ResumeTemplateId.ACADEMIC,
  ResumeTemplateId.MINIMALIST,
  ResumeTemplateId.CREATIVE,
];

async function verifyAll() {
  const outDir = path.join(process.cwd(), "scripts", "artifacts");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const results = [];
  const totalStart = Date.now();

  for (const templateId of templates) {
    console.log(`Testing Template: "${templateId}"...`);
    const resume = createSampleResume(templateId);
    
    // 1. Render React markup
    const renderStart = Date.now();
    const html = renderToStaticMarkup(
      React.createElement(ResumeDocument, { resume, isPrintMode: true })
    );
    const renderTime = Date.now() - renderStart;

    // 2. Headless Chromium PDF generation
    const pdfStart = Date.now();
    const pdfBuffer = await generateResumePdf(html, {
      pageSize: resume.meta.pageSize || "A4",
    });
    const pdfTime = Date.now() - pdfStart;

    // 3. Validate Magic Bytes
    const header = pdfBuffer.slice(0, 5).toString("ascii");
    if (header !== "%PDF-") {
      throw new Error(`[${templateId}] Invalid PDF header: "${header}"`);
    }

    // 4. Validate Size Constraints (must be valid vector PDF, between 5KB and 1.5MB)
    const sizeKb = (pdfBuffer.byteLength / 1024).toFixed(1);
    if (pdfBuffer.byteLength < 5000) {
      throw new Error(`[${templateId}] PDF size abnormally small (${pdfBuffer.byteLength} bytes)`);
    }
    if (pdfBuffer.byteLength > 1500000) {
      throw new Error(`[${templateId}] PDF size abnormally large (${pdfBuffer.byteLength} bytes)`);
    }

    // 5. Save Artifact
    const filename = `template-${templateId}.pdf`;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    console.log(
      `   ✅ [PASS] ${templateId.toUpperCase()}: Render=${renderTime}ms, PDF=${pdfTime}ms, Size=${sizeKb} KB, File=${filename}`
    );

    results.push({
      templateId,
      renderTime,
      pdfTime,
      sizeKb,
      status: "PASS",
    });
  }

  const totalDuration = Date.now() - totalStart;
  console.log(`\n============================================================`);
  console.log(`🎉 ALL ${results.length}/6 TEMPLATES VERIFIED SUCCESSFULLY IN ${totalDuration}ms!`);
  console.log(`============================================================`);
  console.table(results);
}

verifyAll().catch((err) => {
  console.error("\n❌ Template PDF Verification Failed:", err);
  process.exit(1);
});
