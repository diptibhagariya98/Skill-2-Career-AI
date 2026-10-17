import {
  StudentProfile,
  ScholarshipScheme,
  SingleRule,
  RuleGroup,
  RuleEvaluationResult,
  SchemeEvaluationResult,
  SchemeClassification,
  RuleEvaluationStatus,
  isRuleGroup,
} from "../../types/scholarships";

/**
 * Mutable fields that a student can improve or change in the future.
 * Non-mutable fields (domicile, social category, gender, disability) must never be suggested
 * in "What would change this?".
 */
export const MUTABLE_FIELDS: Set<keyof StudentProfile> = new Set<keyof StudentProfile>([
  "scoreValue",
  "class12Percentage",
  "annualIncome",
  "yearOfStudy",
  "courseStream",
]);

/**
 * Converts CGPA to a normalized percentage using standard university multipliers.
 * Standard Formula: Percentage = CGPA * 9.5 (scaled if scale is not 10).
 */
export function normalizeScoreToPercentage(
  scoreValue: number,
  scoreType: "cgpa" | "percentage",
  cgpaScale: number = 10
): { percentage: number; isEstimated: boolean; note?: string } {
  if (scoreType === "percentage") {
    return { percentage: Math.min(100, Math.max(0, scoreValue)), isEstimated: false };
  }

  // Handle CGPA scale adjustment
  const safeScale = cgpaScale > 0 ? cgpaScale : 10;
  const scaledTo10 = (scoreValue / safeScale) * 10;
  const estimatedPercentage = Math.min(100, Math.max(0, scaledTo10 * 9.5));

  return {
    percentage: Math.round(estimatedPercentage * 10) / 10,
    isEstimated: true,
    note: `Estimated ${estimatedPercentage.toFixed(1)}% from CGPA (${scoreValue}/${safeScale}). Confirm with your institution's formula.`,
  };
}

/**
 * Formats values into human-readable currency or percentages.
 */
export function formatFieldValue(field: keyof StudentProfile, val: unknown): string {
  if (val === undefined || val === null || val === "") return "Not provided";

  if (field === "annualIncome" && typeof val === "number") {
    if (val >= 100000) {
      const lakhs = val / 100000;
      return `₹${val.toLocaleString("en-IN")} (₹${lakhs.toFixed(2)} Lakh/yr)`;
    }
    return `₹${val.toLocaleString("en-IN")}/yr`;
  }

  if ((field === "scoreValue" || field === "class12Percentage") && typeof val === "number") {
    return `${val}%`;
  }

  if (Array.isArray(val)) {
    return val.join(", ");
  }

  return String(val);
}

/**
 * Checks if a scheme's verification date is older than 90 days.
 */
export function isSchemeStale(lastVerifiedDate: string, now: Date = new Date()): boolean {
  try {
    const verifiedTime = new Date(lastVerifiedDate).getTime();
    if (isNaN(verifiedTime)) return true;
    const diffDays = (now.getTime() - verifiedTime) / (1000 * 60 * 60 * 24);
    return diffDays > 90;
  } catch {
    return true;
  }
}

/**
 * Evaluates a single rule against student facts.
 */
export function evaluateSingleRule(
  student: StudentProfile,
  rule: SingleRule
): RuleEvaluationResult {
  const rawStudentVal = student[rule.field];
  const isMutable = MUTABLE_FIELDS.has(rule.field);

  // If student fact is missing/empty or prefer_not_to_say on category
  const isMissing =
    rawStudentVal === undefined ||
    rawStudentVal === null ||
    rawStudentVal === "" ||
    rawStudentVal === "prefer_not_to_say" ||
    (rule.field === "socialCategory" && rawStudentVal === "Prefer not to say");

  if (isMissing && rule.operator !== "is_provided") {
    return {
      ruleId: rule.id,
      field: rule.field,
      label: rule.label,
      status: "unknown",
      kind: rule.kind,
      studentValueText: "Not specified",
      requiredValueText: formatFieldValue(rule.field, rule.value),
      reason: `${rule.label}: Value was not provided. Scheme requires ${formatFieldValue(rule.field, rule.value)}.`,
      isMutable,
    };
  }

  // Handle score normalization if comparing scoreValue against percentage requirements
  let effectiveStudentVal = rawStudentVal;
  if (rule.field === "scoreValue" && student.scoreType === "cgpa" && typeof rawStudentVal === "number") {
    const norm = normalizeScoreToPercentage(rawStudentVal, "cgpa", student.cgpaScale);
    effectiveStudentVal = norm.percentage;
  }

  let passed = false;
  const operator = rule.operator;
  const ruleVal = rule.value;

  switch (operator) {
    case "equals": {
      if (typeof effectiveStudentVal === "string" && typeof ruleVal === "string") {
        passed = effectiveStudentVal.trim().toLowerCase() === ruleVal.trim().toLowerCase();
      } else {
        passed = effectiveStudentVal === ruleVal;
      }
      break;
    }
    case "not_equals": {
      if (typeof effectiveStudentVal === "string" && typeof ruleVal === "string") {
        passed = effectiveStudentVal.trim().toLowerCase() !== ruleVal.trim().toLowerCase();
      } else {
        passed = effectiveStudentVal !== ruleVal;
      }
      break;
    }
    case "is_one_of": {
      if (Array.isArray(ruleVal)) {
        const studentStr = String(effectiveStudentVal).trim().toLowerCase();
        passed = ruleVal.some((item) => String(item).trim().toLowerCase() === studentStr);
      }
      break;
    }
    case "is_not_one_of": {
      if (Array.isArray(ruleVal)) {
        if (ruleVal.length === 0) {
          passed = true;
        } else {
          const studentStr = String(effectiveStudentVal).trim().toLowerCase();
          passed = !ruleVal.some((item) => String(item).trim().toLowerCase() === studentStr);
        }
      }
      break;
    }
    case "less_than": {
      if (typeof effectiveStudentVal === "number" && typeof ruleVal === "number") {
        passed = effectiveStudentVal < ruleVal;
      }
      break;
    }
    case "less_than_or_equal": {
      if (typeof effectiveStudentVal === "number" && typeof ruleVal === "number") {
        passed = effectiveStudentVal <= ruleVal;
      }
      break;
    }
    case "greater_than": {
      if (typeof effectiveStudentVal === "number" && typeof ruleVal === "number") {
        passed = effectiveStudentVal > ruleVal;
      }
      break;
    }
    case "greater_than_or_equal": {
      if (typeof effectiveStudentVal === "number" && typeof ruleVal === "number") {
        passed = effectiveStudentVal >= ruleVal;
      }
      break;
    }
    case "between": {
      if (
        typeof effectiveStudentVal === "number" &&
        Array.isArray(ruleVal) &&
        ruleVal.length === 2 &&
        typeof ruleVal[0] === "number" &&
        typeof ruleVal[1] === "number"
      ) {
        passed = effectiveStudentVal >= ruleVal[0] && effectiveStudentVal <= ruleVal[1];
      }
      break;
    }
    case "is_provided": {
      passed = !isMissing;
      break;
    }
    default: {
      passed = false;
    }
  }

  const status: RuleEvaluationStatus = passed ? "met" : "not_met";
  const studentText = formatFieldValue(rule.field, effectiveStudentVal);
  const requiredText = formatFieldValue(rule.field, ruleVal);

  let reason = "";
  if (passed) {
    reason = `${rule.label}: Met (Your value: ${studentText}; Required: ${requiredText})`;
  } else {
    reason = `${rule.label}: Not met (Your value is ${studentText}; scheme requires ${requiredText})`;
  }

  return {
    ruleId: rule.id,
    field: rule.field,
    label: rule.label,
    status,
    kind: rule.kind,
    studentValueText: studentText,
    requiredValueText: requiredText,
    reason,
    isMutable,
  };
}

/**
 * Recursively collects and evaluates all rules inside a RuleGroup.
 */
export function evaluateRuleGroup(
  student: StudentProfile,
  group: RuleGroup
): {
  groupPassed: boolean;
  hasUnknowns: boolean;
  allResults: RuleEvaluationResult[];
} {
  const allResults: RuleEvaluationResult[] = [];
  let groupPassed = group.combinator === "ALL";
  let hasUnknowns = false;

  for (const item of group.rules) {
    if (isRuleGroup(item)) {
      const subGroup = evaluateRuleGroup(student, item);
      allResults.push(...subGroup.allResults);
      if (subGroup.hasUnknowns) hasUnknowns = true;

      if (group.combinator === "ALL") {
        if (!subGroup.groupPassed) groupPassed = false;
      } else {
        if (subGroup.groupPassed) groupPassed = true;
      }
    } else {
      const singleRes = evaluateSingleRule(student, item);
      allResults.push(singleRes);

      if (singleRes.status === "unknown") {
        hasUnknowns = true;
      }

      if (group.combinator === "ALL") {
        if (singleRes.status === "not_met" && singleRes.kind === "hard") {
          groupPassed = false;
        }
      } else {
        if (singleRes.status === "met") {
          groupPassed = true;
        }
      }
    }
  }

  return { groupPassed, hasUnknowns, allResults };
}

/**
 * Pure evaluation function for a single scholarship scheme against a student profile.
 * Deterministic: identical inputs guaranteed to produce byte-identical outputs.
 */
export function evaluateScheme(
  student: StudentProfile,
  scheme: ScholarshipScheme,
  referenceDate: Date = new Date()
): SchemeEvaluationResult {
  const { allResults } = evaluateRuleGroup(student, scheme.criteria);

  const failedHardRules = allResults.filter((r) => r.kind === "hard" && r.status === "not_met");
  const failedSoftRules = allResults.filter((r) => r.kind === "soft" && r.status === "not_met");
  const unknownRules = allResults.filter((r) => r.status === "unknown");

  let classification: SchemeClassification;

  if (failedHardRules.length > 0) {
    classification = "not_eligible";
  } else if (unknownRules.length > 0 || failedSoftRules.length > 0) {
    classification = "check_details";
  } else {
    classification = "eligible";
  }

  // Compute "What would change this?" if exactly 1 mutable hard rule failed
  let whatWouldChangeThis: string | undefined;
  if (failedHardRules.length === 1 && failedHardRules[0].isMutable) {
    const r = failedHardRules[0];
    whatWouldChangeThis = `Improve ${r.label}: currently ${r.studentValueText}, requires ${r.requiredValueText}.`;
  }

  const isStale = isSchemeStale(scheme.lastVerifiedDate, referenceDate);

  return {
    scheme,
    classification,
    ruleResults: allResults,
    failedHardRules,
    failedSoftRules,
    unknownRules,
    whatWouldChangeThis,
    isStale,
  };
}

/**
 * Evaluates all schemes and returns categorized, sorted results.
 * Sorting:
 * 1. Eligible first, then Check Details, then Not Eligible.
 * 2. Within each group: Nearest closing application deadline, then highest benefit amount.
 */
export function evaluateAllSchemes(
  student: StudentProfile,
  schemes: ScholarshipScheme[],
  referenceDate: Date = new Date()
): {
  eligible: SchemeEvaluationResult[];
  checkDetails: SchemeEvaluationResult[];
  notEligible: SchemeEvaluationResult[];
  totalEvaluated: number;
  evaluatedAt: string;
} {
  const evaluated = schemes.map((scheme) => evaluateScheme(student, scheme, referenceDate));

  const compareSchemes = (a: SchemeEvaluationResult, b: SchemeEvaluationResult): number => {
    // 1. Closest upcoming deadline
    const dateA = a.scheme.applicationWindow.closes ? new Date(a.scheme.applicationWindow.closes).getTime() : Infinity;
    const dateB = b.scheme.applicationWindow.closes ? new Date(b.scheme.applicationWindow.closes).getTime() : Infinity;

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // 2. Highest benefit amount
    const amtA = a.scheme.benefit.amount || 0;
    const amtB = b.scheme.benefit.amount || 0;
    return amtB - amtA;
  };

  const eligible = evaluated.filter((r) => r.classification === "eligible").sort(compareSchemes);
  const checkDetails = evaluated.filter((r) => r.classification === "check_details").sort(compareSchemes);
  const notEligible = evaluated.filter((r) => r.classification === "not_eligible").sort(compareSchemes);

  return {
    eligible,
    checkDetails,
    notEligible,
    totalEvaluated: schemes.length,
    evaluatedAt: referenceDate.toISOString(),
  };
}
