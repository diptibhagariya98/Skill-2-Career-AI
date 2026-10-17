import {
  AnswerEvaluation,
  BankQuestion,
  DimensionScores,
  HiringRecommendation,
  InterviewDifficulty,
  InterviewScorecardData,
  InterviewSetupConfig,
  InterviewTurn,
  KeyPoint,
  SessionState,
  SkillCoverage,
} from "../../types/interview";
import {
  NARRATIVE_TEMPLATES,
  REVIEWED_QUESTION_BANK,
  ROLE_PROFILES,
  SKILL_ALIASES,
} from "../../constants/interviewData";

/**
 * 1. Weighted Answer Score Calculation
 * Spec section 5.2: Accuracy 40%, Context 35%, Confidence 25%, scaled to 0-100.
 */
export function calculateAnswerScore(scores: DimensionScores): number {
  const clampedAccuracy = Math.min(10, Math.max(0, scores.accuracy));
  const clampedContext = Math.min(10, Math.max(0, scores.context));
  const clampedConfidence = Math.min(10, Math.max(0, scores.confidence));

  const weighted =
    clampedAccuracy * 0.4 + clampedContext * 0.35 + clampedConfidence * 0.25;
  return Math.round(weighted * 10);
}

/**
 * 2. Hiring Recommendation Bands
 * Spec section 6.3:
 * 85 - 100: Strong hire
 * 70 - 84: Hire
 * 55 - 69: Lean hire
 * 40 - 54: Lean no hire
 * 0 - 39: No hire
 * Under half answered: Not enough answers to recommend
 */
export function getHiringRecommendation(
  overallScore: number,
  answeredCount: number,
  totalQuestions: number
): {
  recommendation: HiringRecommendation;
  ratingWord: "Excellent" | "Good" | "Fair" | "Needs Work" | "Needs Significant Work";
  reasoning: string;
} {
  if (answeredCount < Math.ceil(totalQuestions / 2)) {
    return {
      recommendation: "Not enough answers to recommend",
      ratingWord: "Needs Work",
      reasoning: NARRATIVE_TEMPLATES.notEnoughAnswers,
    };
  }

  const score = Math.round(overallScore);

  if (score >= 85) {
    return {
      recommendation: "Strong hire",
      ratingWord: "Excellent",
      reasoning: NARRATIVE_TEMPLATES.strongHire[0],
    };
  } else if (score >= 70) {
    return {
      recommendation: "Hire",
      ratingWord: "Good",
      reasoning: NARRATIVE_TEMPLATES.hire[0],
    };
  } else if (score >= 55) {
    return {
      recommendation: "Lean hire",
      ratingWord: "Fair",
      reasoning: NARRATIVE_TEMPLATES.leanHire[0],
    };
  } else if (score >= 40) {
    return {
      recommendation: "Lean no hire",
      ratingWord: "Needs Work",
      reasoning: NARRATIVE_TEMPLATES.leanNoHire[0],
    };
  } else {
    return {
      recommendation: "No hire",
      ratingWord: "Needs Significant Work",
      reasoning: NARRATIVE_TEMPLATES.noHire[0],
    };
  }
}

/**
 * 3. Sensitive Data & PII Pattern Detection
 * Spec section 8.1 & 10: Blocks payment cards, social security / identity numbers, credentials.
 */
export function detectSensitiveContent(text: string): {
  containsSensitive: boolean;
  reason?: string;
} {
  if (!text) return { containsSensitive: false };

  // 16-digit credit card pattern (with optional hyphens/spaces)
  const ccRegex = /\b(?:\d{4}[ -]?){3}\d{4}\b/;
  if (ccRegex.test(text)) {
    return {
      containsSensitive: true,
      reason: "Payment card or account number detected. Please remove personal financial data.",
    };
  }

  // 12-digit Indian Aadhaar or 9-digit SSN
  const aadhaarRegex = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/;
  const ssnRegex = /\b\d{3}[ -]?\d{2}[ -]?\d{4}\b/;
  if (aadhaarRegex.test(text) || ssnRegex.test(text)) {
    return {
      containsSensitive: true,
      reason: "National identity number detected. Please remove sensitive government IDs.",
    };
  }

  return { containsSensitive: false };
}

/**
 * 4. Deterministic Job Description Skill Matcher
 * Spec section 9A.5: Matches skills from job description text without external AI calls.
 */
export function extractJobDescriptionSkills(jdText: string): string[] {
  if (!jdText || jdText.trim().length === 0) return [];

  const normalized = jdText.toLowerCase();
  const matchedSkills: Set<string> = new Set();

  for (const [skillName, aliases] of Object.entries(SKILL_ALIASES)) {
    for (const alias of aliases) {
      // Word boundary match
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(normalized)) {
        matchedSkills.add(skillName);
        break;
      }
    }
  }

  return Array.from(matchedSkills);
}

/**
 * 5. Open Answer Automated Check
 * Spec section 9A.4: Keyword matching + 50/50 formula.
 */
export function evaluateOpenAnswerDeterministic(
  answer: string,
  keyPoints: KeyPoint[],
  selfRatedConfidence: number = 3,
  userKeyPointTicked?: string[]
): AnswerEvaluation {
  const cleanAnswer = answer.trim();

  // Guard: Empty or extremely short answer (< 20 chars) scores 0 automatic
  if (cleanAnswer.length < 20) {
    return {
      accuracyScore: 1,
      confidenceScore: 2,
      contextScore: 1,
      answerScore: 10,
      reasons: {
        accuracy: "Answer is too brief to evaluate technical or behavioural competence.",
        confidence: "Very short answers indicate hesitance or lack of detail.",
        context: "Insufficient role or situational context provided.",
      },
      whatWentWell: cleanAnswer.length > 0 ? ["Attempted to provide an answer."] : [],
      whatToImprove: [
        "Provide a complete response with structured examples (STAR method).",
        "Cover the core principles asked in the prompt.",
      ],
      automatedKeyPointScore: 0,
      userKeyPointScore: 0,
      keyPointsTicked: [],
      selfRatedConfidence,
    };
  }

  const normalizedAnswer = cleanAnswer.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");

  // Check automated key points
  const automatedFoundIds: string[] = [];
  for (const kp of keyPoints) {
    const found = kp.acceptedKeywords.some((keyword) => {
      const kw = keyword.toLowerCase();
      return normalizedAnswer.includes(kw);
    });
    if (found) {
      automatedFoundIds.push(kp.id);
    }
  }

  const totalPoints = keyPoints.length > 0 ? keyPoints.length : 1;
  const automatedScore = Math.round((automatedFoundIds.length / totalPoints) * 100);

  // User confirmed ticks (defaults to automated if not yet confirmed by user)
  const finalTicks = userKeyPointTicked !== undefined ? userKeyPointTicked : automatedFoundIds;
  const userScore = Math.round((finalTicks.length / totalPoints) * 100);

  // 50/50 blended score
  const blendedScore = Math.round((automatedScore + userScore) / 2);

  // Derive 0-10 dimension scores
  const accuracyScore = Math.min(10, Math.max(1, Math.round(blendedScore / 10)));
  const confidenceScore = Math.min(10, Math.max(1, selfRatedConfidence * 2));
  const contextScore = Math.min(
    10,
    Math.max(1, cleanAnswer.length > 200 ? accuracyScore : Math.max(2, accuracyScore - 1))
  );

  const finalAnswerScore = calculateAnswerScore({
    accuracy: accuracyScore,
    confidence: confidenceScore,
    context: contextScore,
  });

  const whatWentWell: string[] = [];
  if (finalTicks.length > 0) {
    whatWentWell.push(`Addressed ${finalTicks.length} of ${totalPoints} target key points.`);
  }
  if (cleanAnswer.length > 150) {
    whatWentWell.push("Detailed answer length with descriptive context.");
  }

  const whatToImprove: string[] = [];
  const missedKp = keyPoints.filter((kp) => !finalTicks.includes(kp.id));
  if (missedKp.length > 0) {
    whatToImprove.push(`Incorporate key concepts: ${missedKp.map((k) => k.point).slice(0, 2).join("; ")}.`);
  }
  if (confidenceScore < 6) {
    whatToImprove.push("Use more decisive, proactive language ('I built', 'I decided').");
  }

  return {
    accuracyScore,
    confidenceScore,
    contextScore,
    answerScore: finalAnswerScore,
    reasons: {
      accuracy: `Covered ${finalTicks.length}/${totalPoints} key technical elements.`,
      confidence: `Self-rated delivery confidence: ${selfRatedConfidence}/5.`,
      context: cleanAnswer.length > 150 ? "Clear situational context provided." : "Could use more specific project examples.",
    },
    whatWentWell,
    whatToImprove,
    automatedKeyPointScore: automatedScore,
    userKeyPointScore: userScore,
    keyPointsTicked: finalTicks,
    selfRatedConfidence,
    missedPoints: missedKp.map((k) => k.point),
  };
}

/**
 * 6. Multiple Choice / Situational Scoring
 * Spec section 9A.3.
 */
export function evaluateChoiceQuestion(
  question: BankQuestion,
  selectedOptionIds: string[]
): AnswerEvaluation {
  if (question.type === "multiple_choice_single") {
    const correctOpt = question.options?.find((o) => o.isCorrect);
    const isCorrect = correctOpt && selectedOptionIds.includes(correctOpt.id);
    const score = isCorrect ? 100 : 0;
    const dimension = isCorrect ? 10 : 0;

    return {
      accuracyScore: dimension,
      confidenceScore: dimension > 0 ? 9 : 3,
      contextScore: dimension,
      answerScore: score,
      reasons: {
        accuracy: isCorrect ? "Correct option selected." : "Selected incorrect answer.",
        confidence: isCorrect ? "Direct and accurate choice." : "Review required concept.",
        context: isCorrect ? "Appropriately identified correct standard." : "Did not match best practice.",
      },
      whatWentWell: isCorrect ? ["Accurately identified correct response."] : [],
      whatToImprove: isCorrect ? [] : [question.explanation],
    };
  }

  if (question.type === "situational_judgement") {
    const selected = question.options?.find((o) => selectedOptionIds.includes(o.id));
    const rating = selected?.rating ?? 50;
    const dim = Math.round(rating / 10);

    return {
      accuracyScore: dim,
      confidenceScore: Math.min(10, dim + 1),
      contextScore: dim,
      answerScore: rating,
      reasons: {
        accuracy: `Response rating evaluated at ${rating}%.`,
        confidence: "Demonstrated situational instincts.",
        context: "Approach fits professional engineering standards.",
      },
      whatWentWell: rating >= 70 ? ["Selected highly collaborative, structured approach."] : [],
      whatToImprove: rating < 70 ? [question.explanation] : [],
    };
  }

  return {
    accuracyScore: 5,
    confidenceScore: 5,
    contextScore: 5,
    answerScore: 50,
    reasons: {
      accuracy: "Answer recorded.",
      confidence: "Standard confidence.",
      context: "Standard context.",
    },
    whatWentWell: [],
    whatToImprove: [],
  };
}

/**
 * 7. Deterministic Question Selection Algorithm
 * Spec section 9A.5.
 */
export function selectQuestionsForSession(
  config: InterviewSetupConfig,
  seed: number = 42
): BankQuestion[] {
  // Pseudorandom generator based on seed
  let currentSeed = seed;
  const pseudoRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  // Find matching role profile
  const titleLower = config.targetJobTitle.toLowerCase();
  const matchedRole = ROLE_PROFILES.find(
    (rp) =>
      titleLower.includes(rp.title.toLowerCase()) ||
      rp.aliases.some((alias) => titleLower.includes(alias))
  ) || ROLE_PROFILES[ROLE_PROFILES.length - 1]; // Fallback to general

  // Extract skills from JD or role defaults
  const jdSkills = config.jobDescription
    ? extractJobDescriptionSkills(config.jobDescription)
    : [];
  const targetSkills = jdSkills.length > 0 ? jdSkills : matchedRole.defaultSkills;

  // Filter pool from reviewed bank
  let pool = REVIEWED_QUESTION_BANK.filter(
    (q) =>
      q.roles.includes(matchedRole.id) ||
      q.roles.includes("general") ||
      q.skills.some((sk) => targetSkills.includes(sk))
  );

  if (pool.length === 0) {
    pool = [...REVIEWED_QUESTION_BANK];
  }

  // Shuffle pool deterministically
  const shuffled = [...pool].sort(() => pseudoRandom() - 0.5);

  // Pick up to config.questionCount questions
  const selected = shuffled.slice(0, config.questionCount);

  // If pool was smaller than required count, repeat without error
  while (selected.length < config.questionCount && pool.length > 0) {
    selected.push(pool[selected.length % pool.length]);
  }

  return selected;
}

/**
 * 8. State Machine Transition Guard
 * Spec section 4.1.
 */
const VALID_TRANSITIONS: Record<SessionState, SessionState[]> = {
  created: ["planning"],
  planning: ["in_progress", "failed"],
  in_progress: ["evaluating", "ended_early"],
  evaluating: ["in_progress", "completed", "failed"],
  completed: [],
  ended_early: [],
  failed: ["planning"],
  expired: [],
};

export function validateStateTransition(current: SessionState, next: SessionState): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

/**
 * 9. Comprehensive Scorecard Generator
 * Spec section 6.2 & 9A.7.
 */
export function generateScorecard(
  sessionId: string,
  config: InterviewSetupConfig,
  turns: InterviewTurn[]
): InterviewScorecardData {
  const totalQuestions = config.questionCount;
  const answeredTurns = turns.filter((t) => !t.isSkipped && t.evaluation);
  const answeredCount = answeredTurns.length;
  const skippedCount = turns.filter((t) => t.isSkipped).length;

  // Calculate overall score (skipped turns count as 0)
  const totalScoreSum = turns.reduce((sum, t) => {
    if (t.isSkipped || !t.evaluation) return sum;
    return sum + t.evaluation.answerScore;
  }, 0);

  const overallScore = totalQuestions > 0 ? Math.round(totalScoreSum / totalQuestions) : 0;

  // Dimension averages
  const accSum = answeredTurns.reduce((s, t) => s + (t.evaluation?.accuracyScore ?? 0), 0);
  const confSum = answeredTurns.reduce((s, t) => s + (t.evaluation?.confidenceScore ?? 0), 0);
  const ctxSum = answeredTurns.reduce((s, t) => s + (t.evaluation?.contextScore ?? 0), 0);

  const dimensionAverages: DimensionScores = {
    accuracy: answeredCount > 0 ? Math.round((accSum / answeredCount) * 10) / 10 : 0,
    confidence: answeredCount > 0 ? Math.round((confSum / answeredCount) * 10) / 10 : 0,
    context: answeredCount > 0 ? Math.round((ctxSum / answeredCount) * 10) / 10 : 0,
  };

  // Self-rated confidence avg
  const selfRatings = answeredTurns
    .map((t) => t.evaluation?.selfRatedConfidence)
    .filter((r): r is number => r !== undefined);
  const selfRatedConfidenceAvg =
    selfRatings.length > 0
      ? Math.round((selfRatings.reduce((a, b) => a + b, 0) / selfRatings.length) * 20) / 10
      : undefined;

  const { recommendation, ratingWord, reasoning } = getHiringRecommendation(
    overallScore,
    answeredCount,
    totalQuestions
  );

  // Strengths and Areas to Improve
  const strengths: string[] = [];
  const areasToImprove: string[] = [];

  for (const t of answeredTurns) {
    if (t.evaluation?.whatWentWell && t.evaluation.whatWentWell.length > 0) {
      strengths.push(...t.evaluation.whatWentWell);
    }
    if (t.evaluation?.whatToImprove && t.evaluation.whatToImprove.length > 0) {
      areasToImprove.push(...t.evaluation.whatToImprove);
    }
  }

  // Deduplicate and trim
  const uniqueStrengths = Array.from(new Set(strengths)).slice(0, 4);
  const uniqueImprovements = Array.from(new Set(areasToImprove)).slice(0, 4);

  // Skill coverage
  const skillScores: Record<string, { total: number; count: number }> = {};
  for (const t of answeredTurns) {
    const sk = t.targetSkill || "General";
    if (!skillScores[sk]) skillScores[sk] = { total: 0, count: 0 };
    skillScores[sk].total += t.evaluation?.answerScore ?? 0;
    skillScores[sk].count += 1;
  }

  const skillsCoverage: SkillCoverage[] = Object.entries(skillScores).map(([skill, data]) => {
    const avg = Math.round(data.total / data.count);
    return {
      skill,
      testedCount: data.count,
      averageScore: avg,
      status: avg >= 70 ? "strong" : avg >= 50 ? "adequate" : "weak",
    };
  });

  return {
    sessionId,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    targetJobTitle: config.targetJobTitle,
    experienceLevel: config.experienceLevel,
    interviewMode: config.interviewMode,
    totalQuestions,
    answeredCount,
    skippedCount,
    overallScore,
    ratingWord,
    recommendation,
    recommendationReasoning: reasoning,
    dimensionAverages,
    selfRatedConfidenceAvg,
    strengths: uniqueStrengths.length > 0 ? uniqueStrengths : ["Completed interview practice session."],
    areasToImprove: uniqueImprovements.length > 0 ? uniqueImprovements : ["Continue consistent mock interview sessions."],
    skillsCoverage,
    nextSteps: [
      {
        title: "Learn & Practice Hub",
        description: "Sharpen specific technical topics and algorithms with interactive quizzes.",
        linkType: "practice",
      },
      {
        title: "ATS Resume Optimization",
        description: "Align your project highlights with the target keywords identified in this interview.",
        linkType: "resume",
      },
    ],
    turns,
    disclaimer:
      "This is a practice estimate of how a typical interviewer might react. It is not a prediction of real hiring decisions.",
  };
}
