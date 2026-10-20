"use client";

import { useState, useRef } from "react";
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
  Eye,
  X,
  Check,
  ChevronRight,
  Maximize2,
  Share2,
  Printer,
  Loader2,
} from "lucide-react";
import { useBackHandler, BackPriority, shareContent, isNative, savePdfAndShare, openUrl, hapticSuccess, useStatusBarStyle, AppStatusBarStyle } from "@/shared/platform";
import DocumentViewerModal, { DownloadableNoteItem } from "./learn/DocumentViewerModal";

export interface RoadmapMilestone {
  phase: string;
  duration: string;
  summary: string;
  topics: string[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
  level: string;
  description: string;
  skills: string[];
  pdfUrl: string;
  fileName: string;
  milestones: RoadmapMilestone[];
}

interface LearnPracticeProps {
  subPage?: string;
  onChangeSubPage?: (page: string) => void;
}

export default function LearnPractice({
  subPage: controlledSubPage,
  onChangeSubPage,
}: LearnPracticeProps = {}) {
  const [internalSubPage, setInternalSubPage] = useState("hub");
  // Light surface → dark icons on status bar
  useStatusBarStyle(AppStatusBarStyle.DARK_CONTENT);
  const subPage = controlledSubPage !== undefined ? controlledSubPage : internalSubPage;

  const setSubPage = (page: string) => {
    if (onChangeSubPage) {
      onChangeSubPage(page);
    } else {
      setInternalSubPage(page);
    }
  };

  // Roadmap & Quiz Modal View State
  const [quizOpen, setQuizOpen] = useState(false);
  const [selectedRoadmapDetail, setSelectedRoadmapDetail] = useState<RoadmapItem | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});
  const [roadmapModalView, setRoadmapModalView] = useState<"milestones" | "document">("milestones");
  const [isExportingRoadmap, setIsExportingRoadmap] = useState(false);
  const [isExportingRoadmapId, setIsExportingRoadmapId] = useState<string | null>(null);
  const [activeExportRoadmap, setActiveExportRoadmap] = useState<RoadmapItem | null>(null);
  const roadmapPrintRef = useRef<HTMLDivElement>(null);

  // In-App Document Preview Modal State for Study Notes
  const [selectedNotePreview, setSelectedNotePreview] = useState<DownloadableNoteItem | null>(null);
  const [isDownloadingNote, setIsDownloadingNote] = useState<boolean>(false);

  // Register Back Handler for Detail Modal, Document Preview & Subpages
  useBackHandler(BackPriority.OVERLAY, () => {
    if (selectedNotePreview) {
      setSelectedNotePreview(null);
      return true;
    }
    if (quizOpen) {
      setQuizOpen(false);
      return true;
    }
    if (selectedRoadmapDetail) {
      setSelectedRoadmapDetail(null);
      return true;
    }
    if (subPage !== "hub") {
      setSubPage("hub");
      return true;
    }
    return false;
  }, [selectedNotePreview, quizOpen, selectedRoadmapDetail, subPage]);

  // Native Share Helper for Study Notes
  const handleShareNote = async (item: DownloadableNoteItem) => {
    const summaryText = `${item.title}\nCategory: ${item.category} (${item.pages})\n\nTopics:\n${item.topics
      .map((t) => `• ${t}`)
      .join("\n")}\n\nVerified Curriculum Notes from ResuMentor`;

    const shared = await shareContent({
      title: item.title,
      text: summaryText,
      dialogTitle: `Share ${item.title}`,
    });
    if (shared) {
      toast.success("Document shared successfully");
    }
  };

  // Native Share Helper for Roadmap Syllabi
  const handleShareRoadmap = async (item: RoadmapItem) => {
    const summaryText = `${item.title} Career Roadmap (${item.duration})\nLevel: ${item.level}\n\nMilestones:\n${item.milestones
      .map((m) => `• ${m.phase} (${m.duration}): ${m.summary}`)
      .join("\n")}\n\nVerified Curriculum from ResuMentor`;

    const shared = await shareContent({
      title: `${item.title} - Career Roadmap`,
      text: summaryText,
      dialogTitle: `Share ${item.title} Roadmap`,
    });
    if (shared) {
      toast.success("Roadmap shared successfully");
    }
  };

  // Client-Side Robust Roadmap PDF Generator and Downloader
  const handleExportRoadmapPdf = async (item: RoadmapItem) => {
    setIsExportingRoadmapId(item.id);
    setIsExportingRoadmap(true);
    setActiveExportRoadmap(item);
    const toastId = toast.loading(`Preparing ${item.fileName}...`);
    try {
      // 1. Check if bundled static asset can be fetched directly as blob
      let pdfBlob: Blob | null = null;
      try {
        const fetchUrl = encodeURI(item.pdfUrl);
        const response = await fetch(fetchUrl);
        if (response.ok) {
          const blob = await response.blob();
          if (blob && blob.size > 1000) {
            pdfBlob = blob;
          }
        }
      } catch (fetchErr) {
        console.warn("Direct file fetch fallback", fetchErr);
      }

      // 2. Client-side dynamic PDF generation via html2pdf if asset not bundled
      if (!pdfBlob) {
        const html2pdfModule = await import("html2pdf.js");
        const html2pdf = (html2pdfModule.default || html2pdfModule) as unknown as (
          options?: unknown
        ) => {
          from: (el: HTMLElement) => {
            set: (opt: unknown) => {
              outputPdf: (type: string) => Promise<Blob>;
            };
          };
        };
        const element = roadmapPrintRef.current;
        if (!element) throw new Error("Printable template not found.");

        const opt = {
          margin: 0.4,
          filename: item.fileName,
          image: { type: "jpeg" as const, quality: 0.95 },
          html2canvas: { scale: isNative() ? 1.2 : 2, useCORS: true, logging: false },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
        };

        const worker = html2pdf().from(element).set(opt);
        pdfBlob = (await worker.outputPdf("blob")) as Blob;
      }

      if (!pdfBlob || pdfBlob.size < 500) {
        throw new Error("Unable to build roadmap document.");
      }

      const res = await savePdfAndShare(pdfBlob, item.fileName, {
        shareText: `${item.title} Career Roadmap & Curriculum - ResuMentor`,
        dialogTitle: `Save or share ${item.fileName}`,
      });

      if (res.ok && res.delivered) {
        hapticSuccess();
        toast.success(res.message, { id: toastId });
      } else if (res.ok) {
        toast.dismiss(toastId);
      } else {
        toast.error(res.message || `Failed to deliver ${item.fileName}`, { id: toastId });
      }
    } catch (err: unknown) {
      console.warn("Roadmap export error:", err);
      const msg = err instanceof Error ? err.message : `Failed to export ${item.fileName}`;
      toast.error(msg, { id: toastId });
    } finally {
      setIsExportingRoadmap(false);
      setIsExportingRoadmapId(null);
    }
  };

  // Robust PDF Download & Native Share Helper for Study Notes
  const handleDownloadPdf = async (url: string, fileName: string, noteTitle?: string) => {
    setIsDownloadingNote(true);
    const toastId = toast.loading(`Preparing ${fileName}...`);
    try {
      const fetchUrl = encodeURI(url);
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch PDF`);
      const blob = await response.blob();

      const res = await savePdfAndShare(blob, fileName, {
        shareText: `${noteTitle || fileName}\nVerified Study Notes & Curriculum Reference - ResuMentor`,
        dialogTitle: `Save or share ${fileName}`,
      });

      if (res.ok && res.delivered) {
        hapticSuccess();
        toast.success(res.message, { id: toastId });
      } else if (res.ok) {
        toast.dismiss(toastId);
      } else {
        toast.error(res.message || `Failed to deliver ${fileName}`, { id: toastId });
      }
    } catch (err: unknown) {
      console.warn("Fetch fallback to openUrl", err);
      const opened = await openUrl(url);
      if (opened) {
        toast.success(`Opened ${fileName}`, { id: toastId });
      } else {
        toast.error(`Unable to deliver ${fileName}`, { id: toastId });
      }
    } finally {
      setIsDownloadingNote(false);
    }
  };

  const toggleMilestone = (roadmapId: string, milestoneIdx: number) => {
    const key = `${roadmapId}_${milestoneIdx}`;
    setCompletedMilestones((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Quiz state
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
  const roadmaps: RoadmapItem[] = [
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
      milestones: [
        {
          phase: "Phase 1: Web Foundations & DOM",
          duration: "Weeks 1–4",
          summary: "Master the building blocks of the modern web and clean semantic code.",
          topics: [
            "HTML5 Semantic Structure & Accessibility",
            "CSS3 Flexbox, Grid & Responsive Layouts",
            "JavaScript ES6+, Promises, and Async/Await",
            "DOM Manipulation & Event-Driven Architecture",
          ],
        },
        {
          phase: "Phase 2: Frontend Engineering & State",
          duration: "Weeks 5–12",
          summary: "Build scalable reactive client applications with TypeScript and modern frameworks.",
          topics: [
            "React 18 Component Lifecycle & Hooks",
            "Next.js App Router & Server Components",
            "TypeScript Strict Typing & Interfaces",
            "TailwindCSS Production Design Systems",
          ],
        },
        {
          phase: "Phase 3: Backend Systems & APIs",
          duration: "Weeks 13–20",
          summary: "Engineer secure, high-throughput server APIs and relational databases.",
          topics: [
            "Node.js & Express RESTful API Patterns",
            "PostgreSQL Schema Design & Prisma ORM",
            "Authentication (JWT, OAuth & Supabase Auth)",
            "Input Validation, Security Headers & Rate Limiting",
          ],
        },
        {
          phase: "Phase 4: Cloud, DevOps & Production",
          duration: "Weeks 21–28",
          summary: "Containerize, deploy, and monitor full-stack applications in the cloud.",
          topics: [
            "Docker Containerization & Multi-stage Builds",
            "CI/CD Workflows via GitHub Actions",
            "Cloud Deployment on AWS & Vercel",
            "Performance Monitoring & Caching with Redis",
          ],
        },
      ],
    },
    {
      id: "ai-engineer",
      title: "AI & Machine Learning Engineer",
      badge: "High growth",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
      icon: Cpu,
      duration: "6–8 Months",
      level: "Intermediate → Specialist",
      description: "Mathematical foundations, PyTorch, neural networks, computer vision, LLM prompt engineering, and MLOps.",
      skills: ["Python", "TensorFlow", "PyTorch", "Transformers", "MLOps"],
      pdfUrl: "/ROADMAPS/ai-engineer.pdf",
      fileName: "ai-engineer-roadmap.pdf",
      milestones: [
        {
          phase: "Phase 1: Mathematical Foundations & Python",
          duration: "Weeks 1–6",
          summary: "Solidify vector calculus, linear algebra, and data pipelines.",
          topics: [
            "Linear Algebra & Matrix Operations",
            "Probability, Statistics & Hypothesis Testing",
            "NumPy & Pandas High-Performance Vectorization",
            "Exploratory Data Analysis with Matplotlib/Seaborn",
          ],
        },
        {
          phase: "Phase 2: Classical Machine Learning",
          duration: "Weeks 7–12",
          summary: "Master core predictive models and validation techniques.",
          topics: [
            "Supervised Learning (Regression & Classification)",
            "Tree-based Models (Random Forests & XGBoost)",
            "Unsupervised Clustering & Dimensionality Reduction",
            "Feature Engineering, Cross-Validation & Metric Evaluation",
          ],
        },
        {
          phase: "Phase 3: Deep Learning & Neural Networks",
          duration: "Weeks 13–20",
          summary: "Train deep architectures for vision, language, and pattern recognition.",
          topics: [
            "PyTorch Tensor Computation & Autograd",
            "Convolutional Neural Networks (CNNs) for Vision",
            "Recurrent Networks & Attention Mechanisms",
            "HuggingFace Transformers Architecture",
          ],
        },
        {
          phase: "Phase 4: Generative AI, LLMs & MLOps",
          duration: "Weeks 21–28",
          summary: "Deploy modern generative models and production AI pipelines.",
          topics: [
            "Retrieval-Augmented Generation (RAG) Architecture",
            "Vector Databases (Pinecone / pgvector)",
            "LLM Fine-Tuning & Quantization",
            "Model Deployment, MLflow & CI/CD for AI",
          ],
        },
      ],
    },
    {
      id: "frontend",
      title: "Frontend UI/UX Specialist",
      badge: "Core track",
      badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: Layout,
      duration: "3–5 Months",
      level: "Beginner → Mid-Level",
      description: "Modern component architecture, reactive state management, TailwindCSS styling, and high-performance apps.",
      skills: ["HTML5/CSS3", "JavaScript ES6+", "React 18", "TailwindCSS"],
      pdfUrl: "/ROADMAPS/frontend.pdf",
      fileName: "frontend-developer-roadmap.pdf",
      milestones: [
        {
          phase: "Phase 1: Advanced Layout & Design Systems",
          duration: "Weeks 1–4",
          summary: "Create pixel-perfect, accessible, and responsive user interfaces.",
          topics: [
            "CSS Grid, Subgrid & Container Queries",
            "TailwindCSS Token Architecture",
            "WCAG 2.1 AA Accessibility Standards",
            "Typography, Contrast & Micro-interactions",
          ],
        },
        {
          phase: "Phase 2: Component Architecture & State",
          duration: "Weeks 5–10",
          summary: "Develop modular, reusable components with predictable state flow.",
          topics: [
            "React 18 Custom Hooks & Context Patterns",
            "Server Components & Suspense Boundaries",
            "Client State with Zustand / Redux Toolkit",
            "Form Handling with React Hook Form & Zod",
          ],
        },
        {
          phase: "Phase 3: Performance, Animation & Quality",
          duration: "Weeks 11–16",
          summary: "Optimize Core Web Vitals and test critical interaction flows.",
          topics: [
            "Framer Motion Smooth UI Transitions",
            "Lighthouse & Core Web Vitals Optimization",
            "Unit & Integration Testing with Vitest",
            "End-to-End Testing with Playwright",
          ],
        },
        {
          phase: "Phase 4: Production Web Apps",
          duration: "Weeks 17–20",
          summary: "Build offline-ready, lightning-fast progressive web applications.",
          topics: [
            "Progressive Web Apps (PWA) & Service Workers",
            "Internationalization (i18n)",
            "Edge Rendering & Asset Optimization",
            "Cross-browser & Mobile Device Testing",
          ],
        },
      ],
    },
    {
      id: "backend",
      title: "Backend & Systems Architect",
      badge: "Enterprise systems",
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
      icon: Server,
      duration: "4–6 Months",
      level: "Intermediate → Advanced",
      description: "High-throughput servers, microservices design, database optimization, caching layers, and API security.",
      skills: ["Node.js", "Express", "System Design", "PostgreSQL", "Docker"],
      pdfUrl: "/ROADMAPS/backend.pdf",
      fileName: "backend-architect-roadmap.pdf",
      milestones: [
        {
          phase: "Phase 1: Systems & Concurrency",
          duration: "Weeks 1–4",
          summary: "Understand server runtime internals and asynchronous concurrency.",
          topics: [
            "Node.js Event Loop & Worker Threads",
            "Go / Rust Concurrency Fundamentals",
            "Linux Systems Administration & Bash Scripting",
            "TCP/IP, HTTP/2, HTTP/3 Protocols",
          ],
        },
        {
          phase: "Phase 2: Storage & Query Optimization",
          duration: "Weeks 5–10",
          summary: "Design resilient relational schemas and caching strategies.",
          topics: [
            "PostgreSQL Schema Design & B-Tree Indexing",
            "Connection Pooling & Transaction Isolation Levels",
            "Redis In-Memory Caching & Rate Limiting",
            "Database Migrations & Backup Strategies",
          ],
        },
        {
          phase: "Phase 3: Distributed Systems & Microservices",
          duration: "Weeks 11–16",
          summary: "Architect decoupled, message-driven backend systems.",
          topics: [
            "gRPC & Protocol Buffers Communication",
            "Message Brokers (Kafka / RabbitMQ)",
            "Event-Driven & CQRS Architecture",
            "Distributed Tracing & OpenTelemetry",
          ],
        },
        {
          phase: "Phase 4: High Availability & Security",
          duration: "Weeks 17–24",
          summary: "Harden APIs against vulnerabilities and manage cloud scale.",
          topics: [
            "Docker & Kubernetes Orchestration",
            "OAuth2, OpenID Connect & Zero-Trust Security",
            "Load Balancing, API Gateways & Reverse Proxies",
            "Chaos Engineering & Disaster Recovery",
          ],
        },
      ],
    },
  ];

  // Curated Downloadable Notes Catalog with Rich Structured Syllabi
  const notesList: DownloadableNoteItem[] = [
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
      description:
        "Comprehensive 85+ pages syllabus covering modern semantic HTML5, CSS Flexbox & CSS Grid, JavaScript ES6+ execution context, DOM manipulation, asynchronous programming, RESTful APIs, Node.js backend architecture, and production deployment.",
      sections: [
        {
          title: "Module 1: Semantic HTML5 & Web Accessibility (WCAG)",
          summary: "Master semantic markup for SEO and screen readers, ARIA roles, landmarks, and accessible form controls.",
          points: [
            "Use <main>, <nav>, <article>, <section>, <aside>, <header>, <footer> instead of unsemantic <div> soup.",
            "Always supply alt attributes on <img> and aria-label on icon-only interactive controls.",
            "Form accessibility: Associate every <input> with <label for='id'> and explicit type, inputmode, and autocomplete.",
          ],
          codeSnippet: `<form aria-labelledby="login-heading">\n  <label for="user-email">Email Address</label>\n  <input id="user-email" type="email" autocomplete="email" required />\n</form>`,
          tags: ["HTML5", "Accessibility", "SEO"],
        },
        {
          title: "Module 2: Modern Responsive Layouts (Flexbox & Grid)",
          summary: "Architect fluid, responsive layouts across mobile, tablet, and desktop without layout shifts.",
          points: [
            "Flexbox for 1D axis alignment (justify-content, align-items, flex-wrap: wrap).",
            "CSS Grid for 2D complex layouts (grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))).",
            "Mobile-first media queries: build for compact screens first, layer min-width breakpoints for larger displays.",
          ],
          codeSnippet: `.dashboard-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n  gap: 1.5rem;\n}`,
          tags: ["CSS3", "Flexbox", "Grid"],
        },
        {
          title: "Module 3: JavaScript Runtime, Event Loop & Async/Await",
          summary: "Deep dive into JS call stack, microtask vs macrotask queues, promises, and typed error handling.",
          points: [
            "Call stack executes synchronous code first; Microtasks (Promises) execute before Macrotasks (setTimeout, setInterval).",
            "Always pair async/await with try...catch and handle typed errors.",
            "Avoid memory leaks by cleaning up event listeners and timers in component unmounts.",
          ],
          codeSnippet: `async function fetchUserData(userId: string): Promise<User> {\n  const res = await fetch(\`/api/users/\${userId}\`);\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return (await res.json()) as User;\n}`,
          tags: ["JavaScript", "EventLoop", "Async"],
        },
        {
          title: "Module 4: Backend RESTful APIs & Data Architecture",
          summary: "Engineer secure Node.js REST services, relational SQL queries, JWT authentication, and CORS.",
          points: [
            "HTTP status code discipline: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Error.",
            "Never store plain-text passwords: hash with bcrypt or argon2 with unique cryptographic salt.",
            "Use parameterized SQL queries or ORMs to defend against SQL Injection vulnerabilities.",
          ],
          tags: ["Backend", "Node.js", "APIs"],
        },
      ],
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
      description:
        "Academic Unit 1 curriculum covering supervised learning, linear and logistic regression, cost functions, gradient descent optimization, loss surfaces, and deep neural network feedforward propagation.",
      sections: [
        {
          title: "Unit 1.1: Supervised Learning & Regression Fundamentals",
          summary: "Formulate hypothesis functions, feature matrices, and mean squared error (MSE) cost functions.",
          points: [
            "Hypothesis: h_θ(x) = θ₀ + θ₁x₁ + ... + θₙxₙ = θᵀx.",
            "Cost function J(θ) measures empirical error: J(θ) = (1/2m) ∑ (h_θ(x^(i)) - y^(i))².",
            "Feature normalization (Z-score standard scaling) accelerates convergence.",
          ],
          codeSnippet: `import numpy as np\n# Z-score standardization\nX_norm = (X - np.mean(X, axis=0)) / np.std(X, axis=0)`,
          tags: ["Supervised", "Regression", "Math"],
        },
        {
          title: "Unit 1.2: Gradient Descent Optimization",
          summary: "First-order iterative optimization algorithm for finding the local minimum of a differentiable function.",
          points: [
            "Update rule: θⱼ := θⱼ - α * (∂/∂θⱼ) J(θ).",
            "Learning rate α selection: too small causes slow convergence, too large causes divergence/overshoot.",
            "Batch Gradient Descent vs Stochastic Gradient Descent (SGD) vs Mini-batch.",
          ],
          tags: ["Optimization", "GradientDescent"],
        },
        {
          title: "Unit 1.3: Logistic Regression & Binary Classification",
          summary: "Model classification probabilities using the Sigmoid activation function and Binary Cross-Entropy loss.",
          points: [
            "Sigmoid activation: σ(z) = 1 / (1 + e^(-z)), maps real values to probability interval [0, 1].",
            "Decision boundary at σ(z) = 0.5 (where z = θᵀx = 0).",
            "Binary Cross-Entropy Loss: -[y log(h_θ(x)) + (1-y) log(1 - h_θ(x))].",
          ],
          codeSnippet: `def sigmoid(z):\n    return 1 / (1 + np.exp(-np.clip(z, -500, 500)))`,
          tags: ["Classification", "Logistic", "Loss"],
        },
        {
          title: "Unit 1.4: Neural Network Perceptrons & Feedforward",
          summary: "Multi-layer perceptron architecture, matrix weight multiplications, and non-linear activation functions.",
          points: [
            "Layers: Input layer, one or more hidden layers, and output layer.",
            "Activations: ReLU (max(0, z)), GELU, Sigmoid, Softmax for multi-class probability distributions.",
            "Forward propagation computes intermediate activations a^[l] = g(W^[l] a^[l-1] + b^[l]).",
          ],
          tags: ["NeuralNetworks", "DeepLearning"],
        },
      ],
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
      description:
        "Quick-reference cheat sheet for frontend developers covering essential HTML tags, CSS box model calculations, selector specificity rules, Flexbox cheatsheet, and common JavaScript DOM manipulation patterns.",
      sections: [
        {
          title: "Syntax Sheet 1: Essential HTML Structure & Semantic Elements",
          summary: "Core tag references and correct semantic usage.",
          points: [
            "<header>, <nav>, <main>, <article>, <section>, <footer>.",
            "Meta viewport: <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">.",
            "Button vs Anchor: <button> triggers in-page actions; <a> navigates to a URL.",
          ],
          tags: ["HTML", "Tags", "Cheatsheet"],
        },
        {
          title: "Syntax Sheet 2: CSS Box Model & Specificity Hierarchy",
          summary: "Margin, border, padding, content box calculations and cascade specificity weights.",
          points: [
            "box-sizing: border-box; includes padding and border inside width calculation (standard in modern CSS).",
            "Specificity weight: Inline styles (1,0,0,0) > IDs (0,1,0,0) > Classes/Attributes/Pseudo-classes (0,0,1,0) > Elements (0,0,0,1).",
            "Margin collapsing: adjacent vertical margins combine into the larger of the two.",
          ],
          tags: ["CSS", "BoxModel", "Specificity"],
        },
        {
          title: "Syntax Sheet 3: Flexbox & Centering Quick Patterns",
          summary: "Instant recipes for centering and fluid layout spacing.",
          points: [
            "Perfect Center: display: flex; justify-content: center; align-items: center;",
            "Sticky footer: display: flex; flex-direction: column; min-height: 100vh; on body, margin-top: auto on footer.",
            "gap property applies spacing between flex items without needing margin hacks.",
          ],
          codeSnippet: `/* Perfect Center Container */\n.center-box {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`,
          tags: ["Flexbox", "Layout", "Cheatsheet"],
        },
      ],
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

          {/* Roadmaps Grid with bottom navigation clearance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-28 sm:pb-12">
            {roadmaps.map((r) => {
              const IconComp = r.icon;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRoadmapDetail(r);
                    setRoadmapModalView("milestones");
                  }}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer active:scale-[0.99]"
                >
                  <div>
                    {/* Top Row: Sentence-case micro-pill & duration */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className={`text-[11px] font-semibold tracking-normal px-2.5 py-0.5 rounded-full border whitespace-nowrap ${r.badgeColor}`}
                      >
                        {r.badge}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        {r.duration}
                      </span>
                    </div>

                    {/* Title & Fixed Square Icon */}
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="w-10 h-10 min-w-[40px] rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-snug">
                          {r.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 mt-0.5">
                          <Layers className="w-3.5 h-3.5 text-gray-500" />
                          {r.level}
                        </span>
                      </div>
                    </div>

                    {/* High-contrast description */}
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-3.5">
                      {r.description}
                    </p>

                    {/* Skill chips: max 4 + counter to avoid orphans */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {r.skills.slice(0, 4).map((skill, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                      {r.skills.length > 4 && (
                        <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                          +{r.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: View Roadmap (Primary 48px) + Download PDF (Secondary 48px) */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoadmapDetail(r);
                        setRoadmapModalView("milestones");
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 min-h-[48px]"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Roadmap</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-indigo-200" />
                    </button>
                    <button
                      type="button"
                      disabled={isExportingRoadmapId === r.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportRoadmapPdf(r);
                      }}
                      className="py-3 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-[0.99] text-indigo-700 border border-indigo-200 font-bold text-xs transition flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] disabled:opacity-60"
                      title="Download PDF"
                    >
                      {isExportingRoadmapId === r.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span className="text-[11px]">
                        {isExportingRoadmapId === r.id ? "Saving…" : "PDF"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive In-App Roadmap Detail Sheet / Modal */}
          {selectedRoadmapDetail && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
              <div className="bg-white w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-scale-up">
                {/* Mobile Drag Handle */}
                <div className="w-8 h-1 bg-gray-300 rounded-full mx-auto my-2 sm:hidden" />

                {/* Modal Header */}
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-start justify-between gap-3 bg-gradient-to-r from-gray-50 to-indigo-50/30">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {selectedRoadmapDetail.icon && (
                        <selectedRoadmapDetail.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${selectedRoadmapDetail.badgeColor}`}
                        >
                          {selectedRoadmapDetail.badge}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-600">
                          {selectedRoadmapDetail.duration} • {selectedRoadmapDetail.level}
                        </span>
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight truncate">
                        {selectedRoadmapDetail.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRoadmapDetail(null)}
                    aria-label="Close Roadmap Details"
                    className="p-2 -mr-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Segmented View Switcher: Interactive Milestones vs Curriculum Document */}
                <div className="flex p-1 bg-gray-100 rounded-xl mx-5 mt-3 mb-1">
                  <button
                    type="button"
                    onClick={() => setRoadmapModalView("milestones")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      roadmapModalView === "milestones"
                        ? "bg-white text-indigo-700 shadow-2xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Interactive Milestones
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoadmapModalView("document")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      roadmapModalView === "document"
                        ? "bg-white text-indigo-700 shadow-2xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Curriculum Document
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                  {roadmapModalView === "milestones" ? (
                    <>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-150">
                        {selectedRoadmapDetail.description}
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                            Curriculum Phases & Milestones
                          </h4>
                          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                            {
                              selectedRoadmapDetail.milestones.filter(
                                (_, idx) => completedMilestones[`${selectedRoadmapDetail.id}_${idx}`]
                              ).length
                            }{" "}
                            of {selectedRoadmapDetail.milestones.length} completed
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 transition-all duration-300"
                            style={{
                              width: `${
                                (selectedRoadmapDetail.milestones.filter(
                                  (_, idx) => completedMilestones[`${selectedRoadmapDetail.id}_${idx}`]
                                ).length /
                                  selectedRoadmapDetail.milestones.length) *
                                100
                              }%`,
                            }}
                          />
                        </div>

                        <div className="space-y-3 pt-1">
                          {selectedRoadmapDetail.milestones.map((m, idx) => {
                            const isDone = Boolean(
                              completedMilestones[`${selectedRoadmapDetail.id}_${idx}`]
                            );
                            return (
                              <div
                                key={idx}
                                onClick={() => toggleMilestone(selectedRoadmapDetail.id, idx)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                  isDone
                                    ? "bg-indigo-50/50 border-indigo-200"
                                    : "bg-white border-gray-200 hover:border-gray-300 shadow-2xs"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition ${
                                      isDone
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-gray-300 bg-white"
                                    }`}
                                  >
                                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <h5
                                        className={`text-xs sm:text-sm font-bold ${
                                          isDone ? "text-indigo-950 line-through" : "text-gray-900"
                                        }`}
                                      >
                                        {m.phase}
                                      </h5>
                                      <span className="text-[11px] font-semibold text-gray-500">
                                        {m.duration}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                      {m.summary}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2.5">
                                      {m.topics.map((t, ti) => (
                                        <span
                                          key={ti}
                                          className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                                        >
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* In-App Formatted Printable Curriculum Document */
                    <div ref={roadmapPrintRef} className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 space-y-5 text-gray-900">
                      <div className="border-b border-gray-200 pb-3">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                          Verified Career Track Syllabus
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-gray-900 mt-0.5">
                          {selectedRoadmapDetail.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {selectedRoadmapDetail.description}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {selectedRoadmapDetail.milestones.map((m, idx) => (
                          <div key={idx} className="border-l-2 border-indigo-400 pl-3 py-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">{m.phase}</h5>
                              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                {m.duration}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 leading-relaxed">{m.summary}</p>
                            <div className="flex flex-wrap gap-1">
                              {m.topics.map((t, ti) => (
                                <span
                                  key={ti}
                                  className="text-[10px] font-medium bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded"
                                >
                                  • {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
                        <span>Career Level: {selectedRoadmapDetail.level}</span>
                        <span>Estimated: {selectedRoadmapDetail.duration}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer with 48px touch targets */}
                <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      disabled={isExportingRoadmap}
                      onClick={() => handleExportRoadmapPdf(selectedRoadmapDetail)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition shadow-xs min-h-[48px]"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {isNative()
                          ? "Save as PDF"
                          : isExportingRoadmap
                          ? "Generating PDF…"
                          : "Download PDF"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareRoadmap(selectedRoadmapDetail)}
                      className="py-3 px-3.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs transition flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] shadow-2xs"
                      title="Share Roadmap"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRoadmapDetail(null)}
                    className="px-4 py-3 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-200 transition min-h-[48px]"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
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

                  {/* Actions: Open Notes (In-App Document Viewer) + Download (48px targets) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNotePreview(n)}
                      className="flex-1 py-3 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-[0.99] text-amber-900 border border-amber-200 font-bold text-xs transition flex items-center justify-center gap-1.5 min-h-[48px]"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Open Notes</span>
                    </button>
                    <button
                      type="button"
                      disabled={isDownloadingNote}
                      onClick={() => handleDownloadPdf(n.pdfUrl, n.fileName, n.title)}
                      className="py-3 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 min-h-[48px] disabled:opacity-60"
                      title="Download PDF Notes"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
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
                <button
                  type="button"
                  onClick={() => openUrl("https://www.youtube.com/watch?v=kUMe1FH4CHE")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition min-h-[44px]"
                >
                  <Play className="h-3.5 w-3.5 fill-red-600" /> Watch: HTML Full Course
                </button>
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
                <button
                  type="button"
                  onClick={() => openUrl("https://www.youtube.com/watch?v=OXGznpKZ_sA")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition min-h-[44px]"
                >
                  <Play className="h-3.5 w-3.5 fill-red-600" /> Watch: CSS Full Course
                </button>
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
                <button
                  type="button"
                  onClick={() => openUrl("https://www.youtube.com/watch?v=PkZNo7MFNFg")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition min-h-[44px]"
                >
                  <Play className="h-3.5 w-3.5 fill-red-600" /> Watch: JavaScript Full Course
                </button>
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
                <button
                  type="button"
                  onClick={() => openUrl("https://www.youtube.com/watch?v=SqcY0GlETPk")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition min-h-[44px]"
                >
                  <Play className="h-3.5 w-3.5 fill-red-600" /> Watch: React Full Course
                </button>
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

      {/* Dedicated Offscreen Printable Container for html2pdf Roadmap Generation */}
      {(activeExportRoadmap || selectedRoadmapDetail) && (
        <div
          ref={roadmapPrintRef}
          className="printable-document fixed -left-[9999px] top-0 pointer-events-none opacity-0 w-[800px] z-[-100] bg-white p-8 text-gray-900 font-sans"
          aria-hidden="true"
        >
          <div className="border-b-2 border-indigo-600 pb-4 mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                ResuMentor Official Career Roadmap
              </span>
              <span className="text-xs font-semibold text-gray-500">
                {(activeExportRoadmap || selectedRoadmapDetail)?.duration} · {(activeExportRoadmap || selectedRoadmapDetail)?.level}
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-1.5">
              {(activeExportRoadmap || selectedRoadmapDetail)?.title}
            </h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              {(activeExportRoadmap || selectedRoadmapDetail)?.description}
            </p>
          </div>

          <div className="space-y-5">
            {(activeExportRoadmap || selectedRoadmapDetail)?.milestones.map((m, idx) => (
              <div key={idx} className="border-l-2 border-indigo-300 pl-4 py-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h2 className="text-sm font-bold text-gray-900">{m.phase}</h2>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {m.duration}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2 leading-relaxed">{m.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.topics.map((t, ti) => (
                    <span
                      key={ti}
                      className="text-[10px] font-medium bg-gray-100 text-gray-800 px-2 py-0.5 rounded"
                    >
                      • {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400">
            <span>Generated by ResuMentor AI Career System</span>
            <span>resumentor.app</span>
          </div>
        </div>
      )}

      {/* Interactive Mobile-Native In-App Document & Notes Viewer Modal */}
      {selectedNotePreview && (
        <DocumentViewerModal
          note={selectedNotePreview}
          onClose={() => setSelectedNotePreview(null)}
          onDownload={(note) => handleDownloadPdf(note.pdfUrl, note.fileName, note.title)}
          onShare={handleShareNote}
          isDownloading={isDownloadingNote}
        />
      )}
    </div>
  );
}
