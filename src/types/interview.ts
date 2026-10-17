/**
 * Phase 4 AI Mock Interview Simulator & Practice Hub - Strict Type Definitions
 */

export type InterviewMode = "quick_practice" | "hybrid" | "full_ai";

export type InterviewDifficulty = "friendly" | "standard" | "tough";

export type ExperienceLevel = "fresher" | "junior" | "mid" | "senior" | "lead";

export type InterviewType = "behavioral" | "technical" | "mixed" | "hr";

export type FeedbackTiming = "instant" | "deferred";

export type QuestionType =
  | "multiple_choice_single"
  | "multiple_choice_multi"
  | "situational_judgement"
  | "short_answer"
  | "open_answer";

export type SessionState =
  | "created"
  | "planning"
  | "in_progress"
  | "evaluating"
  | "completed"
  | "ended_early"
  | "failed"
  | "expired";

export type HiringRecommendation =
  | "Strong hire"
  | "Hire"
  | "Lean hire"
  | "Lean no hire"
  | "No hire"
  | "Not enough answers to recommend";

export interface KeyPoint {
  id: string;
  point: string;
  acceptedKeywords: string[];
}

export interface BankQuestion {
  id: string;
  type: QuestionType;
  roles: string[];
  levels: ExperienceLevel[];
  skills: string[];
  difficulty: InterviewDifficulty;
  questionText: string;
  contextOrScenario?: string;
  // Multiple Choice / Situational
  options?: { id: string; text: string; isCorrect?: boolean; rating?: number }[];
  // Short Answer
  acceptedAnswers?: string[];
  // Open Answer
  modelAnswer?: string;
  keyPoints?: KeyPoint[];
  commonMistakes?: string[];
  explanation: string;
  estimatedSeconds: number;
}

export interface DimensionScores {
  accuracy: number; // 0 - 10
  confidence: number; // 0 - 10
  context: number; // 0 - 10
}

export interface AnswerEvaluation {
  accuracyScore: number; // 0 - 10
  confidenceScore: number; // 0 - 10
  contextScore: number; // 0 - 10
  answerScore: number; // 0 - 100 (computed via weighted formula)
  reasons: {
    accuracy: string;
    confidence: string;
    context: string;
  };
  whatWentWell: string[];
  whatToImprove: string[];
  improvedAnswerOutline?: string[];
  missedPoints?: string[];
  followUpQuestion?: string;
  flags?: string[];
  // Question Bank Self-Check additions
  keyPointsTicked?: string[];
  selfRatedConfidence?: number; // 1 - 5
  automatedKeyPointScore?: number; // 0 - 100
  userKeyPointScore?: number; // 0 - 100
  isAIEvaluated?: boolean;
}

export interface InterviewTurn {
  id: string;
  questionIndex: number;
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  targetSkill?: string;
  options?: { id: string; text: string; isCorrect?: boolean; rating?: number }[];
  userAnswer: string;
  selectedOptionIds?: string[];
  isFollowUp?: boolean;
  isSkipped?: boolean;
  evaluation?: AnswerEvaluation;
  timeSpentSeconds?: number;
  timestamp: string;
}

export interface InterviewSetupConfig {
  targetJobTitle: string;
  jobDescription?: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  questionCount: 5 | 8 | 10;
  difficulty: InterviewDifficulty;
  language: string;
  feedbackTiming: FeedbackTiming;
  interviewMode: InterviewMode;
  useResume: boolean;
  answerTimeLimitSeconds?: number; // 0 for off, or 60, 120, 180
  enableVoiceInput: boolean;
}

export interface SkillCoverage {
  skill: string;
  status: "strong" | "adequate" | "weak" | "not_tested";
  testedCount: number;
  averageScore: number;
}

export interface InterviewScorecardData {
  sessionId: string;
  date: string;
  targetJobTitle: string;
  experienceLevel: ExperienceLevel;
  interviewMode: InterviewMode;
  totalQuestions: number;
  answeredCount: number;
  skippedCount: number;
  overallScore: number; // 0 - 100
  ratingWord: "Excellent" | "Good" | "Fair" | "Needs Work" | "Needs Significant Work";
  recommendation: HiringRecommendation;
  recommendationReasoning: string;
  dimensionAverages: DimensionScores;
  selfRatedConfidenceAvg?: number; // 0 - 10
  strengths: string[];
  areasToImprove: string[];
  skillsCoverage: SkillCoverage[];
  nextSteps: {
    title: string;
    description: string;
    linkType: "practice" | "resume" | "roadmap";
  }[];
  turns: InterviewTurn[];
  disclaimer: string;
}

export interface InterviewSessionRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SessionState;
  config: InterviewSetupConfig;
  turns: InterviewTurn[];
  scorecard?: InterviewScorecardData;
}

export interface InterviewConsentRecord {
  agreed: boolean;
  version: string;
  timestamp: string;
}
