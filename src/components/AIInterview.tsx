"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { ArrowLeft, BookOpen, Send, UserCheck, MessageSquare, Award } from "lucide-react";
import { API_ROUTES } from "../constants/endpoints";

export default function AIInterview({ onGoToDashboard }) {
  const [role, setRole] = useState("");
  const [topic, setTopic] = useState("");
  const [stage, setStage] = useState("setup"); // 'setup', 'generating', 'interviewing', 'evaluating', 'report'
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const [scores, setScores] = useState({ aptitude: 0, coding: 0, hr: 0, basic: 0, total: 0 });
  const [questionDistribution] = useState({ aptitude: 3, coding: 3, hr: 3, basic: 1 });
  const [answersLog, setAnswersLog] = useState([]);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [finalReport, setFinalReport] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Calls the server-side Next.js route handler to proxy Gemini
  const callGeminiProxy = async (promptText, conversationHistory = []) => {
    const contents = conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    contents.push({ role: "user", parts: [{ text: promptText }] });

    const response = await fetch(API_ROUTES.GEMINI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || response.statusText);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  const handleStartInterview = async () => {
    if (!role || !topic.trim()) {
      toast.error("Please select a role and specify a topic.");
      return;
    }

    setStage("generating");
    setQuestions([]);
    setCurrentIdx(0);
    setScores({ aptitude: 0, coding: 0, hr: 0, basic: 0, total: 0 });
    setAnswersLog([]);
    setHistory([]);
    setLastFeedback(null);

    const planPrompt = `
**STRICT OUTPUT REQUIRED.** You are an Interview Plan Generator. 
**PRIMARY ROLE:** ${role}. 
**NON-NEGOTIABLE TOPIC FOCUS:** ${topic}.

Generate 10 questions that **MUST** integrate the '${topic}' topic where relevant. 
The distribution MUST be: ${questionDistribution.aptitude} Aptitude, ${questionDistribution.coding} Coding, ${questionDistribution.hr} HR, and ${questionDistribution.basic} Basic IT/General knowledge.

**DO NOT INCLUDE ANY INTRODUCTORY, CONVERSATIONAL, OR MARKDOWN TEXT WHATSOEVER.** Output ONLY the structured list.

Structure MUST be: 
[Type]@[Question Text (MUST relate to ${topic})]@[Correct Answer/Concept Summary]
(Separate each question with ###)
Example: basic@Explain what a 'model' is in the context of AI.@A model is a program trained on data...
`;

    try {
      const rawPlan = await callGeminiProxy(planPrompt);
      let cleanedPlan = rawPlan.replace(/\n\s*|\r\s*/g, "###").replace(/\s*###\s*/g, "###");

      const firstDelimiterIndex = cleanedPlan.indexOf("###");
      if (firstDelimiterIndex > 0 && cleanedPlan.indexOf("@") > firstDelimiterIndex) {
        cleanedPlan = cleanedPlan.substring(cleanedPlan.indexOf("@") - 5);
      }

      const questionBlocks = cleanedPlan.split("###").filter((block) => block.trim() !== "");
      const parsedQuestions = questionBlocks
        .map((block) => {
          const parts = block.trim().split("@");
          if (parts.length >= 3) {
            return {
              type: parts[0].trim().toLowerCase(),
              question: parts[1].trim(),
              summary: parts[2].trim(),
            };
          }
          return null;
        })
        .filter((q) => q !== null);

      if (parsedQuestions.length === 0) {
        throw new Error("AI failed to generate valid formatted questions. Please try again.");
      }

      setQuestions(parsedQuestions);
      setHistory([{ role: "model", text: "Plan generated. Let's begin the interview." }]);
      setStage("interviewing");
    } catch (error) {
      toast.error(error.message || "Failed to start interview.");
      setStage("setup");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || userAnswer.trim().length < 5) {
      toast.error("Please provide a more detailed answer (at least 5 characters).");
      return;
    }

    setLoadingFeedback(true);
    const q = questions[currentIdx];
    const userPrompt = `EVALUATE: Role: ${role}. Type: ${q.type}. Question: "${q.question}". Ideal Concept: "${q.summary}". User's detailed answer: "${userAnswer}". Provide a score of 1 (Good/Complete) or 0 (Needs Improvement). Output ONLY: [SCORE]###[Detailed Feedback Text] (e.g., 1###Your explanation was clear. Your strong grasp of the architecture is evident.)`;

    try {
      // Append current user answer to history
      const updatedHistory = [...history, { role: "user", text: `Question: ${q.question}. My answer: ${userAnswer}` }];
      const rawFeedback = await callGeminiProxy(userPrompt, updatedHistory);
      const parts = rawFeedback.split("###").map((p) => p.trim());

      let scoreValue = 0;
      let feedbackText = "No feedback generated.";

      if (parts.length >= 2) {
        scoreValue = parseInt(parts[0]) || 0;
        feedbackText = parts[1];
      } else {
        feedbackText = rawFeedback;
      }

      // Record logs
      const updatedScores = {
        ...scores,
        total: scores.total + scoreValue,
        [q.type]: scores[q.type] + scoreValue,
      };
      setScores(updatedScores);

      const logEntry = {
        q_num: currentIdx + 1,
        q_type: q.type,
        q_text: q.question,
        user_answer: userAnswer,
        score: scoreValue,
        feedback: feedbackText,
        ideal: q.summary,
      };

      const newLogs = [...answersLog, logEntry];
      setAnswersLog(newLogs);

      setLastFeedback({
        score: scoreValue,
        text: feedbackText,
        ideal: q.summary,
        userAnswer,
      });

      // Update history for Gemini memory
      setHistory([
        ...updatedHistory,
        { role: "model", text: `Score: ${scoreValue}. Evaluation: ${feedbackText}` },
      ]);

      setStage("evaluating");
    } catch (error) {
      toast.error(error.message || "Failed to evaluate answer.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer("");
    setLastFeedback(null);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setStage("interviewing");
    } else {
      handleGenerateReport();
    }
  };

  const handleGenerateReport = async () => {
    setStage("generating");
    const scoreSummary = `Total Score: ${scores.total}/${questions.length}. Aptitude: ${scores.aptitude}, Coding: ${scores.coding}, HR: ${scores.hr}, Basic: ${scores.basic}.`;
    const transcriptSummary = JSON.stringify(answersLog, null, 2);

    const finalPrompt = `FINAL REPORT: You are an HR specialist. Based on this ${role} interview for topic ${topic}: ${scoreSummary}. Transcript details: ${transcriptSummary}. Generate a final, comprehensive report. The report MUST be formatted using markdown headings (##), bold text for key scores, and lists. Include: 1. **Overall Strengths/Weaknesses**. 2. **Performance Breakdown per area**. 3. **Final Recommendation** (Highlight the recommendation clearly: Hire/Second Interview/Not a Fit). Max 500 words.`;

    try {
      const reportText = await callGeminiProxy(finalPrompt, history);
      setFinalReport(reportText);

      // Extract recommendation for styling
      let recText = "Second Interview";
      const recMatch = reportText.match(/recommendation:?\s*(.*?)(?=\n|##|$)/i);
      if (recMatch && recMatch[1]) {
        recText = recMatch[1].trim().replace(/\*|#/g, "");
      }
      setRecommendation(recText);
      setStage("report");
    } catch (error) {
      toast.error("Failed to generate final interview report.");
      setStage("report"); // Fallback
    }
  };

  const handleReset = () => {
    setRole("");
    setTopic("");
    setStage("setup");
    setQuestions([]);
    setCurrentIdx(0);
    setUserAnswer("");
    setScores({ aptitude: 0, coding: 0, hr: 0, basic: 0, total: 0 });
    setAnswersLog([]);
    setLastFeedback(null);
    setFinalReport("");
  };

  // Badge color for recommendation
  let recBadgeColor = "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (recommendation.toLowerCase().includes("hire")) {
    recBadgeColor = "bg-green-100 text-green-800 border-green-300";
  } else if (recommendation.toLowerCase().includes("not a fit")) {
    recBadgeColor = "bg-red-100 text-red-800 border-red-300";
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-md border border-gray-100 animate-fade-in">
      {stage === "setup" && (
        <div className="text-center flex flex-col justify-center items-center">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            AI Interview <span className="text-indigo-600">Warmup Simulator</span>
          </h2>
          <p className="text-lg text-gray-600 mt-4 mb-8 max-w-lg">
            Prepare for your job interviews by practicing with AI. Get instant, tailored feedback on your answers.
          </p>

          <div className="w-full max-w-md bg-gray-50 p-6 rounded-xl border border-gray-200 text-left mb-8 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-2">Interview Configuration</h3>
            <div>
              <label htmlFor="role-select" className="block text-sm font-medium text-gray-700">
                Select Target Role
              </label>
              <select
                id="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 border"
              >
                <option value="">-- Choose Role --</option>
                <option value="frontend">Frontend Developer</option>
                <option value="backend">Backend Developer</option>
                <option value="fullstack">Fullstack Developer</option>
                <option value="ui-ux">UI/UX Designer</option>
                <option value="ai-ml">AI/ML Engineer</option>
              </select>
            </div>
            <div>
              <label htmlFor="topic-input" className="block text-sm font-medium text-gray-700">
                Specify Key Topic (e.g., React, Node.js, Python)
              </label>
              <input
                type="text"
                id="topic-input"
                placeholder="e.g., React"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 border"
              />
            </div>
          </div>

          <button
            onClick={handleStartInterview}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl text-xl transition duration-300 shadow-md hover:shadow-lg"
          >
            Start Interview
          </button>
        </div>
      )}

      {stage === "generating" && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <h3 className="text-xl font-bold text-gray-800">AI is working...</h3>
          <p className="text-gray-500 mt-2">Generating personalized interview questions and configuring templates.</p>
        </div>
      )}

      {stage === "interviewing" && (
        <div className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
            <BookOpen className="h-6 w-6 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-indigo-900">
                Question {currentIdx + 1} of {questions.length}
              </h4>
              <p className="text-xs text-indigo-600 uppercase font-bold tracking-wide mt-0.5">
                Type: {questions[currentIdx]?.type}
              </p>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xl font-bold text-gray-900 leading-snug">{questions[currentIdx]?.question}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="answer-input" className="block text-sm font-medium text-gray-700">
              Your Answer
            </label>
            <textarea
              id="answer-input"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your response here..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 min-h-[140px]"
            ></textarea>
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <button
              onClick={handleReset}
              className="bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition"
            >
              Quit Interview
            </button>
            <button
              onClick={handleSubmitAnswer}
              disabled={loadingFeedback}
              className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {loadingFeedback ? "Evaluating..." : "Submit Answer"}
            </button>
          </div>
        </div>
      )}

      {stage === "evaluating" && lastFeedback && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">Evaluation Result</h3>
          
          <div
            className={`p-5 rounded-xl border flex items-start gap-3 ${
              lastFeedback.score === 1
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <UserCheck className="h-6 w-6 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-lg">
                {lastFeedback.score === 1 ? "✅ Correct Approach" : "❌ Needs Improvement"}
              </p>
              <p className="text-sm font-medium opacity-90 mt-1">Score: {lastFeedback.score} / 1</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Question</h4>
              <p className="text-base text-gray-900 mt-1 font-semibold">{questions[currentIdx]?.question}</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Your Answer</h4>
              <p className="text-gray-800 p-4 bg-gray-50 rounded-lg border text-sm mt-1 whitespace-pre-wrap">
                {lastFeedback.userAnswer}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wide">AI Detailed Feedback</h4>
              <p className="text-gray-700 leading-relaxed mt-1 text-sm">{lastFeedback.text}</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wide">Key Ideal Concept</h4>
              <p className="text-gray-600 italic mt-1 text-sm">{lastFeedback.ideal}</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleNextQuestion}
              className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition"
            >
              {currentIdx + 1 < questions.length ? "Next Question" : "View Final Report"}
            </button>
          </div>
        </div>
      )}

      {stage === "report" && (
        <div className="space-y-8 animate-fade-in">
          <div className="text-center border-b pb-6">
            <Award className="h-16 w-16 text-indigo-600 mx-auto mb-2" />
            <h2 className="text-3xl font-extrabold text-gray-900">Interview Completion Report</h2>
            <p className="text-gray-500 mt-1">
              Role: <span className="font-semibold text-gray-700">{role.toUpperCase()}</span> | Topic:{" "}
              <span className="font-semibold text-gray-700">{topic}</span>
            </p>
          </div>

          {/* Score breakdown metrics cards */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-1.5">
              <MessageSquare className="h-5 w-5 text-indigo-500" /> Score Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-indigo-50 p-4 rounded-xl text-center border border-indigo-100 shadow-sm">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Score</p>
                <p className="text-3xl font-black text-indigo-800 mt-1">
                  {scores.total}/{questions.length}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center border">
                <p className="text-xs font-semibold text-gray-500">Aptitude</p>
                <p className="text-xl font-bold text-gray-700 mt-0.5">
                  {scores.aptitude}/{questionDistribution.aptitude}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center border">
                <p className="text-xs font-semibold text-gray-500">Coding</p>
                <p className="text-xl font-bold text-gray-700 mt-0.5">
                  {scores.coding}/{questionDistribution.coding}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center border">
                <p className="text-xs font-semibold text-gray-500">HR/Behavioral</p>
                <p className="text-xl font-bold text-gray-700 mt-0.5">
                  {scores.hr}/{questionDistribution.hr}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center border">
                <p className="text-xs font-semibold text-gray-500">Basic/IT</p>
                <p className="text-xl font-bold text-gray-700 mt-0.5">
                  {scores.basic}/{questionDistribution.basic}
                </p>
              </div>
            </div>
          </div>

          {/* Action badge */}
          <div className={`p-4 rounded-xl border text-center font-bold text-lg shadow-sm ${recBadgeColor}`}>
            Recommended Action: {recommendation || "Hire"}
          </div>

          {/* Detailed report text */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">AI HR Specialist Evaluation</h3>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {finalReport}
            </div>
          </div>

          {/* Log Details toggle */}
          <details className="text-sm text-gray-600 bg-white p-4 rounded-xl border cursor-pointer shadow-sm">
            <summary className="font-bold hover:text-indigo-600">View Question-by-Question Transcript</summary>
            <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto">
              {answersLog.map((log, index) => (
                <div key={index} className="p-3 border rounded bg-gray-50 text-xs space-y-1">
                  <p className="font-bold text-gray-800">
                    Q{log.q_num} ({log.q_type.toUpperCase()}): {log.q_text}
                  </p>
                  <p className="text-indigo-700">
                    <strong>Your Answer:</strong> {log.user_answer}
                  </p>
                  <p className={log.score === 1 ? "text-green-700" : "text-red-700"}>
                    <strong>Score:</strong> {log.score}/1 | <strong>Feedback:</strong> {log.feedback}
                  </p>
                </div>
              ))}
            </div>
          </details>

          {/* Reset buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onGoToDashboard}
              className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
            >
              Start New Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
