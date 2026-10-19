"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { APP_ROUTES } from "../constants/endpoints";
import { 
  Briefcase, 
  MessageSquare, 
  GraduationCap, 
  CheckCircle, 
  ArrowRight, 
  ChevronDown, 
  Mail, 
  Phone,
  Layers,
  Menu,
  X
} from "lucide-react";
import ResuMentorBrandLogo from "@/shared/ui/ResuMentorBrandLogo";

interface PillarItem {
  readonly title: string;
  readonly desc: string;
  readonly tag: string;
  readonly bg: string;
}

interface FeatureItem {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly title: string;
  readonly desc: string;
  readonly color: string;
}

interface StepItem {
  readonly step: string;
  readonly title: string;
  readonly desc: string;
}

interface BenefitItem {
  readonly title: string;
  readonly desc: string;
}

interface FaqItem {
  readonly q: string;
  readonly a: string;
}

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const toggleFaq = (index: number): void => {
    setActiveFaq((prev) => (prev === index ? null : index));
  };

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    toast.success("Thank you! Your message has been sent successfully.");
    setContactForm({ name: "", email: "", message: "" });
  };

  const steps: readonly StepItem[] = [
    {
      step: "1",
      title: "Create profile",
      desc: "Add skills, goals, and upload your resume securely."
    },
    {
      step: "2",
      title: "Discover hidden jobs",
      desc: "Get curated matches and save your picks based on AI recommendations."
    },
    {
      step: "3",
      title: "Practice interviews",
      desc: "Run AI mocks, then get scorecards and actionable tips instantly."
    },
    {
      step: "4",
      title: "Secure support",
      desc: "Check scholarship eligibility and follow the checklist for all your documents."
    }
  ];

  const pillars: readonly PillarItem[] = [
    {
      title: "AI-matched hidden jobs",
      desc: "Surfaces off-portal roles and referrals. Smart matching from your skills and resume for students.",
      tag: "For students",
      bg: "bg-teal-50/60 border-teal-100"
    },
    {
      title: "Realistic AI interview practice",
      desc: "Mock HR and technical rounds with instant rubric evaluation on content, clarity, and relevance for freshers.",
      tag: "For freshers",
      bg: "bg-indigo-50/60 border-indigo-100"
    },
    {
      title: "Easy scholarship advisor",
      desc: "Get scholarship support like MYSY—eligibility checker, document checklist, and deadline reminders.",
      tag: "Scholarship support",
      bg: "bg-amber-50/60 border-amber-100"
    }
  ];

  const features: readonly FeatureItem[] = [
    {
      icon: Briefcase,
      title: "Hidden job finder",
      desc: "Surfaces off-portal roles and referrals. Smart matching from your skills and resume.",
      color: "text-teal-600 bg-teal-50"
    },
    {
      icon: MessageSquare,
      title: "AI interview coach",
      desc: "Mock HR and technical rounds with real-time feedback on content, structure, and keyword coverage.",
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      icon: Layers,
      title: "Collaboration toolkit",
      desc: "Built-in notes, video calls, and quizzes. Create study groups and mock panels.",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: GraduationCap,
      title: "Scholarship advisor",
      desc: "Eligibility checker, document checklist, reminders. State and central schemes (starting with MYSY).",
      color: "text-amber-600 bg-amber-50"
    }
  ];

  const benefits: readonly BenefitItem[] = [
    {
      title: "Save time",
      desc: "Skip endless scrolling; get relevant roles fast with smart matching."
    },
    {
      title: "Boost confidence",
      desc: "Practice with an AI interviewer, anytime, with unbiased, instant feedback."
    },
    {
      title: "One-stop platform",
      desc: "Jobs, interviews, notes, calls, quizzes—all integrated seamlessly."
    },
    {
      title: "Scholarship-smart",
      desc: "MYSY guidance with deadlines and documents checker, so you never miss out."
    },
    {
      title: "Real-world ready",
      desc: "Build a habit of applying and practicing for a faster career launch."
    },
    {
      title: "Built for students",
      desc: "Student-first features designed specifically for Indian candidates and college ecosystems."
    }
  ];

  const faqs: readonly FaqItem[] = [
    {
      q: "Is ResuMentor free to use?",
      a: "Yes! It is free during the beta phase, and we plan to offer an affordable lifetime student plan later on."
    },
    {
      q: 'What are "hidden jobs"?',
      a: "These are jobs not listed on big public portals—including internal postings, referral roles, and early-stage startup opportunities."
    },
    {
      q: "How does the AI interview coach work?",
      a: "You participate in simulated HR and technical rounds with an AI interviewer, answering realistic questions and receiving instant rubric evaluations and model answers."
    },
    {
      q: "Which scholarships do you support?",
      a: "Currently, we support students applying for the MYSY scheme, with plans to expand to more state and central government schemes soon."
    }
  ];

  return (
    <div className="bg-white text-gray-900 min-h-dvh flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Sticky Header Navigation (UX-05 Safe Area & Responsive App Bar) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link 
              href={APP_ROUTES.HOME} 
              className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              aria-label="ResuMentor Home"
            >
              <ResuMentorBrandLogo variant="ready" colorScheme="teal" size="md" showWordmark={true} theme="light" />
            </Link>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full hidden sm:inline-block">
              + AI
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600" aria-label="Main Navigation">
            <a href="#about" className="min-h-[48px] px-3 py-2.5 inline-flex items-center rounded-lg hover:text-teal-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 transition">About</a>
            <a href="#features" className="min-h-[48px] px-3 py-2.5 inline-flex items-center rounded-lg hover:text-teal-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 transition">Features</a>
            <a href="#how-it-works" className="min-h-[48px] px-3 py-2.5 inline-flex items-center rounded-lg hover:text-teal-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 transition">How it works</a>
            <a href="#benefits" className="min-h-[48px] px-3 py-2.5 inline-flex items-center rounded-lg hover:text-teal-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 transition">Benefits</a>
            <a href="#faq" className="min-h-[48px] px-3 py-2.5 inline-flex items-center rounded-lg hover:text-teal-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 transition">FAQ</a>
            <a href="#contact" className="min-h-[48px] px-3 py-2.5 inline-flex items-center rounded-lg hover:text-teal-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 transition">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              href={APP_ROUTES.AUTH} 
              className="text-sm font-semibold text-gray-700 hover:text-teal-600 hover:bg-gray-50 min-h-[48px] px-4 py-2.5 rounded-xl transition hidden sm:inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              Sign in
            </Link>
            <Link 
              href={APP_ROUTES.AUTH} 
              className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-bold min-h-[48px] px-5 py-2.5 rounded-xl shadow-md shadow-teal-600/15 hover:shadow-teal-600/25 transition duration-150 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              Get started
            </Link>
            {/* Mobile Navigation Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden min-w-[48px] min-h-[48px] p-2.5 flex items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-1 animate-fade-in shadow-lg">
            <a 
              href="#about" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center px-4 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition"
            >
              About
            </a>
            <a 
              href="#features" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center px-4 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center px-4 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition"
            >
              How it works
            </a>
            <a 
              href="#benefits" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center px-4 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition"
            >
              Benefits
            </a>
            <a 
              href="#faq" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center px-4 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition"
            >
              FAQ
            </a>
            <a 
              href="#contact" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center px-4 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition"
            >
              Contact
            </a>
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link 
                href={APP_ROUTES.AUTH}
                onClick={() => setIsMobileMenuOpen(false)}
                className="min-h-[48px] flex items-center justify-center px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-teal-50/40 via-white to-white py-12 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(#0d9488_0.6px,transparent_0.6px)] [background-size:24px_24px] opacity-[0.15] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight">
              🎯 Find hidden jobs. <br className="hidden sm:inline" />
              <span className="text-teal-600">Crack AI interviews.</span> <br />
              Land your dream job.
            </h1>

            <p className="text-gray-600 text-base sm:text-xl mt-4 sm:mt-6 max-w-3xl mx-auto leading-relaxed font-normal">
              Built for students and job seekers. We make your career journey simple: discover off-portal jobs, practice with AI interviews, and secure scholarship support.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
              <Link 
                href={APP_ROUTES.AUTH} 
                className="w-full sm:w-auto min-h-[48px] bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-teal-600/20 hover:shadow-teal-600/35 transition flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                Get started
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
              </Link>
              <a 
                href="#features" 
                className="w-full sm:w-auto min-h-[48px] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-200 font-semibold px-8 py-3.5 rounded-xl transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                Explore features
              </a>
            </div>
          </div>
        </section>

        {/* About Section - Built for Students */}
        <section id="about" className="py-20 sm:py-24 bg-gray-50/50 border-t border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Built for students and job seekers
              </h2>
              <div className="h-1 w-12 bg-teal-600 mx-auto rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {pillars.map((pil, idx) => (
                <div 
                  key={idx} 
                  className={`p-6 sm:p-8 border rounded-2xl ${pil.bg} shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between`}
                >
                  <div className="space-y-4">
                    <span className="inline-block text-xs font-bold text-teal-800 bg-teal-100/70 px-3 py-1 rounded-full">
                      {pil.tag}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{pil.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{pil.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
                Everything you need in one place
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
                We integrate core tools to make landing your next job or scholarship straightforward.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div 
                    key={idx} 
                    className="bg-white border border-gray-100 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className={`p-3 rounded-xl inline-block ${feat.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mt-5 mb-2.5">{feat.title}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 sm:py-24 bg-gray-50/50 border-t border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
                Get career-ready in 4 simple steps
              </h2>
              <div className="h-1 w-12 bg-teal-600 mx-auto rounded" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
              {steps.map((st, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
                  <span className="absolute -top-4 -left-3 text-5xl font-black text-teal-600/10 font-mono select-none">
                    0{st.step}
                  </span>
                  <h3 className="font-bold text-base text-gray-900 mt-2 mb-2">{st.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA Link Banner */}
            <div className="mt-14 text-center">
              <Link 
                href={APP_ROUTES.AUTH} 
                className="min-h-[48px] inline-flex items-center justify-center gap-2 text-teal-700 hover:text-teal-800 font-bold group bg-teal-50 hover:bg-teal-100/70 border border-teal-200/60 px-6 py-3.5 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                Sign up → See your matches in minutes
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        </section>

        {/* Why Students Choose Us (Benefits) */}
        <section id="benefits" className="py-20 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
                Why students choose us
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">Empowering candidate confidence with local relevance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {benefits.map((ben, idx) => (
                <div 
                  key={idx} 
                  className="p-6 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition flex gap-3.5"
                >
                  <div className="text-teal-600 text-sm pt-0.5">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-1.5">{ben.title}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{ben.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions (FAQ) */}
        <section id="faq" className="py-20 sm:py-24 bg-gray-50/50 border-t border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
                Frequently asked questions
              </h2>
              <div className="h-1 w-12 bg-teal-600 mx-auto rounded" />
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                const triggerId = `faq-trigger-${idx}`;
                const panelId = `faq-panel-${idx}`;
                return (
                  <div 
                    key={idx} 
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                  >
                    <button
                      type="button"
                      id={triggerId}
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="min-h-[48px] w-full px-6 py-4.5 text-left font-bold text-gray-900 flex justify-between items-center hover:bg-gray-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-inset"
                    >
                      <span className="pr-4">{faq.q}</span>
                      <ChevronDown className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div 
                        id={panelId}
                        role="region"
                        aria-labelledby={triggerId}
                        className="px-6 pb-5 pt-1 text-gray-600 text-sm border-t border-gray-50 leading-relaxed"
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Got Questions or Suggestions (Contact) */}
        <section id="contact" className="py-20 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Details */}
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Got questions or suggestions?
              </h2>
              <p className="text-gray-600 leading-relaxed text-base">
                We would love to hear from you. Reach out via email, phone, or by submitting the contact form on this page.
              </p>
              <div className="space-y-3 pt-2">
                <a 
                  href="mailto:support@hiddenjob.ai" 
                  className="min-h-[48px] inline-flex items-center gap-3 text-teal-700 hover:text-teal-800 font-semibold px-2 -mx-2 rounded-lg hover:bg-teal-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 transition"
                >
                  <Mail className="h-5 w-5 text-teal-600 flex-shrink-0" />
                  <span>support@hiddenjob.ai</span>
                </a>
                <div className="block">
                  <a 
                    href="tel:+919975512833" 
                    className="min-h-[48px] inline-flex items-center gap-3 text-teal-700 hover:text-teal-800 font-semibold px-2 -mx-2 rounded-lg hover:bg-teal-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 transition"
                  >
                    <Phone className="h-5 w-5 text-teal-600 flex-shrink-0" />
                    <span>+91 9975512833</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Form with Explicit Accessible Labels & 16px Font Baseline */}
            <form 
              onSubmit={handleContactSubmit} 
              className="space-y-4 bg-gray-50/80 p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm"
              aria-label="Contact Form"
            >
              <div>
                <label htmlFor="contact-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Your name <span className="text-red-500">*</span>
                </label>
                <input 
                  id="contact-name"
                  name="name"
                  type="text" 
                  required 
                  autoComplete="name"
                  placeholder="e.g. John Doe"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full min-h-[48px] border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input 
                  id="contact-email"
                  name="email"
                  type="email" 
                  required 
                  autoComplete="email"
                  placeholder="e.g. john@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full min-h-[48px] border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Your message <span className="text-red-500">*</span>
                </label>
                <textarea 
                  id="contact-message"
                  name="message"
                  required 
                  rows={4} 
                  placeholder="How can we help you?"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full min-h-[100px] border border-gray-200 rounded-xl p-3.5 text-base sm:text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition resize-y"
                />
              </div>

              <button 
                type="submit" 
                className="w-full min-h-[48px] bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold py-3.5 px-6 rounded-xl transition duration-150 shadow-md shadow-teal-600/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 flex items-center justify-center"
              >
                Send message
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer (Rule 01 Tokens, Sentence Case, 48px touch targets) */}
      <footer className="border-t border-gray-800 bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ResuMentorBrandLogo variant="ready" colorScheme="teal" size="lg" showWordmark={true} theme="dark" />
              <span className="text-[11px] font-bold text-teal-300 bg-teal-950/60 border border-teal-800/80 px-2 py-0.5 rounded-full">
                + AI
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Connecting talent with hidden opportunities and next-generation AI interview preparation.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm tracking-wide">Quick links</h4>
            <ul className="space-y-1 text-sm text-gray-400 font-medium">
              <li>
                <a href="#hero" className="min-h-[44px] inline-flex items-center hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded">Home</a>
              </li>
              <li>
                <a href="#features" className="min-h-[44px] inline-flex items-center hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded">Features</a>
              </li>
              <li>
                <a href="#how-it-works" className="min-h-[44px] inline-flex items-center hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded">How it works</a>
              </li>
              <li>
                <a href="#benefits" className="min-h-[44px] inline-flex items-center hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded">Benefits</a>
              </li>
              <li>
                <a href="#faq" className="min-h-[44px] inline-flex items-center hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded">FAQ</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} ResuMentor. All rights reserved.</p>
          <p className="font-semibold text-gray-400">
            Built by Manish
          </p>
        </div>
      </footer>
    </div>
  );
}
