import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumeDocument } from "../src/components/resume/ResumeDocument.tsx";
import { createSampleResume } from "../src/lib/resume/schema.ts";

const templates = ["classic", "modern", "compact", "academic", "minimalist", "creative"];

console.log("🧪 Testing renderToStaticMarkup on ResumeDocument across all 6 templates...\n");

let passed = 0;
let failed = 0;

for (const tmpl of templates) {
  try {
    const resume = createSampleResume(tmpl);
    const html = renderToStaticMarkup(React.createElement(ResumeDocument, { resume, isPrintMode: true }));

    if (html && html.length > 500 && html.includes(resume.contact.fullName)) {
      console.log(`✅ [PASS] Template "${tmpl}" rendered successfully (${html.length} chars).`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Template "${tmpl}" produced unexpected output:`, html.slice(0, 200));
      failed++;
    }
  } catch (err) {
    console.error(`❌ [ERROR] Template "${tmpl}" render threw an error:`, err);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 All template rendering tests passed successfully!");
  process.exit(0);
}
