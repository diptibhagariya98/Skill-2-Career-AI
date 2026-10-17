"use client";

import React, { useState } from "react";
import { ScholarshipScheme, StudentProfile } from "../../types/scholarships";
import { evaluateScheme, isSchemeStale } from "../../lib/scholarships/engine";
import {
  Terminal,
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Code,
  Calendar,
  Layers,
} from "lucide-react";

interface AdminConsoleProps {
  schemes: ScholarshipScheme[];
}

export default function AdminConsole({ schemes }: AdminConsoleProps) {
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(schemes[0]?.id || "");
  const [testState, setTestState] = useState<string>("Gujarat");
  const [testIncome, setTestIncome] = useState<number>(500000);
  const [testScore, setTestScore] = useState<number>(85);
  const [testCategory, setTestCategory] = useState<string>("General");
  const [testGender, setTestGender] = useState<string>("female");
  const [testLevel, setTestLevel] = useState<string>("undergraduate");

  const selectedScheme = schemes.find((s) => s.id === selectedSchemeId) || schemes[0];

  const testProfile: StudentProfile = {
    domicileState: testState,
    socialCategory: testCategory as any,
    annualIncome: testIncome,
    studyLevel: testLevel as any,
    scoreType: "percentage",
    scoreValue: testScore,
    gender: testGender as any,
  };

  const startTime = typeof performance !== "undefined" ? performance.now() : 0;
  const evaluation = selectedScheme ? evaluateScheme(testProfile, selectedScheme) : null;
  const endTime = typeof performance !== "undefined" ? performance.now() : 0;
  const durationMs = (endTime - startTime).toFixed(2);

  const staleSchemes = schemes.filter((s) => isSchemeStale(s.lastVerifiedDate));

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-gray-800">
      {/* Header */}
      <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold mb-2">
            <Terminal className="w-3.5 h-3.5" /> Spec 3.9 Compliance Console
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Scheme Simulator & Rule Engine Playground</h2>
          <p className="text-xs text-gray-400 mt-1">
            Simulate rule changes against test student facts and monitor scheme verification staleness.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400">Deterministic Engine Latency:</div>
          <div className="text-xl font-mono font-bold text-emerald-400">{durationMs} ms</div>
        </div>
      </div>

      {/* Staleness Health Dashboard */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-indigo-600" /> Scheme Verification Staleness (90-Day Policy)
        </h3>
        {staleSchemes.length === 0 ? (
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All {schemes.length} schemes have been verified within the last 90 days.
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-rose-600 font-semibold">
              ⚠️ {staleSchemes.length} scheme(s) require re-verification from official sources:
            </p>
            {staleSchemes.map((s) => (
              <div key={s.id} className="p-2.5 bg-rose-50 rounded-xl text-xs flex justify-between text-rose-800">
                <span className="font-bold">{s.name}</span>
                <span>Last verified: {new Date(s.lastVerifiedDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Simulator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Input Controller */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Play className="w-4 h-4 text-indigo-600" /> Test Student Facts
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Target Scheme to Test</label>
            <select
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 bg-white"
            >
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shortName} ({s.level})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Domicile State</label>
              <input
                type="text"
                value={testState}
                onChange={(e) => setTestState(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
              <select
                value={testCategory}
                onChange={(e) => setTestCategory(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-200 text-xs bg-white"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Annual Income (₹)</label>
              <input
                type="number"
                step="50000"
                value={testIncome}
                onChange={(e) => setTestIncome(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-gray-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Score (%)</label>
              <input
                type="number"
                value={testScore}
                onChange={(e) => setTestScore(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-gray-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Gender</label>
              <select
                value={testGender}
                onChange={(e) => setTestGender(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-200 text-xs bg-white"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Study Level</label>
              <select
                value={testLevel}
                onChange={(e) => setTestLevel(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-200 text-xs bg-white"
              >
                <option value="undergraduate">Undergraduate</option>
                <option value="diploma">Diploma</option>
                <option value="postgraduate">Postgraduate</option>
                <option value="doctoral">Doctoral</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Live Evaluation Output */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600" /> Live Simulation Verdict
            </h3>
            {evaluation && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                  evaluation.classification === "eligible"
                    ? "bg-emerald-100 text-emerald-800"
                    : evaluation.classification === "check_details"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {evaluation.classification.replace("_", " ")}
              </span>
            )}
          </div>

          {evaluation && (
            <div className="space-y-3">
              <div className="space-y-2">
                {evaluation.ruleResults.map((r) => (
                  <div
                    key={r.ruleId}
                    className="p-2.5 bg-gray-50 rounded-xl text-xs flex items-start gap-2 border border-gray-200"
                  >
                    {r.status === "met" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className="font-bold text-gray-900">{r.label}</span>
                      <p className="text-gray-500 text-[11px] mt-0.5">{r.reason}</p>
                    </div>
                  </div>
                ))}
              </div>

              {evaluation.whatWouldChangeThis && (
                <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200 font-medium">
                  <strong>Hint Generated:</strong> {evaluation.whatWouldChangeThis}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
