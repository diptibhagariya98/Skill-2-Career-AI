"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { APP_ROUTES } from "../constants/endpoints";
import { 
  Briefcase, 
  MessageSquare, 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  ChevronDown, 
  Mail, 
  Phone,
  ArrowUpRight,
  Sparkles,
  Award,
  Layers,
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const steps = [
    {
      step: "1",
      title: "Create Profile",
      desc: "Add skills, goals, and upload your resume securely."
    },
    {
      step: "2",
      title: "Discover Hidden Jobs",
      desc: "Get curated matches & save your picks based on AI recommendations."
    },
    {
      step: "3",
      title: "Practice Interviews",
      desc: "Run AI mocks; get scorecards & actionable tips instantly."
    },
    {
      step: "4",
      title: "Secure Support",
      desc: "Check MYSY eligibility; follow the checklist for all your docs."
    }
  ];

  const pillars = [
    {
      title: "AI‑matched hidden jobs",
      desc: "Surfaces off‑portal roles & referrals. Smart matching from your skills and resume for Students.",
      tag: "For Students",
      bg: "bg-teal-50/50 border-teal-100"
    },
    {
      title: "Realistic AI interview practice",
      desc: "Mock HR + technical rounds with instant rubric evaluation on content, clarity, and relevance for Freshers.",
      tag: "For Freshers",
      bg: "bg-indigo-50/50 border-indigo-100"
    },
    {
      title: "Easy scholarship advisor",
      desc: "Get scholarship support like MYSY—eligibility checker, document checklist, and reminders.",
      tag: "MYSY Support",
      bg: "bg-amber-50/50 border-amber-100"
    }
  ];

  const features = [
    {
      icon: Briefcase,
      title: "Hidden Job Finder",
      desc: "Surfaces off‑portal roles & referrals. Smart matching from your skills and resume.",
      color: "text-teal-600 bg-teal-50"
    },
    {
      icon: MessageSquare,
      title: "AI Interview Coach",
      desc: "Mock HR + technical rounds with real-time feedback on content, structure, and keyword coverage.",
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      icon: Layers,
      title: "Collaboration Toolkit",
      desc: "Built‑in Notes, Video Calls, and Quizzes. Create study groups and mock panels.",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: GraduationCap,
      title: "Scholarship Advisor",
      desc: "Eligibility checker, document checklist, reminders. State & central schemes (starting with MYSY).",
      color: "text-amber-600 bg-amber-50"
    }
  ];

  const benefits = [
    {
      title: "Save Time",
      desc: "Skip endless scrolling; get relevant roles fast with smart matching."
    },
    {
      title: "Boost Confidence",
      desc: "Practice with an AI interviewer, anytime, with unbiased, instant feedback."
    },
    {
      title: "One-Stop Platform",
      desc: "Jobs, interviews, notes, calls, quizzes—all integrated seamlessly."
    },
    {
      title: "Scholarship-Smart",
      desc: "MYSY guidance with deadlines & docs checker, so you never miss out."
    },
    {
      title: "Real-World Ready",
      desc: "Build a habit of applying + practicing for faster career launch."
    },
    {
      title: "Built in India",
      desc: "Student-first features designed specifically for local needs and ecosystem."
    }
  ];

  const faqs = [
    {
      q: "Is ResuMentor free to use?",
      a: "Yes! It is free during the beta phase, and we plan to offer an affordable lifetime student plan later on."
    },
    {
      q: "What are \"hidden jobs\"?",
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
    <div className="bg-white text-gray-900 min-h-screen font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Sticky Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-teal-600 p-2 rounded-xl text-white shadow-md shadow-teal-600/10">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
              ResuMentor <span className="text-teal-600">+ AI</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#about" className="hover:text-teal-600 transition">About</a>
            <a href="#features" className="hover:text-teal-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-teal-600 transition">How It Works</a>
            <a href="#benefits" className="hover:text-teal-600 transition">Benefits</a>
            <a href="#faq" className="hover:text-teal-600 transition">FAQ</a>
            <a href="#contact" className="hover:text-teal-600 transition">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href={APP_ROUTES.AUTH} 
              className="text-sm font-semibold text-gray-600 hover:text-teal-600 transition hidden sm:inline"
            >
              Sign In
            </Link>
            <Link 
              href={APP_ROUTES.AUTH} 
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-600/15 hover:shadow-teal-600/25 transition duration-150"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/40 via-white to-white py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(#0d9488_0.6px,transparent_0.6px)] [background-size:24px_24px] opacity-[0.15] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight">
            🎯 Find Hidden Jobs. <br className="hidden sm:inline" />
            <span className="text-teal-600">Crack AI Interviews.</span> <br />
            Land Your Dream Job.
          </h1>

          <p className="text-gray-600 text-lg sm:text-xl mt-8 max-w-3xl mx-auto leading-relaxed font-normal">
            Built for Students & Job Seekers. We make your career journey simple: find off-portal jobs, practice with AI interviews, and secure scholarship support.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href={APP_ROUTES.AUTH} 
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-teal-600/20 hover:shadow-teal-600/35 transition flex items-center justify-center gap-2 group"
            >
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
            </Link>
            <a 
              href="#features" 
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold px-8 py-4 rounded-xl transition flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* About Section - Built for Students */}
      <section id="about" className="py-24 bg-gray-50/50 border-t border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Built for Students & Job Seekers
            </h2>
            <div className="h-1 w-12 bg-teal-600 mx-auto rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((pil, idx) => (
              <div 
                key={idx} 
                className={`p-8 border rounded-2xl ${pil.bg} shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between`}
              >
                <div className="space-y-4">
                  <span className="inline-block text-xs font-bold text-teal-700 bg-teal-100/60 px-3 py-1 rounded-full">
                    {pil.tag}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">{pil.title}</h3>
                  <p className="text-gray-655 text-sm leading-relaxed">{pil.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Everything You Need in One Place (Features) */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Everything you need in one place
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              We integrate core tools to make landing your next job or scholarship straightforward.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className={`p-3 rounded-xl inline-block ${feat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">{feat.title}</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Get Career-Ready in 4 Steps */}
      <section id="how-it-works" className="py-24 bg-gray-50/50 border-t border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Get career‑ready in 4 simple steps
            </h2>
            <div className="h-1 w-12 bg-teal-600 mx-auto rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {steps.map((st, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
                <span className="absolute -top-4 -left-3 text-5xl font-black text-teal-600/10 font-mono">
                  0{st.step}
                </span>
                <h3 className="font-bold text-base text-gray-900 mt-2 mb-2">{st.title}</h3>
                <p className="text-gray-600 text-xs leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Link Banner */}
          <div className="mt-16 text-center">
            <Link 
              href="/auth" 
              className="inline-flex items-center gap-2 text-teal-650 hover:text-teal-700 font-bold group bg-teal-50 px-6 py-3.5 rounded-xl transition"
            >
              Sign up → See your matches in minutes
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Students Choose Us (Benefits) */}
      <section id="benefits" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Why students choose us
            </h2>
            <p className="text-gray-500 text-sm">Empowering candidate confidence with local relevance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((ben, idx) => (
              <div 
                key={idx} 
                className="p-6 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition flex gap-3"
              >
                <div className="text-teal-600 text-sm pt-0.5">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{ben.title}</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">{ben.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section id="faq" className="py-24 bg-gray-50/50 border-t border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Frequently Asked Questions
            </h2>
            <div className="h-1 w-12 bg-teal-600 mx-auto rounded" />
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4 text-left font-bold text-gray-900 flex justify-between items-center hover:bg-gray-50 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-gray-600 text-sm border-t border-gray-50">
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
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Details */}
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Got questions or suggestions?
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We&apos;d love to hear from you. Reach out via email, phone, or by submitting the contact form on this page.
            </p>
            <div className="space-y-4 pt-4">
              <a 
                href="mailto:support@hiddenjob.ai" 
                className="flex items-center gap-3 text-teal-650 hover:text-teal-700 font-semibold"
              >
                <Mail className="h-5 w-5 text-teal-600" />
                support@hiddenjob.ai
              </a>
              <a 
                href="tel:+919975512833" 
                className="flex items-center gap-3 text-teal-650 hover:text-teal-700 font-semibold"
              >
                <Phone className="h-5 w-5 text-teal-600" />
                +91 9975512833
              </a>
            </div>
          </div>

          {/* Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); toast.success("Message sent successfully!"); }} 
            className="space-y-4 bg-gray-50 p-8 rounded-2xl border border-gray-150"
          >
            <div>
              <input 
                type="text" 
                placeholder="Your Name" 
                required 
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-gray-900"
              />
            </div>
            <div>
              <input 
                type="email" 
                placeholder="Email Address" 
                required 
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-gray-900"
              />
            </div>
            <div>
              <textarea 
                placeholder="Your Message" 
                required 
                rows={4} 
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-gray-900"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition duration-150 shadow-md shadow-teal-600/10"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-[#1f2937] text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-teal-400" />
              <span className="font-extrabold text-xl text-white">
                ResuMentor <span className="text-teal-400">+ AI</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Connecting talent with hidden opportunities and next-generation AI interview prep.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm tracking-wider uppercase">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400 font-medium">
              <li><a href="#hero" className="hover:text-white transition">Home</a></li>
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><a href="#benefits" className="hover:text-white transition">Benefits</a></li>
              <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} ResuMentor. All rights reserved.</p>
          <p className="font-semibold text-gray-400">
            Built by Saikiran Rudra
          </p>
        </div>
      </footer>
    </div>
  );
}
