import {
  evaluateScheme,
  evaluateAllSchemes,
  normalizeScoreToPercentage,
  isSchemeStale,
} from "../engine";
import { SEED_SCHOLARSHIP_SCHEMES } from "../../../constants/seedScholarships";
import { StudentProfile } from "../../../types/scholarships";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("=== RUNNING SCHOLARSHIP ENGINE UNIT TESTS ===");

// Test 1: CGPA Normalization
console.log("Test 1: CGPA to Percentage Normalization");
const cgpa1 = normalizeScoreToPercentage(8.5, "cgpa", 10);
assert(cgpa1.percentage === 80.8, `Expected 80.8%, got ${cgpa1.percentage}`);
assert(cgpa1.isEstimated === true, "Expected isEstimated to be true");

const pct1 = normalizeScoreToPercentage(85, "percentage");
assert(pct1.percentage === 85, `Expected 85%, got ${pct1.percentage}`);
assert(pct1.isEstimated === false, "Expected isEstimated to be false");

// Test 2: MYSY Gujarat Eligible Student
console.log("Test 2: Gujarat MYSY Scheme - Eligible Student");
const gujaratStudent: StudentProfile = {
  domicileState: "Gujarat",
  socialCategory: "General",
  annualIncome: 400000,
  studyLevel: "undergraduate",
  scoreType: "percentage",
  scoreValue: 88,
  institutionType: "government",
  gender: "male",
};

const mysyScheme = SEED_SCHOLARSHIP_SCHEMES.find((s) => s.id === "scheme-mysy-gujarat")!;
const mysyResult = evaluateScheme(gujaratStudent, mysyScheme);
assert(mysyResult.classification === "eligible", `Expected eligible, got ${mysyResult.classification}`);
assert(mysyResult.failedHardRules.length === 0, "Expected 0 failed hard rules");

// Test 3: MYSY Gujarat Income Over Limit (Not Eligible with hint)
console.log("Test 3: Gujarat MYSY Scheme - Over Income Limit");
const highIncomeStudent: StudentProfile = {
  ...gujaratStudent,
  annualIncome: 750000,
};
const mysyHighIncomeResult = evaluateScheme(highIncomeStudent, mysyScheme);
assert(mysyHighIncomeResult.classification === "not_eligible", `Expected not_eligible, got ${mysyHighIncomeResult.classification}`);
assert(mysyHighIncomeResult.failedHardRules.length === 1, "Expected 1 failed hard rule");
assert(
  mysyHighIncomeResult.whatWouldChangeThis !== undefined,
  "Expected whatWouldChangeThis suggestion for income"
);

// Test 4: AICTE Pragati (Female Only) - Male student is Not Eligible with NO immutable hint
console.log("Test 4: AICTE Pragati Scheme - Gender Hard Rule & Immutability");
const pragatiScheme = SEED_SCHOLARSHIP_SCHEMES.find((s) => s.id === "scheme-aicte-pragati")!;
const maleStudent: StudentProfile = {
  ...gujaratStudent,
  gender: "male",
};
const pragatiResult = evaluateScheme(maleStudent, pragatiScheme);
assert(pragatiResult.classification === "not_eligible", "Expected male student to be not eligible for Pragati");
assert(
  pragatiResult.whatWouldChangeThis === undefined,
  "Should NOT suggest changing immutable property (gender)"
);

// Test 5: Missing Optional Field leads to Check Details
console.log("Test 5: Missing/Unknown Fields Classification");
const incompleteStudent: StudentProfile = {
  domicileState: "Gujarat",
  socialCategory: "Prefer not to say",
  annualIncome: 200000,
  studyLevel: "undergraduate",
  scoreType: "percentage",
  scoreValue: 85,
  gender: "prefer_not_to_say",
};
const scStScheme = SEED_SCHOLARSHIP_SCHEMES.find((s) => s.id === "scheme-post-matric-sc-st")!;
const scStResult = evaluateScheme(incompleteStudent, scStScheme);
assert(
  scStResult.classification === "check_details",
  `Expected check_details for missing category, got ${scStResult.classification}`
);

// Test 6: Determinism
console.log("Test 6: Pure Determinism Verification");
const evalA = JSON.stringify(evaluateScheme(gujaratStudent, mysyScheme));
const evalB = JSON.stringify(evaluateScheme(gujaratStudent, mysyScheme));
assert(evalA === evalB, "Identical inputs must produce identical outputs");

// Test 7: Staleness Check
console.log("Test 7: Staleness Check");
assert(isSchemeStale("2020-01-01") === true, "Old scheme must be stale");
assert(isSchemeStale(new Date().toISOString()) === false, "Recent scheme must not be stale");

console.log("✅ ALL 7 SCHOLARSHIP ENGINE UNIT TESTS PASSED SUCCESSFULLY!");
