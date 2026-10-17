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
  ChevronDown,
  ChevronUp,
  Award,
  Clock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      alert(sensitiveWarning);
      return;
    }

    const isChoice =
      currentQuestion.type === "multiple_choice_single" ||
      currentQuestion.type === "situational_judgement";

    if (isChoice && selectedOptions.length === 0) {
      alert("Please select an option to submit your answer.");
      return;
    }

    if (!isChoice && userText.trim().length < 3) {
      alert("Please enter your answer before submitting.");
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

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)] min-h-[550px] bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            Q{currentIdx + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-gray-900">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span
                className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                  config.interviewMode === "full_ai"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {config.interviewMode === "full_ai" ? "Smart AI" : "Quick Practice"}
              </span>
            </div>
            <span className="text-2xs text-gray-500 font-medium">
              Target: {config.targetJobTitle} • {config.experienceLevel}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onPauseSession && (
            <button
              type="button"
              onClick={() => onPauseSession(turns)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors"
              title="Pause and resume later"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onFinishSession(turns)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
          >
            <StopCircle className="w-3.5 h-3.5" />
            End Early
          </button>
        </div>
      </div>

      {/* Conversation Thread Message Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Previous Answered Turns */}
        {turns.map((turn, idx) => (
          <div key={turn.id} className="space-y-4">
            {/* Interviewer Question Box */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-100/80 rounded-2xl p-4 max-w-[85%] text-gray-900 text-sm leading-relaxed border border-gray-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-2xs font-extrabold uppercase tracking-wider text-indigo-600">
                    AI Interviewer
                  </span>
                  {turn.targetSkill && (
                    <span className="text-2xs px-2 py-0.5 bg-white rounded-md text-gray-500 border border-gray-200">
                      {turn.targetSkill}
                    </span>
                  )}
                </div>
                <p className="font-medium">{turn.questionText}</p>
              </div>
            </div>

            {/* Candidate Answer Box */}
            <div className="flex items-start gap-3 justify-end">
              <div
                className={`rounded-2xl p-4 max-w-[85%] text-sm leading-relaxed ${
                  turn.isSkipped
                    ? "bg-amber-50 border border-amber-200 text-amber-800 italic"
                    : "bg-indigo-600 text-white shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className={`text-2xs font-bold uppercase ${turn.isSkipped ? "text-amber-700" : "text-indigo-200"}`}>
                    Your Response
                  </span>
                </div>
                <p className="whitespace-pre-wrap font-sans">{turn.userAnswer}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* Instant Feedback Card (Practice Mode) */}
            {turn.evaluation && config.feedbackTiming === "instant" && (
              <div className="ml-11 max-w-[85%] bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Answer Score: {turn.evaluation.answerScore}/100
                  </div>
                  <span className="text-2xs text-indigo-600 font-semibold">
                    {turn.evaluation.isAIEvaluated ? "Gemini Rubric" : "Key-Point Blend"}
                  </span>
                </div>

                {/* 3 Dimension Chips */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded-xl border border-indigo-100 text-center">
                    <span className="text-2xs text-gray-500 block">Accuracy (40%)</span>
                    <span className="text-xs font-black text-indigo-700">
                      {turn.evaluation.accuracyScore}/10
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-indigo-100 text-center">
                    <span className="text-2xs text-gray-500 block">Confidence (25%)</span>
                    <span className="text-xs font-black text-purple-700">
                      {turn.evaluation.confidenceScore}/10
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-indigo-100 text-center">
                    <span className="text-2xs text-gray-500 block">Context (35%)</span>
                    <span className="text-xs font-black text-emerald-700">
                      {turn.evaluation.contextScore}/10
                    </span>
                  </div>
                </div>

                {/* Bullets */}
                {turn.evaluation.whatWentWell.length > 0 && (
                  <div className="text-xs text-indigo-950 space-y-1">
                    <span className="font-bold text-emerald-700 block">What went well:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-gray-700 text-2xs">
                      {turn.evaluation.whatWentWell.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {turn.evaluation.whatToImprove.length > 0 && (
                  <div className="text-xs text-indigo-950 space-y-1">
                    <span className="font-bold text-amber-700 block">What to improve:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-gray-700 text-2xs">
                      {turn.evaluation.whatToImprove.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Collapsible Stronger Outline */}
                {turn.evaluation.improvedAnswerOutline && (
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowOutlineForTurnId((prev) => (prev === turn.id ? null : turn.id))
                      }
                      className="text-2xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1"
                    >
                      {showOutlineForTurnId === turn.id ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Hide Stronger Answer Outline
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> Show Stronger Answer Outline
                        </>
                      )}
                    </button>
                    {showOutlineForTurnId === turn.id && (
                      <div className="mt-2 p-3 bg-white rounded-xl border border-indigo-100 text-2xs text-gray-700 space-y-1">
                        {turn.evaluation.improvedAnswerOutline.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="font-bold text-indigo-600">{idx + 1}.</span>
                            <span>{step}</span>
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

        {/* Current Active Question */}
        {!hasUnreadFeedback && !openCompareData && currentQuestion && (
          <div className="flex items-start gap-3 animate-in fade-in">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-indigo-50/80 rounded-2xl p-4 sm:p-5 max-w-[85%] text-gray-900 border border-indigo-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                  AI Interviewer
                </span>
                <span className="text-2xs text-gray-500 font-medium">
                  {currentQuestion.skills[0] || "Core Competency"}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed">
                {currentQuestion.questionText}
              </p>
              {currentQuestion.contextOrScenario && (
                <p className="text-xs text-indigo-900/80 mt-2 italic bg-white/70 p-2 rounded-lg border border-indigo-100">
                  {currentQuestion.contextOrScenario}
                </p>
              )}
            </div>
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

        {/* Continue Button for Instant Feedback Read Time */}
        {hasUnreadFeedback && (
          <div className="p-4 bg-white rounded-2xl border border-indigo-200 shadow-sm flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              Take a moment to review your feedback. When ready, proceed to the next question.
            </span>
            <button
              type="button"
              onClick={() => advanceToNextQuestion(turns)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <span>{isLastQuestion ? "View Final Scorecard" : "Next Question"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
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

      {/* Bottom Sticky Interactive Answer Box */}
      {!hasUnreadFeedback && !openCompareData && currentQuestion && (
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 shrink-0">
          {/* Multiple Choice / Situational Selection Options */}
          {(currentQuestion.type === "multiple_choice_single" ||
            currentQuestion.type === "situational_judgement") && (
            <div className="space-y-2 mb-3">
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

          {/* Open Answer / Short Answer Textarea */}
          {currentQuestion.type !== "multiple_choice_single" &&
            currentQuestion.type !== "situational_judgement" && (
              <div className="relative mb-2">
                <textarea
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  placeholder="Type your response here..."
                  rows={3}
                  maxLength={3000}
                  className="w-full p-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-gray-900 bg-white shadow-2xs resize-none"
                />
              </div>
            )}

          {/* Action Row: Skip, Character Count & Submit */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSkipQuestion}
              className="text-xs font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-200/60 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip Question
            </button>

            <div className="flex items-center gap-3">
              <span className="text-2xs text-gray-400">
                {userText.length > 0 ? `${userText.length}/3000 chars` : ""}
              </span>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isEvaluating}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Submit Answer</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
