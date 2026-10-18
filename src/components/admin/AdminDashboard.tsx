"use client";

import React, { useState } from "react";
import { UserData } from "@/types/user";
import { UserRole, AdminTab } from "@/constants/roles";
import { SEED_SCHOLARSHIP_SCHEMES } from "@/constants/seedScholarships";
import AdminConsole from "../scholarships/AdminConsole";
import {
  ShieldCheck,
  Terminal,
  Activity,
  Users,
  Award,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

interface AdminDashboardProps {
  user: UserData | null;
  onNavigateToSection: (sectionId: string) => void;
}

export default function AdminDashboard({ user, onNavigateToSection }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.OVERVIEW);

  const staleCount = SEED_SCHOLARSHIP_SCHEMES.filter((scheme) => {
    if (!scheme.lastVerifiedDate) return true;
    const diffDays = (Date.now() - new Date(scheme.lastVerifiedDate).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 90;
  }).length;

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 animate-fade-in text-gray-800">
      {/* Super Admin Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white rounded-2xl shadow-xl border border-purple-900/50 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold border border-purple-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>SUPER ADMIN PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Administrative Control Center
            </h1>
            <p className="text-sm text-purple-200/80 max-w-xl">
              Logged in as <strong className="text-white">{user?.name || "Super Admin"}</strong> ({user?.email || "admin"}).
              You have full administrative privileges to simulate rules, audit schemes, and monitor platform health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToSection("dashboard")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/20 transition-all shadow-sm active:scale-95"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Preview Student App</span>
            </button>
            <button
              onClick={() => handleTabChange(AdminTab.SCHEMES)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95"
            >
              <Terminal className="w-4 h-4" />
              <span>Rule Engine Simulator</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative background circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => handleTabChange(AdminTab.OVERVIEW)}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === AdminTab.OVERVIEW
              ? "bg-purple-900 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Overview</span>
        </button>
        <button
          onClick={() => handleTabChange(AdminTab.SCHEMES)}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === AdminTab.SCHEMES
              ? "bg-purple-900 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Rule Engine & Simulator</span>
        </button>
      </div>

      {/* Tab 1: System Overview */}
      {activeTab === AdminTab.OVERVIEW && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Total Schemes</p>
                <h3 className="text-2xl font-bold text-gray-900">{SEED_SCHOLARSHIP_SCHEMES.length}</h3>
                <p className="text-[11px] text-emerald-600 font-medium">All database active</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Verified Schemes</p>
                <h3 className="text-2xl font-bold text-gray-900">{SEED_SCHOLARSHIP_SCHEMES.length - staleCount}</h3>
                <p className="text-[11px] text-gray-500 font-medium">Verified by Admin Team</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Stale Verification</p>
                <h3 className="text-2xl font-bold text-gray-900">{staleCount}</h3>
                <p className="text-[11px] text-amber-600 font-medium">Over 90 days ago</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Admin Role</p>
                <h3 className="text-2xl font-bold text-purple-700">SUPER</h3>
                <p className="text-[11px] text-gray-500 font-medium">Full RLS Bypass</p>
              </div>
            </div>
          </div>

          {/* Administrative Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rule Engine Simulator Card */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-6 flex flex-col justify-between hover:border-purple-300 transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Spec 3.9 Compliance Console
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Interactive rule testing engine. Test student profiles (income, category, state, marks)
                  against scholarship schemes, analyze pass/fail criteria, and inspect verification staleness.
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-600">Simulate Criteria</span>
                <button
                  onClick={() => handleTabChange(AdminTab.SCHEMES)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition"
                >
                  <span>Open Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Access to Public & Student Screens */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-6 flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Student Screens & Modules Audit
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Navigate directly to public student interfaces to audit and inspect user experience,
                  real-time AI interview engines, and resume builder tools.
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-gray-100 flex flex-wrap gap-2">
                <button
                  onClick={() => onNavigateToSection("scholarships")}
                  className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
                >
                  Scholarships
                </button>
                <button
                  onClick={() => onNavigateToSection("resume")}
                  className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
                >
                  Resume Builder
                </button>
                <button
                  onClick={() => onNavigateToSection("interview")}
                  className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
                >
                  AI Interview
                </button>
                <button
                  onClick={() => onNavigateToSection("learn")}
                  className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
                >
                  Practice Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rule Engine Simulator */}
      {activeTab === AdminTab.SCHEMES && (
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-4 sm:p-6">
          <AdminConsole schemes={SEED_SCHOLARSHIP_SCHEMES} />
        </div>
      )}
    </div>
  );
}
