"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface SummarySectionProps {
  summary: string;
  onChange: (updated: string) => void;
}

export default function SummarySection({ summary, onChange }: SummarySectionProps) {
  const charCount = summary.length;
  const isOverLimit = charCount > 600;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Professional Summary</h2>
        <p className="text-sm text-gray-500 mt-1">
          A concise 2 to 4 sentence snapshot highlighting your core expertise, key achievements, and value proposition.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-gray-600">Executive Summary</span>
          <span className={isOverLimit ? "text-amber-600 font-bold" : "text-gray-400"}>
            {charCount} / 600 characters {isOverLimit && "(recommended soft limit exceeded)"}
          </span>
        </div>

        <textarea
          rows={6}
          placeholder="e.g., Results-driven Full Stack Engineer with 5+ years of experience designing scalable microservices and high-performance web applications. Specialized in TypeScript, React, and Node.js with a proven track record of boosting system throughput by 40%..."
          value={summary}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full p-4 border rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed ${
            isOverLimit ? "border-amber-400" : "border-gray-300"
          }`}
        />

        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-xs text-indigo-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-indigo-800">
            <Sparkles className="h-4 w-4 text-indigo-600" /> Writing Tips:
          </p>
          <ul className="list-disc list-inside space-y-1 text-indigo-800/80 pl-1">
            <li>Lead with your target title and total years of focused experience.</li>
            <li>Highlight 2-3 strongest technical or industry domains.</li>
            <li>Quantify at least one notable achievement (e.g., &quot;boosted retention by 25%&quot;).</li>
            <li>Keep it between 50 to 90 words for maximum ATS readability.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
