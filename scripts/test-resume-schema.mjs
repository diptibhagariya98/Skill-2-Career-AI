import { ResumeZodSchema } from "../src/lib/resume/schema-zod.ts";
import { createSampleResume, createEmptyResume } from "../src/lib/resume/schema.ts";

const templates = ["classic", "modern", "compact", "academic", "minimalist", "creative"];

console.log("🧪 Testing Resume Zod Schema Validation across all templates...\n");

let passed = 0;
let failed = 0;

for (const tmpl of templates) {
  try {
    const resume = createSampleResume(tmpl);
    const parsed = ResumeZodSchema.safeParse(resume);

    if (parsed.success) {
      console.log(`✅ [PASS] Template "${tmpl}" validated successfully.`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Template "${tmpl}" failed schema validation:`, parsed.error.issues);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [ERROR] Template "${tmpl}" threw an error:`, err);
    failed++;
  }
}

// Test empty resume
try {
  const empty = createEmptyResume({ name: "Jane Doe", email: "jane@example.com" });
  const parsed = ResumeZodSchema.safeParse(empty);
  if (parsed.success) {
    console.log(`✅ [PASS] Empty resume validated successfully.`);
    passed++;
  } else {
    console.error(`❌ [FAIL] Empty resume failed schema validation:`, parsed.error.issues);
    failed++;
  }
} catch (err) {
  console.error(`❌ [ERROR] Empty resume threw an error:`, err);
  failed++;
}

// Test intentional invalid payload rejection
try {
  const invalid = { meta: { title: 123 }, contact: "invalid" };
  const parsed = ResumeZodSchema.safeParse(invalid);
  if (!parsed.success) {
    console.log(`✅ [PASS] Corrupted resume correctly rejected by schema.`);
    passed++;
  } else {
    console.error(`❌ [FAIL] Corrupted resume was unexpectedly accepted!`);
    failed++;
  }
} catch (err) {
  console.error(`❌ [ERROR] Corrupted test failed:`, err);
  failed++;
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 All schema tests passed successfully!");
  process.exit(0);
}
