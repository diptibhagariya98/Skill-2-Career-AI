"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  SkipForward,
  Pause,
  StopCircle,
  Sparkles,
  User,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Award,
  Clock,
  ArrowRight,
  ShieldAlert,
  Mic,
  MicOff,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useBackHandler, BackPriority, hapticLight } from "@/shared/platform";
import {
  BankQuestion,
  InterviewSetupConfig,
  InterviewTurn,
  QuestionType,
} from "../../types/interview";
import {
  calculateAnswerScore,
  detectSensitiveContent,
  evaluateChoiceQuestion,
  evaluateOpenAnswerDeterministic,
} from "../../lib/interview/engine";
import { evaluateAIAnswer } from "../../lib/interview/geminiService";
import OpenAnswerCompare from "./OpenAnswerCompare";

interface InterviewThreadProps {
  config: InterviewSetupConfig;
  questions: BankQuestion[];
  onFinishSession: (turns: InterviewTurn[]) => void;
  onPauseSession?: (turns: InterviewTurn[]) => void;
}

export default function InterviewThread({
  config,
  questions,
  onFinishSession,
  onPauseSession,
}: InterviewThreadProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [userText, setUserText] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [openCompareData, setOpenCompareData] = useState<{
    question: BankQuestion;
    answer: string;
    autoTicks: string[];
  } | null>(null);
  const [showOutlineForTurnId, setShowOutlineForTurnId] = useState<string | null>(null);
  const [hasUnreadFeedback, setHasUnreadFeedback] = useState(false);
  const [sensitiveWarning, setSensitiveWarning] = useState<string | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [showScoreMethod, setShowScoreMethod] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  // Trigger light haptic when instant feedback is revealed
  useEffect(() => {
    if (hasUnreadFeedback) {
      hapticLight();
    }
  }, [hasUnreadFeedback]);

  // Metric color helper: green for >=8, amber for 5-7, red for <5
  const getMetricColor = (score: number) => {
    if (score >= 8) return "text-emerald-700";
    if (score >= 5) return "text-amber-700";
    return "text-rose-700";
  };

  const getMetricBarColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 5) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return { label: "Strong answer", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    if (score >= 70) return { label: "Good answer", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (score >= 50) return { label: "Developing", bg: "bg-amber-100 text-amber-800 border-amber-200" };
    return { label: "Needs practice", bg: "bg-rose-100 text-rose-800 border-rose-200" };
  };

  // Reset rationale and score info drawers on question change
  useEffect(() => {
    setShowRationale(false);
    setShowScoreMethod(false);
  }, [currentIdx]);

  // Clean up voice transcription on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Intercept back navigation during active session to confirm exit
  useBackHandler(
    BackPriority.OVERLAY,
    () => {
      if (showEndModal) {
        setShowEndModal(false);
        return true;
      }
      setShowEndModal(true);
      return true;
    },
    [showEndModal]
  );

  const currentQuestion = questions[currentIdx];
  const isLastQuestion = currentIdx >= questions.length - 1;

  // Auto scroll to bottom of thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isEvaluating, openCompareData, hasUnreadFeedback]);

  // Sensitive PII real-time check
  useEffect(() => {
    if (userText.length > 8) {
      const check = detectSensitiveContent(userText);
      setSensitiveWarning(check.containsSensitive ? check.reason || "Sensitive data detected" : null);
    } else {
      setSensitiveWarning(null);
    }
  }, [userText]);

  // Submit Answer handler
  const handleSubmitAnswer = async () => {
    if (sensitiveWarning) {
      toast.error(sensitiveWarning);
      return;
    }

    const isChoice =
      currentQuestion.type === "multiple_choice_single" ||
      currentQuestion.type === "situational_judgement";

    if (isChoice && selectedOptions.length === 0) {
      toast.error("Please select an option to submit your answer.");
      return;
    }

    if (!isChoice && userText.trim().length < 3) {
      toast.error("Please enter your answer before submitting.");
      return;
    }

    // Quick Practice Open-Answer 3-step compare check
    if (config.interviewMode === "quick_practice" && currentQuestion.type === "open_answer") {
      const initialEval = evaluateOpenAnswerDeterministic(
        userText,
        currentQuestion.keyPoints || [],
        3
      );
      setOpenCompareData({
        question: currentQuestion,
        answer: userText,
        autoTicks: initialEval.keyPointsTicked || [],
      });
      return;
    }

    // Standard / Full AI evaluation path
    setIsEvaluating(true);

    const turnId = `turn-${Date.now()}`;
    const newTurn: InterviewTurn = {
      id: turnId,
      questionIndex: currentIdx + 1,
      questionId: currentQuestion.id,
      questionText: currentQuestion.questionText,
      questionType: currentQuestion.type,
      targetSkill: currentQuestion.skills[0] || "General",
      options: currentQuestion.options,
      userAnswer: isChoice
        ? currentQuestion.options?.find((o) => selectedOptions.includes(o.id))?.text || "Selected option"
        : userText.trim(),
      selectedOptionIds: selectedOptions,
      timestamp: new Date().toISOString(),
    };

    let evaluation = undefined;

    if (isChoice) {
      evaluation = evaluateChoiceQuestion(currentQuestion, selectedOptions);
    } else if (config.interviewMode === "full_ai") {
      evaluation = await evaluateAIAnswer(newTurn, config);
    } else {
      evaluation = evaluateOpenAnswerDeterministic(
        userText,
        currentQuestion.keyPoints || [],
        3
      );
    }

    newTurn.evaluation = evaluation;
    const updatedTurns = [...turns, newTurn];
    setTurns(updatedTurns);
    setIsEvaluating(false);
    setUserText("");
    setSelectedOptions([]);

    if (config.feedbackTiming === "instant") {
      setHasUnreadFeedback(true);
    } else {
      // In realistic mode, advance directly
      advanceToNextQuestion(updatedTurns);
    }
  };

  // Called when user completes the 3-step open answer self-check
  const handleConfirmOpenEvaluation = (tickedKpIds: string[], confidence: number) => {
    if (!openCompareData) return;

    const evaluation = evaluateOpenAnswerDeterministic(
      openCompareData.answer,
      openCompareData.question.keyPoints || [],
      confidence,
      tickedKpIds
    );

    const turnId = `turn-${Date.now()}`;
    const newTurn: InterviewTurn = {
      id: turnId,
      questionIndex: currentIdx + 1,
      questionId: openCompareData.question.id,
      questionText: openCompareData.question.questionText,
      questionType: openCompareData.question.type,
      targetSkill: openCompareData.question.skills[0] || "General",
      userAnswer: openCompareData.answer,
      evaluation,
      timestamp: new Date().toISOString(),
    };

    const updatedTurns = [...turns, newTurn];
    setTurns(updatedTurns);
    setOpenCompareData(null);
    setUserText("");

    if (config.feedbackTiming === "instant") {
      setHasUnreadFeedback(true);
    } else {
      advanceToNextQuestion(updatedTurns);
    }
  };

  // Skip question
  const handleSkipQuestion = () => {
    const turnId = `turn-${Date.now()}`;
    const skippedTurn: InterviewTurn = {
      id: turnId,
      questionIndex: currentIdx + 1,
      questionId: currentQuestion.id,
      questionText: currentQuestion.questionText,
      questionType: currentQuestion.type,
      targetSkill: currentQuestion.skills[0] || "General",
      userAnswer: "[Question Skipped]",
      isSkipped: true,
      timestamp: new Date().toISOString(),
    };

    const updatedTurns = [...turns, skippedTurn];
    setTurns(updatedTurns);
    setUserText("");
    setSelectedOptions([]);
    advanceToNextQuestion(updatedTurns);
  };

  const advanceToNextQuestion = (currentTurns: InterviewTurn[]) => {
    setHasUnreadFeedback(false);
    if (isLastQuestion) {
      onFinishSession(currentTurns);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

    const formatExperienceLevel = (level?: string) => {
    if (!level) return "Junior";
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const handleToggleVoice = () => {
    if (typeof window === "undefined") return;

    interface SpeechResult {
      [index: number]: { transcript: string };
    }
    interface SpeechEvent {
      results: {
        length: number;
        [index: number]: SpeechResult;
      };
    }
    interface SpeechRecInstance {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: (e: SpeechEvent) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    }

    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => SpeechRecInstance;
      webkitSpeechRecognition?: new () => SpeechRecInstance;
    };
    const SpeechAPI = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechAPI) {
      toast("Voice transcription is not supported in this browser. Please type your answer.", { icon: "🎙️" });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (e: SpeechEvent) => {
        let transcript = "";
        for (let i = 0; i < e.results.length; i++) {
          const item = e.results[i];
          if (item && item[0]) {
            transcript += item[0].transcript + " ";
          }
        }
        if (transcript.trim()) {
          setUserText((prev) => {
            const sep = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
            return prev + sep + transcript.trim();
          });
        }
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
      hapticLight();
      toast.success("Listening... speak your response", { duration: 2500 });
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full bg-white rounded-none sm:rounded-3xl border-0 sm:border border-gray-200 shadow-none sm:shadow-xl overflow-hidden relative">
      {/* Top Header Bar - Single Unified Native App Bar with Safe Area Inset */}
      <div className="pt-[max(env(safe-area-inset-top,0px),0.75rem)] px-3 sm:px-5 pb-2.5 bg-white/95 backdrop-blur-md border-b border-gray-150 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2 min-h-[44px]">
          {/* Back Chevron + Question Counter & Shortened Role Line */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              className="w-10 h-10 -ml-1 rounded-xl text-gray-700 hover:text-indigo-600 hover:bg-gray-100 transition-colors flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px] active:scale-95"
              aria-label="Exit or end interview session"
              title="End interview"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-gray-900 whitespace-nowrap">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                    config.interviewMode === "full_ai"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {config.interviewMode === "full_ai" ? "Smart AI" : "Quick practice"}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium truncate leading-tight">
                {config.targetJobTitle} · {formatExperienceLevel(config.experienceLevel)}
              </p>
            </div>
          </div>

          {/* Action Icons: 48px Pause & End Pill */}
          <div className="flex items-center gap-1 shrink-0">
            {onPauseSession && (
              <button
                type="button"
                onClick={() => onPauseSession(turns)}
                className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-center active:scale-95"
                title="Pause and resume later"
                aria-label="Pause interview session"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              className="px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-semibold text-gray-600 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 transition-colors flex items-center gap-1 active:scale-95"
              aria-label="End interview"
            >
              <StopCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>End</span>
            </button>
          </div>
        </div>

        {/* Thin Segmented Progress Bar Integrated at Bottom of App Bar */}
        <div
          className="grid gap-1 pt-0.5"
          style={{ gridTemplateColumns: `repeat(${Math.max(questions.length, 1)}, minmax(0, 1fr))` }}
        >
          {questions.map((_, qIdx) => (
            <div
              key={qIdx}
              className={`h-1 rounded-full transition-all duration-300 ${
                qIdx < currentIdx
                  ? "bg-indigo-600"
                  : qIdx === currentIdx
                  ? "bg-indigo-500 shadow-xs"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Conversation Thread Message Area (Hidden Scrollbars, Tonal Background) */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5 bg-slate-50/50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Previous Answered Turns */}
        {turns.map((turn) => (
          <div key={turn.id} className="space-y-3.5">
            {/* Interviewer Question Bubble (Full Width, No Avatar Overhead) */}
            <div className="mr-auto w-full max-w-[94%] sm:max-w-[85%] bg-white rounded-2xl p-3.5 sm:p-4 text-gray-900 text-sm leading-relaxed border border-gray-150/70 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-indigo-700">
                  AI Interviewer
                </span>
                {turn.targetSkill && (
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                    {turn.targetSkill}
                  </span>
                )}
              </div>
              <p className="font-medium text-gray-900">{turn.questionText}</p>
            </div>

            {/* Candidate Answer Bubble (Right-Aligned, No Avatar Squeeze) */}
            <div className="ml-auto w-full max-w-[94%] sm:max-w-[85%] flex justify-end">
              <div
                className={`rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed ${
                  turn.isSkipped
                    ? "bg-amber-50 border border-amber-200 text-amber-900 italic"
                    : "bg-indigo-600 text-white shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className={`text-[11px] font-medium ${turn.isSkipped ? "text-amber-700" : "text-indigo-200"}`}>
                    Your response
                  </span>
                </div>
                <p className="whitespace-pre-wrap font-sans">{turn.userAnswer}</p>
              </div>
            </div>

            {/* Instant Feedback Card (Practice Mode) */}
            {turn.evaluation && config.feedbackTiming === "instant" && (
              <div
                className="w-full max-w-[94%] sm:max-w-[85%] mr-auto bg-indigo-50/70 rounded-2xl p-4 sm:p-5 space-y-3.5 border-0 shadow-2xs animate-fade-in"
                aria-live="polite"
              >
                {/* Score Hero Section */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                        {turn.evaluation.answerScore}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">/100</span>
                    </div>
                    {(() => {
                      const badge = getScoreBadge(turn.evaluation.answerScore);
                      return (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowScoreMethod((prev) => !prev)}
                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition"
                    title="How this score was calculated"
                  >
                    <span>Scoring info</span>
                    {showScoreMethod ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Expandable Scoring Method Explanation */}
                {showScoreMethod && (
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-150 text-[11px] text-gray-600 leading-relaxed space-y-1 animate-fade-in">
                    <div className="font-semibold text-gray-800">Standard assessment formula:</div>
                    <p>
                      Weighted 40% Accuracy, 35% Context, and 25% Confidence (rounded to nearest integer).
                    </p>
                    <p className="text-gray-500 text-[10px]">
                      Method: {turn.evaluation.isAIEvaluated ? "Gemini Dynamic Rubric" : "Key-Point Benchmark Evaluation"}
                    </p>
                  </div>
                )}

                {/* 3 Dimension Metric Rows (replaces clipped 3-column tiles) */}
                <div className="space-y-2 pt-0.5">
                  {/* Accuracy Row */}
                  <div className="bg-white rounded-xl p-2.5 space-y-1 border border-indigo-150/60 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-800">Accuracy</span>
                        <span className="text-[10px] text-gray-500 font-normal">· 40% weight</span>
                      </div>
                      <span className={`font-black text-xs ${getMetricColor(turn.evaluation.accuracyScore)}`}>
                        {turn.evaluation.accuracyScore}/10
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getMetricBarColor(turn.evaluation.accuracyScore)}`}
                        style={{ width: `${Math.min(100, turn.evaluation.accuracyScore * 10)}%` }}
                      />
                    </div>
                  </div>

                  {/* Confidence Row */}
                  <div className="bg-white rounded-xl p-2.5 space-y-1 border border-indigo-150/60 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-800">Confidence</span>
                        <span className="text-[10px] text-gray-500 font-normal">· 25% weight</span>
                      </div>
                      <span className={`font-black text-xs ${getMetricColor(turn.evaluation.confidenceScore)}`}>
                        {turn.evaluation.confidenceScore}/10
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getMetricBarColor(turn.evaluation.confidenceScore)}`}
                        style={{ width: `${Math.min(100, turn.evaluation.confidenceScore * 10)}%` }}
                      />
                    </div>
                  </div>

                  {/* Context Row */}
                  <div className="bg-white rounded-xl p-2.5 space-y-1 border border-indigo-150/60 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-800">Context</span>
                        <span className="text-[10px] text-gray-500 font-normal">· 35% weight</span>
                      </div>
                      <span className={`font-black text-xs ${getMetricColor(turn.evaluation.contextScore)}`}>
                        {turn.evaluation.contextScore}/10
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getMetricBarColor(turn.evaluation.contextScore)}`}
                        style={{ width: `${Math.min(100, turn.evaluation.contextScore * 10)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bullets: What Went Well */}
                {turn.evaluation.whatWentWell.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-emerald-800 block">What went well:</span>
                    <ul className="space-y-1 text-gray-700 text-xs pl-0.5">
                      {turn.evaluation.whatWentWell.map((pt, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concept Context / Why this matters */}
                {questions[turn.questionIndex - 1]?.contextOrScenario && (
                  <div className="p-2.5 bg-white/80 rounded-xl border border-indigo-150/60 text-xs text-gray-700 space-y-0.5">
                    <span className="font-bold text-indigo-900 block text-[11px]">Why this matters:</span>
                    <p className="text-[11px] text-gray-600 leading-relaxed italic">
                      {questions[turn.questionIndex - 1].contextOrScenario}
                    </p>
                  </div>
                )}

                {/* Bullets: What to Improve */}
                {turn.evaluation.whatToImprove.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-amber-800 block">What to improve:</span>
                    <ul className="space-y-1 text-gray-700 text-xs pl-0.5">
                      {turn.evaluation.whatToImprove.map((pt, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Collapsible Model Answer Outline */}
                {turn.evaluation.improvedAnswerOutline && (
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowOutlineForTurnId((prev) => (prev === turn.id ? null : turn.id))
                      }
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 mt-1 transition"
                    >
                      {showOutlineForTurnId === turn.id ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Hide Model Answer Outline
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> Show Model Answer Outline
                        </>
                      )}
                    </button>
                    {showOutlineForTurnId === turn.id && (
                      <div className="mt-2 p-3 bg-white rounded-xl border border-indigo-150 text-xs text-gray-700 space-y-1.5 animate-fade-in">
                        {turn.evaluation.improvedAnswerOutline.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="font-bold text-indigo-600 shrink-0">{idx + 1}.</span>
                            <span className="leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Current Active Question (No Avatar Overhead) */}
        {!hasUnreadFeedback && !openCompareData && currentQuestion && (
          <div className="mr-auto w-full max-w-[94%] sm:max-w-[85%] bg-gradient-to-b from-indigo-50/90 to-indigo-50/50 rounded-2xl p-4 sm:p-5 text-gray-900 border border-indigo-150/70 shadow-2xs space-y-2.5 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-indigo-700">
                AI Interviewer
              </span>
              {currentQuestion.skills[0] && (
                <span className="text-[10px] font-medium px-2 py-0.5 bg-white text-gray-700 rounded-md border border-gray-200/80">
                  {currentQuestion.skills[0]}
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed">
              {currentQuestion.questionText}
            </p>

            {/* Collapsible Question Rationale / Scenario */}
            {currentQuestion.contextOrScenario && (
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowRationale((prev) => !prev)}
                  className="flex items-center gap-1.5 text-2xs text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                  aria-label="Toggle question rationale"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Why this question?</span>
                  {showRationale ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showRationale && (
                  <div className="mt-1.5 p-2.5 bg-white/90 rounded-xl border border-indigo-100 text-xs text-gray-700 italic leading-relaxed animate-in fade-in">
                    {currentQuestion.contextOrScenario}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Open Answer Compare Modal inside thread for Quick Practice */}
        {openCompareData && (
          <OpenAnswerCompare
            question={openCompareData.question}
            candidateAnswer={openCompareData.answer}
            initialAutomatedTicks={openCompareData.autoTicks}
            onConfirmEvaluation={handleConfirmOpenEvaluation}
          />
        )}

        {/* Evaluating State Loader */}
        {isEvaluating && (
          <div className="flex items-center gap-3 p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 animate-pulse">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-spin" />
            <div className="text-xs font-semibold text-indigo-900">
              Analyzing your answer across Accuracy, Confidence, and Context…
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sensitive Content Warning Alert */}
      {sensitiveWarning && (
        <div className="px-5 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2 text-xs text-red-700 font-medium">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{sensitiveWarning}</span>
        </div>
      )}

      {/* Docked Next Question Action Bar for Instant Feedback Read Time (Item 5) */}
      {hasUnreadFeedback && (
        <div className="p-3 sm:p-4 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] bg-white border-t border-gray-150 shrink-0 shadow-lg space-y-2 animate-fade-in">
          <p className="text-[11px] text-gray-500 text-center font-medium">
            Take a moment to review your feedback. When ready, continue.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setHasUnreadFeedback(false);
                setTurns((prev) => prev.slice(0, -1));
              }}
              className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 active:scale-95 transition min-h-[48px] whitespace-nowrap"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => advanceToNextQuestion(turns)}
              className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2"
            >
              <span className="whitespace-nowrap">{isLastQuestion ? "Finish interview" : "Next question"}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sticky Interactive Answer Box (Docked with Safe Area UX-05 & dynamic expansion) */}
      {!hasUnreadFeedback && !openCompareData && currentQuestion && (
        <div className="p-2.5 sm:p-4 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] bg-white border-t border-gray-200 shrink-0 shadow-lg space-y-2">
          {/* Multiple Choice / Situational Selection Options */}
          {(currentQuestion.type === "multiple_choice_single" ||
            currentQuestion.type === "situational_judgement") && (
            <div className="space-y-2 mb-1 max-h-48 overflow-y-auto pr-1">
              <span className="text-xs font-bold text-gray-700 block">Select the best option:</span>
              {currentQuestion.options?.map((opt) => {
                const isSelected = selectedOptions.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOptions([opt.id])}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold shadow-2xs"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                        isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Open Answer / Short Answer Textarea with Auto-Expansion & Voice Mic */}
          {currentQuestion.type !== "multiple_choice_single" &&
            currentQuestion.type !== "situational_judgement" && (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={userText}
                  onChange={(e) => {
                    setUserText(e.target.value);
                    if (textareaRef.current) {
                      textareaRef.current.style.height = "auto";
                      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
                    }
                  }}
                  placeholder="Type your response here..."
                  rows={2}
                  maxLength={3000}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 bg-gray-50/50 shadow-2xs resize-none min-h-[44px] max-h-32 transition-all leading-relaxed"
                />
              </div>
            )}

          {/* Action Row: Skip, Mic, Character Count & Submit */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSkipQuestion}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors min-h-[38px] active:scale-95"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip</span>
              </button>

              {currentQuestion.type !== "multiple_choice_single" &&
                currentQuestion.type !== "situational_judgement" && (
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${
                      isListening
                        ? "bg-red-500 text-white border-red-600 animate-pulse shadow-xs"
                        : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 hover:text-gray-900"
                    }`}
                    title={isListening ? "Stop voice listening" : "Click to speak response"}
                    aria-label="Toggle voice response"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xs text-gray-500">
                {userText.length > 0 ? `${userText.length}/3000` : "~2 min suggested"}
              </span>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={
                  isEvaluating ||
                  (currentQuestion.type !== "multiple_choice_single" &&
                    currentQuestion.type !== "situational_judgement" &&
                    userText.trim().length === 0) ||
                  ((currentQuestion.type === "multiple_choice_single" ||
                    currentQuestion.type === "situational_judgement") &&
                    selectedOptions.length === 0)
                }
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 min-h-[38px]"
                aria-label="Submit answer"
              >
                <span>Submit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal on End Early or Back Navigation */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <StopCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">End Interview Session?</h3>
                <p className="text-xs text-gray-500">Your progress will be saved.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to end this interview? All answered questions and interim scoring will be saved to your History.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEndModal(false);
                  onFinishSession(turns);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors"
              >
                End & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
