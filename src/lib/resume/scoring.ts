/**
 * Resume Scoring and Evaluation Engine
 * Conforms to Phase 2 Spec Section 3.4 & 3.5 (Hybrid Scoring Rubric)
 */

import {
  AnalysisRequest,
  AnalysisResponse,
  CategoryScore,
  ActionStep,
  AnalysisRating,
} from "@/types/analysis";
import { WorkExperienceItem, EducationItem, ContactInfo } from "@/types/resume";

const COMMON_ACTION_VERBS = new Set([
  "built", "developed", "led", "managed", "spearheaded", "designed", "architected",
  "implemented", "engineered", "created", "increased", "decreased", "optimized",
  "improved", "reduced", "delivered", "launched", "scaled", "automated", "trained",
  "mentored", "orchestrated", "transformed", "generated", "achieved", "negotiated",
  "resolved", "streamlined", "accelerated", "formulated", "established", "drove"
]);

/**
 * Generate a deterministic fingerprint for resume content + layout metrics + job description
 */
export function generateContentFingerprint(
  extractedText: string,
  layoutMetrics: AnalysisRequest["layoutMetrics"],
  jobDescription?: string
): string {
  const payload = [
    extractedText.trim().replace(/\s+/g, " "),
    layoutMetrics.pageCount,
    layoutMetrics.pageSize,
    layoutMetrics.template,
    (layoutMetrics.sectionOrder || []).join(","),
    (jobDescription || "").trim().slice(0, 500),
  ].join("|");

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `fp_${Math.abs(hash).toString(36)}_${payload.length}`;
}

export interface DeterministicResult {
  categoryScores: CategoryScore[];
  overallScore: number;
  rating: AnalysisRating;
  isCriticalFailure: boolean;
  criticalIssue?: string;
  missingKeywords: string[];
}

/**
 * Compute fixed, deterministic baseline scores
 */
export function computeDeterministicScores(request: AnalysisRequest): DeterministicResult {
  const { resumeData, extractedText, layoutMetrics, jobDescription } = request;
  const contact: Partial<ContactInfo> = resumeData?.contact || {};
  const experience: WorkExperienceItem[] = resumeData?.experience || [];
  const education: EducationItem[] = resumeData?.education || [];
  const summary: string = resumeData?.summary || "";
  const skills = resumeData?.skills;

  // 1. Parsability and Structure (weight: 25)
  let parsabilityScore = 40; // Base score for single column
  if (layoutMetrics.template) parsabilityScore += 20;
  if (extractedText && extractedText.length > 100) parsabilityScore += 20;
  if (request.localCheckResults?.single_column === "pass") parsabilityScore += 10;
  if (request.localCheckResults?.standard_headings === "pass") parsabilityScore += 10;
  parsabilityScore = Math.min(100, Math.max(0, parsabilityScore));

  // 2. Contact and Headings (weight: 15)
  let contactScore = 0;
  if (contact.fullName?.trim()) contactScore += 35;
  if (contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) contactScore += 35;
  if (contact.phone?.trim() || contact.city?.trim() || contact.country?.trim()) contactScore += 20;
  if (contact.linkedin?.trim() || contact.website?.trim()) contactScore += 10;
  contactScore = Math.min(100, Math.max(0, contactScore));

  // 3. Content Quality baseline (weight: 25)
  let contentScore = 20;
  if (summary.trim().length >= 40 && summary.trim().length <= 600) {
    contentScore += 20;
  } else if (summary.trim().length > 0) {
    contentScore += 10;
  }

  // Check action verbs and measurable metrics in experience bullets
  let totalBullets = 0;
  let actionVerbCount = 0;
  let metricsCount = 0;

  experience.forEach((exp) => {
    const bullets: string[] = Array.isArray(exp.bullets) ? exp.bullets : [];
    bullets.forEach((b) => {
      totalBullets++;
      const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
      if (firstWord && COMMON_ACTION_VERBS.has(firstWord)) {
        actionVerbCount++;
      }
      if (/\d+%|\$\d+|\d+\+|\b\d+\b/.test(b)) {
        metricsCount++;
      }
    });
  });

  if (totalBullets > 0) {
    const actionVerbRatio = actionVerbCount / totalBullets;
    const metricsRatio = metricsCount / totalBullets;
    contentScore += Math.round(actionVerbRatio * 30);
    contentScore += Math.round(metricsRatio * 30);
  } else if (education.length > 0) {
    contentScore += 30; // Student baseline
  }
  contentScore = Math.min(100, Math.max(0, contentScore));

  // 4. Role Relevance (weight: 15)
  const hasJobDesc = Boolean(jobDescription && jobDescription.trim().length >= 30);
  let roleRelevanceScore = 0;
  let roleReason = "No job description supplied";
  const missingKeywords: string[] = [];

  if (hasJobDesc) {
    // Extract keywords from job description
    const jdWords = jobDescription!
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4);

    const jdFreq: Record<string, number> = {};
    jdWords.forEach((w) => {
      jdFreq[w] = (jdFreq[w] || 0) + 1;
    });

    const topKeywords = Object.entries(jdFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([k]) => k);

    const resumeTextLower = extractedText.toLowerCase();
    let matchedKeywords = 0;

    topKeywords.forEach((kw) => {
      if (resumeTextLower.includes(kw)) {
        matchedKeywords++;
      } else {
        missingKeywords.push(kw);
      }
    });

    roleRelevanceScore = topKeywords.length > 0
      ? Math.round((matchedKeywords / topKeywords.length) * 100)
      : 70;
    roleReason = `${matchedKeywords} of top ${topKeywords.length} key terms matched from job description`;
  }

  // 5. Formatting and Length (weight: 20)
  let formatScore = 30;
  if (layoutMetrics.pageCount === 1) {
    formatScore += 40;
  } else if (layoutMetrics.pageCount === 2) {
    formatScore += experience.length >= 3 ? 40 : 25;
  } else {
    formatScore += 10;
  }
  if (experience.length > 0 || education.length > 0) formatScore += 15;
  if (skills && ((skills.isGrouped && skills.groups?.length > 0) || skills.flatList?.length > 0)) {
    formatScore += 15;
  }
  formatScore = Math.min(100, Math.max(0, formatScore));

  // Weight Redistribution if no job description (Section 3.4)
  let parsabilityWeight = 25;
  let contactWeight = 15;
  let contentWeight = 25;
  let roleWeight = hasJobDesc ? 15 : 0;
  let formatWeight = 20;

  if (!hasJobDesc) {
    // Redistribute 15 points across 85 base weights
    const scale = 100 / 85;
    parsabilityWeight = Math.round(25 * scale); // 29
    contactWeight = Math.round(15 * scale);     // 18
    contentWeight = Math.round(25 * scale);     // 29
    formatWeight = 100 - (parsabilityWeight + contactWeight + contentWeight); // 24
  }

  const categoryScores: CategoryScore[] = [
    {
      category: "Parsability and structure",
      score: parsabilityScore,
      weight: parsabilityWeight,
      reason: "Single-column flow with standardized section headers and extractable text.",
    },
    {
      category: "Contact and headings",
      score: contactScore,
      weight: contactWeight,
      reason: contactScore >= 80 ? "Essential contact info present in body." : "Missing vital contact details (name or email).",
    },
    {
      category: "Content quality",
      score: contentScore,
      weight: contentWeight,
      reason: `${actionVerbCount} action verbs and ${metricsCount} quantified achievements detected.`,
    },
    {
      category: "Role relevance",
      score: hasJobDesc ? roleRelevanceScore : 0,
      weight: roleWeight,
      reason: roleReason,
    },
    {
      category: "Formatting and length",
      score: formatScore,
      weight: formatWeight,
      reason: `${layoutMetrics.pageCount} page(s) matching standard executive scan ratio.`,
    },
  ];

  // Weighted total score
  let total = 0;
  categoryScores.forEach((c) => {
    total += (c.score * c.weight) / 100;
  });
  let overallScore = Math.round(total);

  // Critical failure check (Section 3.4)
  let isCriticalFailure = false;
  let criticalIssue: string | undefined;

  if (!contact.fullName?.trim() || !contact.email?.trim()) {
    isCriticalFailure = true;
    criticalIssue = "Critical Failure: Missing full candidate name or email address.";
  } else if (!extractedText || extractedText.trim().length < 60) {
    isCriticalFailure = true;
    criticalIssue = "Critical Failure: Unreadable or empty resume text extracted.";
  }

  if (isCriticalFailure) {
    overallScore = Math.min(overallScore, 60);
  }

  // Rating bands: 0-49 needs work, 50-69 fair, 70-84 good, 85-100 excellent
  let rating: AnalysisRating = "needs work";
  if (overallScore >= 85) rating = "excellent";
  else if (overallScore >= 70) rating = "good";
  else if (overallScore >= 50) rating = "fair";

  return {
    categoryScores,
    overallScore,
    rating,
    isCriticalFailure,
    criticalIssue,
    missingKeywords: missingKeywords.slice(0, 8),
  };
}

/**
 * Creates a rules-only fallback response when the AI service is unavailable or invalid
 */
export function createRulesOnlyFallback(
  request: AnalysisRequest,
  fingerprint: string
): AnalysisResponse {
  const det = computeDeterministicScores(request);
  const strengths: string[] = [];
  const improvements: string[] = [];
  const actionSteps: ActionStep[] = [];

  // Critical issues first
  if (det.isCriticalFailure && det.criticalIssue) {
    improvements.push(det.criticalIssue);
    actionSteps.push({
      title: "Add Primary Contact Details",
      detail: "Add your full name and valid email address so ATS parsers and recruiters can identify you.",
      targetSection: "contact",
      expectedImpact: "high",
    });
  }

  // Strengths
  if (det.categoryScores[0].score >= 70) {
    strengths.push("Clean single-column layout ensures 100% linear ATS text extraction.");
  }
  if (request.resumeData?.experience?.length > 0) {
    strengths.push(`Documented ${request.resumeData.experience.length} relevant professional roles with structured dates.`);
  }
  if (request.resumeData?.skills) {
    strengths.push("Skills are formatted as semantic text tokens without unreadable graphic rating bars.");
  }
  if (strengths.length < 3) {
    strengths.push("Uses standard ATS-recognized section naming conventions.");
  }

  // Improvements & Action Steps
  if (!request.resumeData?.summary?.trim()) {
    improvements.push("Missing professional summary or career objective.");
    actionSteps.push({
      title: "Craft a 2-3 Sentence Summary",
      detail: "Write a high-impact summary highlighting your core expertise and target role.",
      targetSection: "summary",
      expectedImpact: "medium",
    });
  }

  const expWithoutMetrics = (request.resumeData?.experience || []).filter(
    (exp: WorkExperienceItem) => !(exp.bullets || []).some((b: string) => /\d+%|\$\d+|\d+\+/.test(b))
  );

  if (expWithoutMetrics.length > 0) {
    improvements.push("Several experience bullets lack measurable metric achievements (%, $, numbers).");
    actionSteps.push({
      title: "Quantify Experience Accomplishments",
      detail: "Incorporate specific metrics, percentage increases, or dollar figures in your bullet points.",
      targetSection: "experience",
      expectedImpact: "high",
    });
  }

  if ((request.resumeData?.skills?.flatList || []).length < 5 && (!request.resumeData?.skills?.groups || request.resumeData.skills.groups.length === 0)) {
    improvements.push("Skills section contains fewer than 5 identified core competencies.");
    actionSteps.push({
      title: "Expand Core Skills",
      detail: "Add 5-10 specific industry tools, technologies, and core competencies relevant to your field.",
      targetSection: "skills",
      expectedImpact: "medium",
    });
  }

  // Ensure minimum counts
  if (improvements.length < 3) {
    improvements.push("Tailor keywords specifically to target job listings for higher ranking.");
  }
  if (actionSteps.length < 3) {
    actionSteps.push({
      title: "Review Education & Certifications",
      detail: "Verify your degrees and certifications include institution names and completion dates.",
      targetSection: "education",
      expectedImpact: "low",
    });
  }

  return {
    overallScore: det.overallScore,
    rating: det.rating,
    categoryScores: det.categoryScores,
    strengths: strengths.slice(0, 6),
    improvements: improvements.slice(0, 8),
    actionSteps: actionSteps.slice(0, 8),
    missingKeywords: det.missingKeywords.length > 0 ? det.missingKeywords : undefined,
    summary: `Your resume scored ${det.overallScore}/100 based on standard ATS screening criteria. Follow the prioritized action steps to boost recruiter pass-rates.`,
    analyzedAt: new Date().toISOString(),
    contentFingerprint: fingerprint,
    source: "rules-only",
  };
}
