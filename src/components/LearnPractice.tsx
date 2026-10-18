"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  BookOpen,
  Map,
  BookCopy,
  Edit,
  FileText,
  Play,
  HelpCircle,
  Download,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  Code2,
  Cpu,
  Server,
  Layout,
} from "lucide-react";

interface LearnPracticeProps {
  subPage?: string;
  onChangeSubPage?: (page: string) => void;
}

export default function LearnPractice({
  subPage: controlledSubPage,
  onChangeSubPage,
}: LearnPracticeProps = {}) {
  const [internalSubPage, setInternalSubPage] = useState("hub");
  const subPage = controlledSubPage !== undefined ? controlledSubPage : internalSubPage;

  const setSubPage = (page: string) => {
    if (onChangeSubPage) {
      onChangeSubPage(page);
    } else {
      setInternalSubPage(page);
    }
  };

  // Quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState(false);

  const quizData = [
    {
      question: "What is the primary purpose of HTML in modern web development?",
      options: [
        "To style and animate web layouts",
        "To provide semantic structure and content hierarchy",
        "To execute server-side database queries",
      ],
      answer: "To provide semantic structure and content hierarchy",
      explanation: "HTML defines the structural skeleton and semantic meaning of documents on the web.",
    },
    {
      question: "Which CSS property controls spacing outside an element's border?",
      options: ["padding", "margin", "outline"],
      answer: "margin",
      explanation: "Margin creates space around elements outside their borders, whereas padding is inside.",
    },
    {
      question: "What does the strict equality operator (`===`) evaluate in JavaScript?",
      options: [
        "Checks value equality after automatic type coercion",
        "Checks value and type equality without type conversion",
        "Assigns a persistent value to an object reference",
      ],
      answer: "Checks value and type equality without type conversion",
      explanation: "`===` ensures both the data type and the underlying value match strictly.",
    },
    {
      question: "What is the primary benefit of React Virtual DOM?",
      options: [
        "Directly rewrites the browser render tree on every keystroke",
        "Calculates minimal DOM diffs to batch efficient UI updates",
        "Replaces HTTP client libraries with native web sockets",
      ],
      answer: "Calculates minimal DOM diffs to batch efficient UI updates",
      explanation: "The Virtual DOM computes UI diffs in-memory, minimizing costly native browser DOM repaints.",
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
      setQuizFeedback("Correct! " + q.explanation);
    } else {
      setQuizFeedback(`Incorrect. The correct answer is: "${q.answer}". ${q.explanation}`);
    }

    setTimeout(() => {
      setSelectedOption("");
      setQuizFeedback("");
      setSubmittedAnswer(false);
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }, 2200);
  };

  // Career Roadmaps Curated Catalog
  const roadmaps = [
    {
      id: "full-stack",
      title: "Full Stack Web Developer",
      badge: "Most Popular",
      badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
      icon: Code2,
      duration: "6–9 Months",
      level: "Beginner → Advanced",
      description: "From web foundations to database architecture, REST APIs, authentication, and cloud deployment.",
      skills: ["React", "Next.js", "Node.js", "TypeScript", "SQL", "Cloud"],
      pdfUrl: "/ROADMAPS/full-stack.pdf",
      fileName: "full-stack-roadmap.pdf",
    },
    {
      id: "ai-engineer",
      title: "AI & Machine Learning Engineer",
      badge: "High Growth",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
      icon: Cpu,
      duration: "6–8 Months",
      level: "Intermediate → Specialist",
      description: "Mathematical foundations, PyTorch, neural networks, computer vision, LLM prompt engineering, and MLOps.",
      skills: ["Python", "TensorFlow", "PyTorch", "Transformers", "MLOps"],
      pdfUrl: "/ROADMAPS/ai-engineer.pdf",
      fileName: "ai-engineer-roadmap.pdf",
    },
    {
      id: "frontend",
      title: "Frontend UI/UX Specialist",
      badge: "Core Track",
      badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: Layout,
      duration: "3–5 Months",
      level: "Beginner → Mid-Level",
      description: "Modern component architecture, reactive state management, TailwindCSS styling, and high-performance apps.",
      skills: ["HTML5/CSS3", "JavaScript ES6+", "React 18", "TailwindCSS"],
      pdfUrl: "/ROADMAPS/frontend.pdf",
      fileName: "frontend-developer-roadmap.pdf",
    },
    {
      id: "backend",
      title: "Backend & Systems Architect",
      badge: "Enterprise",
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
      icon: Server,
      duration: "4–6 Months",
      level: "Intermediate → Advanced",
      description: "High-throughput servers, microservices design, database optimization, caching layers, and API security.",
      skills: ["Node.js", "Express", "System Design", "PostgreSQL", "Docker"],
      pdfUrl: "/ROADMAPS/backend.pdf",
      fileName: "backend-architect-roadmap.pdf",
    },
  ];

  // Curated Downloadable Notes Catalog
  const notesList = [
    {
      id: "class-notes-dev",
      title: "Full Stack Web Development Master Notes",
      category: "Full Stack & Web Architecture",
      icon: Code2,
      pages: "Comprehensive 85+ Pages",
      size: "1.6 MB PDF",
      topics: ["HTML5 Semantics", "CSS Flexbox & Grid", "DOM Scripting", "Backend APIs"],
      pdfUrl: "/ROADMAPS/Class Notes-DEV.pdf",
      fileName: "Class Notes-DEV.pdf",
    },
    {
      id: "ml-unit1",
      title: "Machine Learning & Neural Networks Foundations",
      category: "Artificial Intelligence",
      icon: Cpu,
      pages: "Academic Unit Notes",
      size: "4.4 MB PDF",
      topics: ["Supervised Models", "Linear & Logistic Regression", "Loss Optimization", "Gradient Descent"],
      pdfUrl: "/ROADMAPS/Unit1_Machine_Learning_Introduction_CU_3.0_.pdf",
      fileName: "Machine-Learning-Introduction.pdf",
    },
    {
      id: "frontend-beginner",
      title: "Frontend Developer Quick Syntax Reference",
      category: "Frontend Essentials",
      icon: Layout,
      pages: "Quick Cheat Sheet",
      size: "35 KB PDF",
      topics: ["HTML Tags", "CSS Box Model", "Selector Specificity", "Flexbox Cheat Sheet"],
      pdfUrl: "/ROADMAPS/frontend-beginner.pdf",
      fileName: "frontend-beginner-cheatsheet.pdf",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* =========================================================================
          VIEW 1: PRACTICE HUB LANDING
          ========================================================================= */}
      {subPage === "hub" && (
        <div className="space-y-6">
          {/* Hero Welcome Strip */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Practice & Career Roadmaps
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Skill Mastery & Study Hub
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-indigo-100 leading-relaxed">
                Explore guided career roadmaps, test your knowledge with instant quizzes, and download verified study guides.
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Hub Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div
              onClick={() => setSubPage("roadmaps")}
              className="p-4 sm:p-5 bg-white rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-400 border border-gray-150 transition-all cursor-pointer active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Map className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900">Career Roadmaps</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Step-by-step career tracks with milestones & PDF downloads.
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1 mt-3">
                Explore Tracks <span className="hidden md:inline">→</span>
              </span>
            </div>

            <div
              onClick={() => setSubPage("resources-category")}
              className="p-4 sm:p-5 bg-white rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-400 border border-gray-150 transition-all cursor-pointer active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <BookCopy className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900">Learning Resources</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Topic-wise video modules, documentation & interactive guides.
                </p>
              </div>
              <span className="text-xs font-semibold text-purple-600 inline-flex items-center gap-1 mt-3">
                View Modules <span className="hidden md:inline">→</span>
              </span>
            </div>

            <div
              onClick={() => setSubPage("quizzes")}
              className="p-4 sm:p-5 bg-white rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-400 border border-gray-150 transition-all cursor-pointer active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Edit className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900">Practice Quizzes</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Interactive multiple choice questions with instant explanations.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1 mt-3">
                Start Quiz <span className="hidden md:inline">→</span>
              </span>
            </div>

            <div
              onClick={() => setSubPage("notes")}
              className="p-4 sm:p-5 bg-white rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-400 border border-gray-150 transition-all cursor-pointer active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900">Downloadable Notes</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Verified study guides, lecture summaries & PDF cheat sheets.
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-600 inline-flex items-center gap-1 mt-3">
                Download Notes <span className="hidden md:inline">→</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: CAREER ROADMAPS
          ========================================================================= */}
      {subPage === "roadmaps" && (
        <div className="space-y-5 animate-fade-in">
          {/* Desktop Breadcrumb (Hidden on mobile where top app bar handles navigation) */}
          <div className="hidden md:flex items-center justify-between pb-3 border-b border-gray-200">
            <button
              onClick={() => setSubPage("hub")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Practice Hub</span>
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Career Roadmaps
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roadmaps.map((r) => {
              const IconComp = r.icon;
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-base text-gray-900">{r.title}</h3>
                      </div>
                      <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                        {r.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {r.duration}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-gray-400" />
                        {r.level}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      {r.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {r.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <a
                    href={r.pdfUrl}
                    download={r.fileName}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Roadmap</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: DOWNLOADABLE NOTES
          ========================================================================= */}
      {subPage === "notes" && (
        <div className="space-y-5 animate-fade-in">
          {/* Desktop Breadcrumb */}
          <div className="hidden md:flex items-center justify-between pb-3 border-b border-gray-200">
            <button
              onClick={() => setSubPage("hub")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Practice Hub</span>
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Downloadable Notes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notesList.map((n) => {
              const IconComp = n.icon;
              return (
                <div
                  key={n.id}
                  className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-1.5">
                      {n.category}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1">
                      {n.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <span>{n.pages}</span>
                      <span>•</span>
                      <span>{n.size}</span>
                    </div>

                    <div className="space-y-1 mb-4">
                      {n.topics.map((t, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <a
                    href={n.pdfUrl}
                    download={n.fileName}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Notes ({n.size})</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: PRACTICE QUIZZES
          ========================================================================= */}
      {subPage === "quizzes" && (
        <div className="space-y-5 animate-fade-in">
          {/* Desktop Breadcrumb */}
          <div className="hidden md:flex items-center justify-between pb-3 border-b border-gray-200">
            <button
              onClick={() => setSubPage("hub")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Practice Hub</span>
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Practice Quizzes
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Web Engineering Fundamentals</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Test your HTML, CSS, JavaScript, and React knowledge with instant explanations.
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                  <span>{quizData.length} Questions</span>
                  <span>•</span>
                  <span>~3 Minutes</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold">Instant Score</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-xs transition whitespace-nowrap"
            >
              Start Quiz
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: LEARNING RESOURCES CATEGORIES
          ========================================================================= */}
      {subPage === "resources-category" && (
        <div className="space-y-5 animate-fade-in">
          {/* Desktop Breadcrumb */}
          <div className="hidden md:flex items-center justify-between pb-3 border-b border-gray-200">
            <button
              onClick={() => setSubPage("hub")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Practice Hub</span>
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Learning Resources
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setSubPage("resources-detail")}
              className="p-5 rounded-2xl border border-gray-200 cursor-pointer hover:border-indigo-600 hover:shadow-md transition bg-white"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Play className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900">Frontend Development Course Modules</h3>
              <p className="text-xs text-gray-500 mt-1">
                Curated 4-module video masterclass covering HTML, CSS Flexbox, JavaScript DOM, and React.
              </p>
              <span className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1 mt-3">
                Open Course Modules <span className="hidden md:inline">→</span>
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-gray-200 opacity-60 bg-gray-50">
              <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-400 flex items-center justify-center mb-3">
                <Play className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-gray-600">Backend Systems & Cloud</h3>
              <p className="text-xs text-gray-400 mt-1">
                Node.js APIs, Docker deployment, and microservices architecture.
              </p>
              <span className="text-xs font-semibold text-gray-400 mt-3 block">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 6: LEARNING RESOURCES DETAIL
          ========================================================================= */}
      {subPage === "resources-detail" && (
        <div className="space-y-5 animate-fade-in">
          {/* Desktop Breadcrumb */}
          <div className="hidden md:flex items-center justify-between pb-3 border-b border-gray-200">
            <button
              onClick={() => setSubPage("resources-category")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Resource Categories</span>
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Course Modules
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-white rounded-2xl shadow-xs border border-gray-200 hover:border-indigo-400 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Module 1
                </span>
                <span className="text-xs text-gray-400">freeCodeCamp</span>
              </div>
              <h3 className="font-bold text-base text-gray-900">HTML - Semantic Structure</h3>
              <p className="text-xs text-gray-600 mt-1">Learn to build the accessible skeleton of modern web applications.</p>
              <div className="mt-3">
                <a
                  href="https://www.youtube.com/watch?v=kUMe1FH4CHE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                >
                  <Play className="h-3.5 w-3.5 fill-red-600" /> Watch: HTML Full Course
                </a>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-xs border border-gray-200 hover:border-indigo-400 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Module 2
                </span>
                <span className="text-xs text-gray-400">SuperSimpleDev</span>
              </div>
              <h3 className="font-bold text-base text-gray-900">CSS - Styling, Flexbox & Grid</h3>
              <p className="text-xs text-gray-600 mt-1">Master modern responsive layouts, media queries, and responsive components.</p>
              <div className="mt-3">
                <a
                  href="https://www.youtube.com/watch?v=OXGznpKZ_sA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                >
                  <Play className="h-3.5 w-3.5 fill-red-600" /> Watch: CSS Full Course
                </a>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-xs border border-gray-200 hover:border-indigo-400 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Module 3
                </span>
                <span className="text-xs text-gray-400">SuperSimpleDev</span>
              </div>
              <h3 className="font-bold text-base text-gray-900">JavaScript - Logic & DOM Manipulation</h3>
              <p className="text-xs text-gray-600 mt-1">Add interactivity, event handlers, asynchronous fetch requests, and state.</p>
              <div className="mt-3">
                <a
                  href="https://www.youtube.com/watch?v=PkZNo7MFNFg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                >
                  <Play className="h-3.5 w-3.5 fill-red-600" /> Watch: JavaScript Full Course
                </a>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-xs border border-gray-200 hover:border-indigo-400 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Module 4
                </span>
                <span className="text-xs text-gray-400">SuperSimpleDev</span>
              </div>
              <h3 className="font-bold text-base text-gray-900">React - Scalable UI Components</h3>
              <p className="text-xs text-gray-600 mt-1">Hooks, state management, props drilling, and component reusability.</p>
              <div className="mt-3">
                <a
                  href="https://www.youtube.com/watch?v=SqcY0GlETPk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                >
                  <Play className="h-3.5 w-3.5 fill-red-600" /> Watch: React Full Course
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {quizOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-2xl w-full max-w-lg mx-auto animate-fade-in text-gray-800 relative max-h-[90dvh] overflow-y-auto">
            <button
              onClick={() => setQuizOpen(false)}
              aria-label="Close quiz"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-xl min-h-[36px] min-w-[36px] flex items-center justify-center text-sm font-bold bg-gray-100 hover:bg-gray-200 transition"
            >
              ✕
            </button>

            {currentQuestionIdx < quizData.length ? (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Question {currentQuestionIdx + 1} of {quizData.length}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-3 mb-4 leading-snug">
                  {quizData[currentQuestionIdx].question}
                </h3>
                <div className="space-y-2.5">
                  {quizData[currentQuestionIdx].options.map((opt, i) => (
                    <label
                      key={i}
                      className={`flex items-center p-3.5 border rounded-xl cursor-pointer hover:bg-gray-50 transition text-xs sm:text-sm ${
                        selectedOption === opt
                          ? "border-indigo-600 bg-indigo-50/70 font-semibold"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="option"
                        value={opt}
                        checked={selectedOption === opt}
                        disabled={submittedAnswer}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="mr-3 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0"
                      />
                      <span className="text-gray-800">{opt}</span>
                    </label>
                  ))}
                </div>

                {!submittedAnswer ? (
                  <button
                    onClick={handleSubmitQuizAnswer}
                    className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition text-xs sm:text-sm shadow-xs"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className="mt-4 p-3.5 rounded-xl bg-indigo-50 text-indigo-900 text-xs sm:text-sm font-medium leading-relaxed border border-indigo-150 animate-fade-in">
                    {quizFeedback}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-1">Quiz Complete!</h3>
                <p className="text-xs text-gray-500 mb-4">
                  You scored <strong className="text-indigo-600 text-base">{quizScore} / {quizData.length}</strong>
                </p>
                <button
                  onClick={() => setQuizOpen(false)}
                  className="bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700 transition text-xs"
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
