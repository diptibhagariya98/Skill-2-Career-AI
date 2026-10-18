/**
 * Types and Contracts for Phase 2 AI ATS Analysis
 * Conforms to Phase 2: AI ATS Analysis and One-Click PDF Export Spec (Sections 3.2, 3.7 & 5.3)
 */

import { ResumeData, SectionKey } from "./resume";

export type AnalysisRating = "needs work" | "fair" | "good" | "excellent";

export type AnalysisErrorCode =
  | "too_short"
  | "too_long"
  | "consent_required"
  | "rate_limited"
  | "invalid_request"
  | "service_unavailable"
  | "timeout"
  | "offline"
  | "export_failed";

export interface CategoryScore {
  category: string;
  score: number;
  weight: number;
  reason: string;
}

export interface ActionStep {
  title: string;
  detail: string;
  targetSection: SectionKey;
  expectedImpact: "high" | "medium" | "low";
}

export interface AnalysisRequest {
  resumeData: ResumeData;
  extractedText: string;
  layoutMetrics: {
    pageCount: number;
    pageSize: string;
    template: string;
    sectionOrder: string[];
  };
  localCheckResults: Record<string, "pass" | "warning" | "fail">;
  jobDescription?: string;
  language: string;
  requestId: string;
}

export interface AnalysisResponse {
  overallScore: number;
  rating: AnalysisRating;
  categoryScores: CategoryScore[];
  strengths: string[];
  improvements: string[];
  actionSteps: ActionStep[];
  missingKeywords?: string[];
  summary: string;
  analyzedAt: string;
  contentFingerprint: string;
  source: "ai" | "rules-only";
  remainingQuota?: {
    hourly: number;
    daily: number;
  };
}
