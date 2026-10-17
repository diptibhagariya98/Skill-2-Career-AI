"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { ArrowLeft, BookOpen, Map, BookCopy, Edit, FileText, Play, HelpCircle } from "lucide-react";

export default function LearnPractice() {
  const [subPage, setSubPage] = useState("hub"); // 'hub', 'roadmaps', 'resources-category', 'resources-detail', 'quizzes', 'notes'
  const [quizOpen, setQuizOpen] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState(false);

  const quizData = [
    {
      question: "What is the primary purpose of HTML?",
      options: ["To style web pages", "To structure web content", "To handle user interactions"],
      answer: "To structure web content",
    },
    {
      question: "Which CSS property is used to control spacing outside an element's border?",
      options: ["padding", "margin", "outline"],
      answer: "margin",
    },
    {
      question: "What does `===` do in JavaScript?",
      options: ["Assigns a value", "Checks for equality without type conversion", "Checks for equality with type conversion"],
      answer: "Checks for equality without type conversion",
    },
  ];

  const handleStartQuiz = () => {
    setCurrentQuestionIdx(0);
    setQuizScore(0);
    setSelectedOption("");
    setQuizFeedback("");
    setSubmittedAnswer(false);
    setQuizOpen(true);
  };

  const handleSubmitQuizAnswer = () => {
    if (!selectedOption) {
      toast.error("Please select an option!");
      return;
    }
    const q = quizData[currentQuestionIdx];
    const isCorrect = selectedOption === q.answer;
    setSubmittedAnswer(true);

    if (isCorrect) {
      setQuizScore(quizScore + 1);
      setQuizFeedback("Correct!");
    } else {
      setQuizFeedback(`Incorrect. The correct answer is: ${q.answer}`);
    }

    setTimeout(() => {
      setSelectedOption("");
      setQuizFeedback("");
      setSubmittedAnswer(false);
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {subPage === "hub" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div
            onClick={() => setSubPage("roadmaps")}
            className="p-4 sm:p-5 bg-white rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 border border-gray-100 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Map className="h-6 w-6 text-indigo-500 mb-2" />
            <h3 className="font-bold text-base text-gray-900">Career Roadmaps</h3>
            <p className="text-xs text-gray-500 mt-0.5">High-level paths & milestones.</p>
          </div>

          <div
            onClick={() => setSubPage("resources-category")}
            className="p-4 sm:p-5 bg-white rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 border border-gray-100 transition-all cursor-pointer active:scale-[0.98]"
          >
            <BookCopy className="h-6 w-6 text-indigo-500 mb-2" />
            <h3 className="font-bold text-base text-gray-900">Learning Resources</h3>
            <p className="text-xs text-gray-500 mt-0.5">Topic-wise videos, articles, and courses.</p>
          </div>

          <div
            onClick={() => setSubPage("quizzes")}
            className="p-4 sm:p-5 bg-white rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 border border-gray-100 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Edit className="h-6 w-6 text-indigo-500 mb-2" />
            <h3 className="font-bold text-base text-gray-900">Practice Quizzes</h3>
            <p className="text-xs text-gray-500 mt-0.5">Test knowledge with rapid topic quizzes.</p>
          </div>

          <div
            onClick={() => setSubPage("notes")}
            className="p-4 sm:p-5 bg-white rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 border border-gray-100 transition-all cursor-pointer active:scale-[0.98]"
          >
            <FileText className="h-6 w-6 text-indigo-500 mb-2" />
            <h3 className="font-bold text-base text-gray-900">Downloadable Notes</h3>
            <p className="text-xs text-gray-500 mt-0.5">Quick-reference cheat sheets & study notes.</p>
          </div>
        </div>
      )}

      {subPage === "roadmaps" && (
        <div className="animate-fade-in">
          <button
            onClick={() => setSubPage("hub")}
            className="mb-6 text-sm font-semibold text-gray-600 hover:text-indigo-600 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Hub
          </button>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">All Roadmaps</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg hover:border-indigo-500 transition">
                <h3 className="font-semibold text-gray-900">Full Stack Developer</h3>
                <div className="flex flex-wrap items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-gray-200 text-gray-800 py-1 px-2 rounded-full font-medium">React</span>
                    <span className="text-xs bg-gray-200 text-gray-800 py-1 px-2 rounded-full font-medium">Node.js</span>
                    <span className="text-xs bg-gray-200 text-gray-800 py-1 px-2 rounded-full font-medium">SQL</span>
                  </div>
                  <a
                    href="/ROADMAPS/full-stack.pdf"
                    download
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Download
                  </a>
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:border-indigo-500 transition">
                <h3 className="font-semibold text-gray-900">AI / ML Engineer</h3>
                <div className="flex flex-wrap items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-gray-200 text-gray-800 py-1 px-2 rounded-full font-medium">Python</span>
                    <span className="text-xs bg-gray-200 text-gray-800 py-1 px-2 rounded-full font-medium">TensorFlow</span>
                  </div>
                  <a
                    href="/ROADMAPS/ai-engineer.pdf"
                    download
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {subPage === "resources-category" && (
        <div className="animate-fade-in">
          <button
            onClick={() => setSubPage("hub")}
            className="mb-6 text-sm font-semibold text-gray-600 hover:text-indigo-600 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Hub
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Select a Resource Category</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setSubPage("resources-detail")}
              className="p-6 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-700 hover:shadow-lg transition bg-white"
            >
              <Play className="h-8 w-8 text-indigo-700 mb-3" />
              <h3 className="font-bold text-lg text-gray-800">Frontend Development</h3>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed bg-white">
              <Play className="h-8 w-8 text-gray-400 mb-3" />
              <h3 className="font-bold text-lg text-gray-400">Backend Development</h3>
            </div>
          </div>
        </div>
      )}

      {subPage === "resources-detail" && (
        <div className="animate-fade-in">
          <button
            onClick={() => setSubPage("resources-category")}
            className="mb-6 text-sm font-semibold text-gray-600 hover:text-indigo-600 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Frontend Development Detailed Roadmap</h1>
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-xl shadow-md border hover:border-indigo-500 transition">
              <h2 className="font-bold text-xl text-gray-800">Module 1: HTML - The Structure</h2>
              <p className="text-gray-600 mt-2 text-sm">Learn to build the skeleton of any website using HyperText Markup Language.</p>
              <div className="mt-4">
                <a
                  href="https://www.youtube.com/watch?v=kUMe1FH4CHE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-700 font-semibold hover:underline text-sm"
                >
                  <Play className="h-4 w-4 text-red-600 fill-red-600" /> Watch: HTML Full Course (freeCodeCamp)
                </a>
              </div>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md border hover:border-indigo-500 transition">
              <h2 className="font-bold text-xl text-gray-800">Module 2: CSS - The Style</h2>
              <p className="text-gray-600 mt-2 text-sm">Style your websites with CSS. Learn about Flexbox, Grid, and Responsive Design.</p>
              <div className="mt-4">
                <a
                  href="https://www.youtube.com/watch?v=OXGznpKZ_sA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-700 font-semibold hover:underline text-sm"
                >
                  <Play className="h-4 w-4 text-red-600 fill-red-600" /> Watch: CSS Full Course (SuperSimpleDev)
                </a>
              </div>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md border hover:border-indigo-500 transition">
              <h2 className="font-bold text-xl text-gray-800">Module 3: JavaScript - The Brains</h2>
              <p className="text-gray-600 mt-2 text-sm">Add interactivity and logic. Learn DOM Manipulation and how to handle user events.</p>
              <div className="mt-4">
                <a
                  href="https://www.youtube.com/watch?v=PkZNo7MFNFg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-700 font-semibold hover:underline text-sm"
                >
                  <Play className="h-4 w-4 text-red-600 fill-red-600" /> Watch: JavaScript Full Course (SuperSimpleDev)
                </a>
              </div>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md border hover:border-indigo-500 transition">
              <h2 className="font-bold text-xl text-gray-800">Module 4: React - The UI Library</h2>
              <p className="text-gray-600 mt-2 text-sm">Master the most popular library for building modern, scalable user interfaces.</p>
              <div className="mt-4">
                <a
                  href="https://www.youtube.com/watch?v=SqcY0GlETPk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-700 font-semibold hover:underline text-sm"
                >
                  <Play className="h-4 w-4 text-red-600 fill-red-600" /> Watch: React Full Course (SuperSimpleDev)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {subPage === "quizzes" && (
        <div className="animate-fade-in">
          <button
            onClick={() => setSubPage("hub")}
            className="mb-6 text-sm font-semibold text-gray-600 hover:text-indigo-600 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Hub
          </button>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Practice Quizzes</h2>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-gray-400 font-bold">
                  <th className="py-3 px-2">Topic</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-2 font-semibold text-gray-800 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-indigo-500" /> HTML & CSS Basics
                  </td>
                  <td className="py-4 px-2 text-right">
                    <button
                      onClick={handleStartQuiz}
                      className="font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Start Quiz
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subPage === "notes" && (
        <div className="animate-fade-in">
          <button
            onClick={() => setSubPage("hub")}
            className="mb-6 text-sm font-semibold text-gray-600 hover:text-indigo-600 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Hub
          </button>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Downloadable Notes</h2>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-gray-400 font-bold">
                  <th className="py-3 px-2">Notes Category</th>
                  <th className="py-3 px-2 text-right">Download</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-2 font-semibold text-gray-800">HTML & CSS NOTES</td>
                  <td className="py-4 px-2 text-right">
                    <a
                      href="/ROADMAPS/Class Notes-DEV.pdf"
                      download
                      className="font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Download
                    </a>
                  </td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-2 font-semibold text-gray-800">ML NOTES</td>
                  <td className="py-4 px-2 text-right">
                    <a
                      href="/ROADMAPS/Unit1_Machine_Learning_Introduction_CU_3.0_.pdf"
                      download
                      className="font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {quizOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white p-4 sm:p-7 rounded-2xl shadow-2xl w-full max-w-xl mx-auto animate-fade-in text-gray-800 relative max-h-[90dvh] overflow-y-auto">
            <button
              onClick={() => setQuizOpen(false)}
              aria-label="Close quiz"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center text-lg font-bold"
            >
              ✕
            </button>

            {currentQuestionIdx < quizData.length ? (
              <div>
                <h2 className="text-xl font-bold mb-2">
                  Question {currentQuestionIdx + 1}/{quizData.length}
                </h2>
                <p className="text-lg mb-6 font-semibold">{quizData[currentQuestionIdx].question}</p>
                <div className="space-y-3">
                  {quizData[currentQuestionIdx].options.map((opt, i) => (
                    <label
                      key={i}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                        selectedOption === opt ? "border-indigo-600 bg-indigo-50" : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="option"
                        value={opt}
                        checked={selectedOption === opt}
                        disabled={submittedAnswer}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="mr-3 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="text-gray-800 font-medium">{opt}</span>
                    </label>
                  ))}
                </div>

                {!submittedAnswer ? (
                  <button
                    onClick={handleSubmitQuizAnswer}
                    className="mt-6 w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className="mt-6 p-4 rounded-lg bg-indigo-50 text-center font-semibold text-lg text-indigo-800">
                    {quizFeedback}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <h2 className="text-2xl font-bold mb-4 text-indigo-700">Quiz Complete!</h2>
                <p className="text-lg font-medium text-gray-600">
                  Your final score is:{" "}
                  <span className="text-2xl font-extrabold text-indigo-600">
                    {quizScore} / {quizData.length}
                  </span>
                </p>
                <button
                  onClick={() => setQuizOpen(false)}
                  className="mt-6 bg-indigo-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-indigo-700 transition"
                >
                  Close Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
