import { BankQuestion, ExperienceLevel } from "../types/interview";

export interface RoleProfile {
  id: string;
  title: string;
  aliases: string[];
  defaultSkills: string[];
}

export const ROLE_PROFILES: RoleProfile[] = [
  {
    id: "frontend-dev",
    title: "Frontend Developer",
    aliases: [
      "frontend",
      "react developer",
      "ui engineer",
      "web developer",
      "javascript engineer",
      "next.js developer",
    ],
    defaultSkills: ["React", "JavaScript", "TypeScript", "CSS", "Performance", "HTML", "State Management"],
  },
  {
    id: "backend-dev",
    title: "Backend Developer",
    aliases: [
      "backend",
      "node developer",
      "api engineer",
      "server engineer",
      "python developer",
      "java engineer",
    ],
    defaultSkills: ["Node.js", "REST APIs", "SQL", "Databases", "Authentication", "System Design", "Caching"],
  },
  {
    id: "fullstack-dev",
    title: "Full Stack Engineer",
    aliases: [
      "fullstack",
      "full stack",
      "software engineer",
      "mern developer",
      "full stack developer",
    ],
    defaultSkills: ["React", "Node.js", "TypeScript", "REST APIs", "Databases", "Architecture", "Git"],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    aliases: [
      "data analyst",
      "business analyst",
      "analytics engineer",
      "bi analyst",
    ],
    defaultSkills: ["SQL", "Data Modeling", "Python", "Visualization", "Statistics", "Excel"],
  },
  {
    id: "mobile-dev",
    title: "Mobile App Developer",
    aliases: [
      "mobile developer",
      "react native developer",
      "android developer",
      "ios developer",
      "flutter developer",
    ],
    defaultSkills: ["Mobile Architecture", "Offline Storage", "Performance", "APIs", "UI/UX"],
  },
  {
    id: "general",
    title: "General Software & Professional Role",
    aliases: ["general", "intern", "graduate trainee", "associate"],
    defaultSkills: ["Problem Solving", "Communication", "Teamwork", "Agile", "Ownership"],
  },
];

export const SKILL_ALIASES: Record<string, string[]> = {
  "React": ["react", "reactjs", "react.js", "hooks", "jsx"],
  "TypeScript": ["typescript", "ts", "type system"],
  "JavaScript": ["javascript", "js", "ecmascript", "es6"],
  "Node.js": ["node", "nodejs", "node.js", "express"],
  "REST APIs": ["rest", "api", "apis", "endpoints", "http"],
  "SQL": ["sql", "postgres", "postgresql", "mysql", "queries"],
  "Databases": ["database", "nosql", "mongodb", "firestore", "schema"],
  "System Design": ["system design", "scalability", "microservices", "architecture"],
  "Communication": ["communication", "presentation", "stakeholders", "verbal", "written"],
  "Teamwork": ["teamwork", "collaboration", "cross-functional", "agile", "scrum"],
  "Problem Solving": ["problem solving", "debugging", "troubleshooting", "analytical"],
  "Performance": ["performance", "optimization", "caching", "lighthouse", "latency"],
};

export const REVIEWED_QUESTION_BANK: BankQuestion[] = [
  // --- FRONTEND & REACT ---
  {
    id: "q-fe-01",
    type: "open_answer",
    roles: ["frontend-dev", "fullstack-dev"],
    levels: ["fresher", "junior", "mid", "senior"],
    skills: ["React", "Performance"],
    difficulty: "standard",
    questionText: "How does the React Virtual DOM work, and how does React optimize DOM reconciliation during state changes?",
    contextOrScenario: "A key foundational topic in frontend engineering discussions.",
    modelAnswer: "React maintains a lightweight in-memory representation of the actual DOM called the Virtual DOM. When state changes occur, React creates a new Virtual DOM tree and runs a diffing algorithm (Reconciliation) to compare it with the previous tree. It identifies the minimum necessary updates and batches changes to the real DOM, avoiding expensive direct browser layout recalculations.",
    keyPoints: [
      { id: "kp1", point: "Virtual DOM is an in-memory lightweight copy of the real DOM", acceptedKeywords: ["in-memory", "lightweight", "representation", "virtual dom", "copy"] },
      { id: "kp2", point: "Diffing algorithm compares previous and current virtual DOM trees", acceptedKeywords: ["diff", "diffing", "compare", "comparison", "reconciliation"] },
      { id: "kp3", point: "Batching updates to real DOM minimizes costly reflows and repaints", acceptedKeywords: ["batch", "batching", "minimum", "reflow", "repaint", "real dom"] },
    ],
    commonMistakes: [
      "Confusing the Shadow DOM (native browser encapsulation) with React's Virtual DOM.",
      "Saying Virtual DOM is inherently faster than direct DOM manipulation without noting the batching & diffing context."
    ],
    explanation: "React's Virtual DOM diffing computes minimal changes so that browser repaint/reflow costs are minimized.",
    estimatedSeconds: 120,
  },
  {
    id: "q-fe-02",
    type: "multiple_choice_single",
    roles: ["frontend-dev", "fullstack-dev"],
    levels: ["fresher", "junior", "mid"],
    skills: ["React", "JavaScript"],
    difficulty: "friendly",
    questionText: "Which hook should you use in React to memoize the computed result of an expensive calculation between re-renders?",
    options: [
      { id: "opt-a", text: "useCallback", isCorrect: false },
      { id: "opt-b", text: "useMemo", isCorrect: true },
      { id: "opt-c", text: "useRef", isCorrect: false },
      { id: "opt-d", text: "useEffect", isCorrect: false },
    ],
    explanation: "`useMemo` caches the calculated return value of a function, while `useCallback` caches the function definition itself.",
    estimatedSeconds: 60,
  },
  {
    id: "q-fe-03",
    type: "open_answer",
    roles: ["frontend-dev", "fullstack-dev"],
    levels: ["junior", "mid", "senior"],
    skills: ["Performance", "CSS", "JavaScript"],
    difficulty: "standard",
    questionText: "What strategies do you use to improve the Core Web Vitals (such as LCP and CLS) of a modern web application?",
    modelAnswer: "To improve Largest Contentful Paint (LCP), I prioritize critical resource loading by preloading hero images, using modern formats like WebP/AVIF, utilizing a CDN, and deferring non-critical scripts. For Cumulative Layout Shift (CLS), I always define explicit width and height dimensions on images and embeds, reserve space for dynamic ads/banners, and avoid inserting content above existing content after page load.",
    keyPoints: [
      { id: "kp1", point: "Preloading critical assets and using modern formats/CDN for LCP", acceptedKeywords: ["preload", "cdn", "webp", "avif", "image optimization", "lcp"] },
      { id: "kp2", point: "Setting explicit dimensions (width/height) on images to avoid CLS", acceptedKeywords: ["dimension", "width", "height", "aspect-ratio", "reserve space", "cls"] },
      { id: "kp3", point: "Code splitting and lazy loading non-critical JavaScript", acceptedKeywords: ["code splitting", "lazy load", "dynamic import", "defer"] },
    ],
    commonMistakes: ["Focusing only on bundle size while neglecting layout shifts caused by un-dimensioned images."],
    explanation: "Core Web Vitals measure real-world user experience across loading speed (LCP), visual stability (CLS), and interactivity (INP).",
    estimatedSeconds: 150,
  },
  // --- BACKEND & APIS ---
  {
    id: "q-be-01",
    type: "open_answer",
    roles: ["backend-dev", "fullstack-dev"],
    levels: ["fresher", "junior", "mid", "senior"],
    skills: ["REST APIs", "Node.js"],
    difficulty: "standard",
    questionText: "What are the core differences between PUT and PATCH HTTP methods in a RESTful API?",
    modelAnswer: "PUT is used for idempotent complete replacement of a resource; the client sends the entire updated resource representation. PATCH is used for partial modifications; the client sends only the specific fields that need to be updated. Furthermore, PUT is guaranteed to be idempotent by HTTP specification, whereas PATCH may or may not be idempotent depending on implementation.",
    keyPoints: [
      { id: "kp1", point: "PUT replaces the full resource while PATCH applies partial updates", acceptedKeywords: ["full", "complete", "replace", "partial", "subset", "fields"] },
      { id: "kp2", point: "PUT is idempotent meaning identical multiple requests yield the same state", acceptedKeywords: ["idempotent", "idempotency", "same result"] },
    ],
    commonMistakes: ["Assuming PUT and PATCH are interchangeable without acknowledging idempotency semantics."],
    explanation: "RFC 7231 specifies PUT as a complete representation replacement, while RFC 5789 specifies PATCH for partial delta modifications.",
    estimatedSeconds: 100,
  },
  {
    id: "q-be-02",
    type: "situational_judgement",
    roles: ["backend-dev", "fullstack-dev"],
    levels: ["junior", "mid", "senior"],
    skills: ["Databases", "System Design"],
    difficulty: "standard",
    questionText: "Your production relational database is experiencing high CPU utilization and slow query responses during peak traffic hours. What is your most effective first step to diagnose and mitigate the issue?",
    options: [
      { id: "opt-a", text: "Immediately rewrite the database in a NoSQL database like MongoDB.", rating: 0 },
      { id: "opt-b", text: "Analyze the database slow query logs and execution plans (EXPLAIN), add missing indexes on frequent filter/join keys, and introduce a cache (Redis) for hot read queries.", rating: 100 },
      { id: "opt-c", text: "Vertically upgrade the database server to the largest tier available without checking queries.", rating: 50 },
      { id: "opt-d", text: "Disable all background database transactions and scheduled cron jobs.", rating: 30 },
    ],
    explanation: "Analyzing slow query logs with `EXPLAIN` isolates the bottleneck without expensive migrations; caching hot reads provides immediate traffic relief.",
    estimatedSeconds: 90,
  },
  {
    id: "q-be-03",
    type: "short_answer",
    roles: ["backend-dev", "fullstack-dev"],
    levels: ["fresher", "junior"],
    skills: ["REST APIs"],
    difficulty: "friendly",
    questionText: "What HTTP status code should a REST API return when a client makes a request without valid authentication credentials?",
    acceptedAnswers: ["401", "401 unauthorized", "401 Unauthorized"],
    explanation: "HTTP 401 Unauthorized indicates that the request lacks valid authentication credentials. (403 is Forbidden when authenticated but lacking permissions).",
    estimatedSeconds: 45,
  },
  // --- BEHAVIORAL & SITUATIONAL ---
  {
    id: "q-bh-01",
    type: "open_answer",
    roles: ["frontend-dev", "backend-dev", "fullstack-dev", "data-analyst", "mobile-dev", "general"],
    levels: ["fresher", "junior", "mid", "senior", "lead"],
    skills: ["Problem Solving", "Communication", "Teamwork"],
    difficulty: "standard",
    questionText: "Tell me about a time you faced a difficult technical challenge or bug right before a critical deadline. How did you handle it?",
    contextOrScenario: "Use the STAR method: Situation, Task, Action, Result.",
    modelAnswer: "In a previous project, 24 hours before a production deployment, we noticed intermittent session timeouts under simulated load. My responsibility was to identify the root cause without delaying release. I isolated the issue by reproducing it in staging with distributed tracing, discovering a race condition in token refreshes. I communicated transparently with the team lead, wrote a patch with a mutex lock, verified it under load test, and we deployed on schedule with zero customer disruption.",
    keyPoints: [
      { id: "kp1", point: "Clearly articulated the situation and specific challenge under deadline pressure", acceptedKeywords: ["situation", "deadline", "issue", "bug", "challenge", "pressure"] },
      { id: "kp2", point: "Systematic investigation and action taken (debugging, tracing, testing)", acceptedKeywords: ["investigate", "action", "debug", "trace", "isolated", "tested", "fixed"] },
      { id: "kp3", point: "Transparent communication with team and successful outcome or lesson", acceptedKeywords: ["communicated", "team", "outcome", "result", "deployed", "lesson"] },
    ],
    commonMistakes: [
      "Blaming teammates or third-party tools without taking personal ownership.",
      "Describing what 'we' did without clarifying personal contributions and actions."
    ],
    explanation: "Interviewer evaluates structured problem-solving, composure under stress, and ownership.",
    estimatedSeconds: 180,
  },
  {
    id: "q-bh-02",
    type: "situational_judgement",
    roles: ["frontend-dev", "backend-dev", "fullstack-dev", "general"],
    levels: ["junior", "mid", "senior"],
    skills: ["Teamwork", "Communication"],
    difficulty: "standard",
    questionText: "A senior team member submits a pull request with code that works, but it violates the team's agreed architecture patterns and lacks unit tests. How do you respond?",
    options: [
      { id: "opt-a", text: "Approve it immediately because they are senior and know what they are doing.", rating: 0 },
      { id: "opt-b", text: "Reject the PR publicly in the team chat and demand they rewrite it.", rating: 20 },
      { id: "opt-c", text: "Leave constructive code review comments highlighting the team standards, explain the architectural impact, and offer to collaborate on adding the test suite.", rating: 100 },
      { id: "opt-d", text: "Silently merge it, then rewrite their code on your own branch later.", rating: 30 },
    ],
    explanation: "Constructive feedback backed by shared team agreements protects codebase health while maintaining psychological safety.",
    estimatedSeconds: 90,
  },
  // --- GENERAL & CLOSING ---
  {
    id: "q-gen-01",
    type: "open_answer",
    roles: ["frontend-dev", "backend-dev", "fullstack-dev", "data-analyst", "mobile-dev", "general"],
    levels: ["fresher", "junior", "mid", "senior", "lead"],
    skills: ["Communication", "Problem Solving"],
    difficulty: "friendly",
    questionText: "Why are you interested in this target role, and how have you prepared yourself to contribute to the team from day one?",
    modelAnswer: "I am passionate about this role because it aligns with my focus on building scalable, reliable user-centered products. To prepare, I have deepened my hands-on practice with the modern stack, contributed to relevant projects, and focused on clean architecture and automated testing. I aim to hit the ground running by understanding team conventions, reading existing documentation, and delivering incremental value quickly.",
    keyPoints: [
      { id: "kp1", point: "Connected enthusiasm to the role's domain and responsibilities", acceptedKeywords: ["align", "passionate", "interested", "role", "domain", "impact"] },
      { id: "kp2", point: "Highlighted concrete technical preparation and portfolio experience", acceptedKeywords: ["prepared", "practice", "projects", "skills", "experience"] },
      { id: "kp3", point: "Action-oriented mindset toward contributing to the team early", acceptedKeywords: ["contribute", "team", "value", "learn", "day one"] },
    ],
    commonMistakes: ["Giving a purely self-serving answer (e.g., 'I want a high salary') without articulating value to the employer."],
    explanation: "Tests motivation, preparation, self-awareness, and value proposition.",
    estimatedSeconds: 120,
  },
  {
    id: "q-gen-02",
    type: "open_answer",
    roles: ["frontend-dev", "backend-dev", "fullstack-dev", "data-analyst", "mobile-dev", "general"],
    levels: ["fresher", "junior", "mid", "senior", "lead"],
    skills: ["Communication"],
    difficulty: "friendly",
    questionText: "Do you have any questions for us about the role, team dynamics, or engineering culture?",
    modelAnswer: "Yes, I would love to understand what a typical engineering sprint looks like on the team, how technical debt is balanced alongside product features, and what success looks like for someone in this role over the first 90 days.",
    keyPoints: [
      { id: "kp1", point: "Asked thoughtful questions regarding engineering culture or sprint workflow", acceptedKeywords: ["culture", "sprint", "workflow", "engineering", "process"] },
      { id: "kp2", point: "Inquired about expectations, onboarding success, or business goals", acceptedKeywords: ["success", "expectations", "90 days", "growth", "goals"] },
    ],
    commonMistakes: ["Saying 'No, I don't have any questions' which can suggest low engagement."],
    explanation: "Candidate questions reveal initiative, business maturity, and professional curiosity.",
    estimatedSeconds: 90,
  },
];

export const NARRATIVE_TEMPLATES = {
  strongHire: [
    "You demonstrated comprehensive subject mastery and structured communication throughout the interview.",
    "Your responses consistently provided concrete evidence, clear ownership, and role-appropriate depth.",
    "Technical fundamentals and situational instincts are well aligned with target expectations.",
  ],
  hire: [
    "You presented solid competence with clear explanations and good contextual awareness.",
    "Most answers effectively addressed the core questions with sound reasoning.",
    "Minor refinements in structuring complex technical details will elevate your performance even further.",
  ],
  leanHire: [
    "You showed acceptable foundational knowledge with several strong points.",
    "Some answers were slightly generic or missed key technical nuances.",
    "Focusing on the STAR method and explicit real-world examples will strengthen your impact.",
  ],
  leanNoHire: [
    "Your preparation has a good starting foundation, but several responses lacked necessary depth.",
    "Key concepts were partially incomplete or hesitant in execution.",
    "Structured review of foundational topics and targeted mock practice is recommended.",
  ],
  noHire: [
    "Responses were frequently off-target or incomplete for the chosen role and level.",
    "Fundamental concepts require focused study before progressing to live hiring rounds.",
    "We recommend following a structured learning roadmap and practicing with the question bank.",
  ],
  notEnoughAnswers: "You ended the interview before answering enough questions for a formal hiring recommendation. Complete at least half the questions in your next session to receive an in-depth evaluation.",
};
