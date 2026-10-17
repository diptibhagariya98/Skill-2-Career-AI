import {
  calculateAnswerScore,
  getHiringRecommendation,
  detectSensitiveContent,
  extractJobDescriptionSkills,
  evaluateOpenAnswerDeterministic,
  selectQuestionsForSession,
  validateStateTransition,
} from "../engine";
import { KeyPoint, InterviewSetupConfig } from "../../../types/interview";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

console.log("=== RUNNING PHASE 4 MOCK INTERVIEW ENGINE TEST SUITE ===");

// 1. Answer Score Weighted Calculation (Spec 5.2)
{
  // 10 acc (40) + 10 ctx (35) + 10 conf (25) = 100
  const perfect = calculateAnswerScore({ accuracy: 10, context: 10, confidence: 10 });
  assert(perfect === 100, `Expected 100, got ${perfect}`);

  // 8 acc (3.2) + 6 ctx (2.1) + 4 conf (1.0) = 6.3 * 10 = 63
  const mixed = calculateAnswerScore({ accuracy: 8, context: 6, confidence: 4 });
  assert(mixed === 63, `Expected 63, got ${mixed}`);

  console.log("✓ Test 1 Passed: Weighted answer scoring formula exact.");
}

// 2. Recommendation Bands Boundaries (Spec 6.3)
{
  const total = 8;
  const half = 4;

  // Boundary 85 -> Strong hire
  assert(getHiringRecommendation(85, half, total).recommendation === "Strong hire", "85 should be Strong hire");
  assert(getHiringRecommendation(100, half, total).recommendation === "Strong hire", "100 should be Strong hire");

  // Boundary 84 -> Hire
  assert(getHiringRecommendation(84, half, total).recommendation === "Hire", "84 should be Hire");
  assert(getHiringRecommendation(70, half, total).recommendation === "Hire", "70 should be Hire");

  // Boundary 69 -> Lean hire
  assert(getHiringRecommendation(69, half, total).recommendation === "Lean hire", "69 should be Lean hire");
  assert(getHiringRecommendation(55, half, total).recommendation === "Lean hire", "55 should be Lean hire");

  // Boundary 54 -> Lean no hire
  assert(getHiringRecommendation(54, half, total).recommendation === "Lean no hire", "54 should be Lean no hire");
  assert(getHiringRecommendation(40, half, total).recommendation === "Lean no hire", "40 should be Lean no hire");

  // Boundary 39 -> No hire
  assert(getHiringRecommendation(39, half, total).recommendation === "No hire", "39 should be No hire");
  assert(getHiringRecommendation(0, half, total).recommendation === "No hire", "0 should be No hire");

  // Under half answered (3 out of 8) -> Not enough answers to recommend
  assert(
    getHiringRecommendation(95, 3, total).recommendation === "Not enough answers to recommend",
    "Fewer than half answered must return Not enough answers to recommend"
  );

  console.log("✓ Test 2 Passed: Fixed recommendation boundaries and half-answered rule verified.");
}

// 3. Sensitive Data / PII Filtering (Spec 8.1 & 10)
{
  const ccText = "My credit card is 4532-1234-5678-9012 for validation.";
  assert(detectSensitiveContent(ccText).containsSensitive === true, "Credit card must be detected");

  const normalText = "I worked on an e-commerce platform optimizing checkout performance.";
  assert(detectSensitiveContent(normalText).containsSensitive === false, "Normal technical text must pass");

  console.log("✓ Test 3 Passed: Sensitive PII detector operates reliably.");
}

// 4. Deterministic Job Description Skill Matcher (Spec 9A.5)
{
  const sampleJD = `
    Looking for a Frontend Developer with strong experience in React, TypeScript, and REST APIs.
    Must understand Performance optimization, state management, and clear communication.
  `;
  const skills = extractJobDescriptionSkills(sampleJD);
  assert(skills.includes("React"), "Must match React");
  assert(skills.includes("TypeScript"), "Must match TypeScript");
  assert(skills.includes("REST APIs"), "Must match REST APIs");
  assert(skills.includes("Performance"), "Must match Performance");

  console.log("✓ Test 4 Passed: Deterministic JD skill matcher accurately identified target skills.");
}

// 5. Open Answer Automated Key-Point Checking & 50/50 Rule (Spec 9A.4)
{
  const keyPoints: KeyPoint[] = [
    { id: "kp1", point: "Virtual DOM in-memory representation", acceptedKeywords: ["in-memory", "virtual dom"] },
    { id: "kp2", point: "Reconciliation diffing algorithm", acceptedKeywords: ["diff", "diffing", "reconciliation"] },
    { id: "kp3", point: "Batch updates to real DOM", acceptedKeywords: ["batch", "real dom"] },
  ];

  // Strong answer covering all 3
  const candidateAnswer = "React keeps a virtual dom in-memory representation and runs reconciliation diffing to batch changes to the real dom.";
  const evalResult = evaluateOpenAnswerDeterministic(candidateAnswer, keyPoints, 4);

  assert(evalResult.automatedKeyPointScore === 100, "Automated check should find all 3 keywords");
  assert(evalResult.answerScore > 80, "Strong answer should score above 80");

  // Very short answer guard (< 20 chars)
  const tinyAnswer = "I do not know.";
  const tinyEval = evaluateOpenAnswerDeterministic(tinyAnswer, keyPoints, 1);
  assert(tinyEval.automatedKeyPointScore === 0, "Tiny answer must score 0 automated keypoints");

  console.log("✓ Test 5 Passed: Open answer keyword matching and 50/50 scoring verified.");
}

// 6. Deterministic Question Selection (Spec 9A.5)
{
  const config: InterviewSetupConfig = {
    targetJobTitle: "Frontend Developer",
    experienceLevel: "junior",
    interviewType: "mixed",
    questionCount: 5,
    difficulty: "standard",
    language: "en",
    feedbackTiming: "instant",
    interviewMode: "quick_practice",
    useResume: false,
    enableVoiceInput: true,
  };

  const selection1 = selectQuestionsForSession(config, 12345);
  const selection2 = selectQuestionsForSession(config, 12345);

  assert(selection1.length === 5, "Must select exactly 5 questions");
  assert(selection1[0].id === selection2[0].id, "Deterministic seed must yield identical first question");
  assert(selection1[4].id === selection2[4].id, "Deterministic seed must yield identical last question");

  console.log("✓ Test 6 Passed: Question selection is 100% deterministic with seed.");
}

// 7. State Machine Guard (Spec 4.1)
{
  assert(validateStateTransition("created", "planning") === true, "created -> planning allowed");
  assert(validateStateTransition("in_progress", "evaluating") === true, "in_progress -> evaluating allowed");
  assert(validateStateTransition("completed", "in_progress") === false, "completed -> in_progress disallowed");

  console.log("✓ Test 7 Passed: Session state transitions strictly enforced.");
}

console.log("\nALL 7 TESTS PASSED SUCCESSFULLY! (0 Errors)");
