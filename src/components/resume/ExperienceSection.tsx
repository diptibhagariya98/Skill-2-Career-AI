"use client";

import React, { useState } from "react";
import { WorkExperienceItem } from "@/types/resume";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Briefcase,
  Undo2,
} from "lucide-react";

interface ExperienceSectionProps {
  items: WorkExperienceItem[];
  onChange: (updated: WorkExperienceItem[]) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 45 }, (_, i) => (new Date().getFullYear() + 2 - i).toString());

export default function ExperienceSection({ items, onChange }: ExperienceSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id || null);
  const [lastDeleted, setLastDeleted] = useState<{ item: WorkExperienceItem; index: number } | null>(null);

  const handleAddItem = () => {
    const newItem: WorkExperienceItem = {
      id: `exp_${Date.now()}`,
      title: "",
      employer: "",
      location: "",
      employmentType: "full-time",
      startMonth: "Jan",
      startYear: new Date().getFullYear().toString(),
      isCurrent: true,
      bullets: [""],
      technologies: [],
    };
    onChange([...items, newItem]);
    setExpandedId(newItem.id);
  };

  const handleUpdateItem = (id: string, updates: Partial<WorkExperienceItem>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const handleDuplicateItem = (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    const duplicated: WorkExperienceItem = {
      ...target,
      id: `exp_${Date.now()}`,
      title: `${target.title} (Copy)`,
    };
    const idx = items.findIndex((it) => it.id === id);
    const next = [...items];
    next.splice(idx + 1, 0, duplicated);
    onChange(next);
    setExpandedId(duplicated.id);
  };

  const handleDeleteItem = (id: string) => {
    const idx = items.findIndex((it) => it.id === id);
    if (idx === -1) return;
    const item = items[idx];
    setLastDeleted({ item, index: idx });
    onChange(items.filter((it) => it.id !== id));
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    const next = [...items];
    next.splice(lastDeleted.index, 0, lastDeleted.item);
    onChange(next);
    setExpandedId(lastDeleted.item.id);
    setLastDeleted(null);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
  };

  // Bullet management
  const handleAddBullet = (expId: string) => {
    const exp = items.find((it) => it.id === expId);
    if (!exp) return;
    handleUpdateItem(expId, { bullets: [...exp.bullets, ""] });
  };

  const handleUpdateBullet = (expId: string, bIndex: number, text: string) => {
    const exp = items.find((it) => it.id === expId);
    if (!exp) return;
    const nextBullets = [...exp.bullets];
    nextBullets[bIndex] = text;
    handleUpdateItem(expId, { bullets: nextBullets });
  };

  const handleRemoveBullet = (expId: string, bIndex: number) => {
    const exp = items.find((it) => it.id === expId);
    if (!exp) return;
    const nextBullets = exp.bullets.filter((_, idx) => idx !== bIndex);
    handleUpdateItem(expId, { bullets: nextBullets.length ? nextBullets : [""] });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Work Experience</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            List your career milestones in reverse-chronological order with quantifiable impact.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 sm:px-4 py-2 rounded-xl transition min-h-[38px] sm:min-h-[44px] shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Experience
        </button>
      </div>

      {lastDeleted && (
        <div className="bg-amber-50 border border-amber-200 p-2.5 sm:p-3 rounded-xl flex items-center justify-between text-xs text-amber-800">
          <span>
            Deleted <strong>{lastDeleted.item.title || "Experience entry"}</strong>
          </span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:underline"
          >
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-4 sm:p-6">
          <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No work experience added yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Click below to add your first job, internship, or freelance project.
          </p>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Experience
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {items.map((exp, idx) => {
            const isExpanded = expandedId === exp.id;
            return (
              <div
                key={exp.id}
                className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Header Card / Accordion Banner */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  className="p-2.5 sm:p-4 bg-gray-50/70 hover:bg-gray-100/70 cursor-pointer flex items-center justify-between transition min-h-[46px] sm:min-h-[56px]"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                    <span className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-indigo-100 text-indigo-700 text-[11px] sm:text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                        {exp.title || "Untitled Role"}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                        {exp.employer || "Employer"} • {exp.startMonth} {exp.startYear} -{" "}
                        {exp.isCurrent ? "Present" : `${exp.endMonth || ""} ${exp.endYear || ""}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 disabled:opacity-30 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 disabled:opacity-30 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateItem(exp.id)}
                      className="p-1 sm:p-2 text-gray-500 hover:text-indigo-600 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(exp.id)}
                      className="p-1 sm:p-2 text-red-500 hover:text-red-700 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                      className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 min-h-[32px] min-w-[32px] flex items-center justify-center"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Form Fields */}
                {isExpanded && (
                  <div className="p-2.5 sm:p-5 space-y-3 sm:space-y-4 border-t border-gray-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Job Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Software Engineer"
                          value={exp.title}
                          onChange={(e) => handleUpdateItem(exp.id, { title: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Company / Employer <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Google or Startup Inc."
                          value={exp.employer}
                          onChange={(e) => handleUpdateItem(exp.id, { employer: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Location (City, Country)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Bengaluru, India or Remote"
                          value={exp.location || ""}
                          onChange={(e) => handleUpdateItem(exp.id, { location: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Employment Type
                        </label>
                        <select
                          value={exp.employmentType || "full-time"}
                          onChange={(e) =>
                            handleUpdateItem(exp.id, {
                              employmentType: e.target.value as WorkExperienceItem["employmentType"],
                            })
                          }
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px] bg-white"
                        >
                          <option value="full-time">Full-time</option>
                          <option value="part-time">Part-time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                          <option value="freelance">Freelance</option>
                        </select>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={exp.startMonth}
                            onChange={(e) => handleUpdateItem(exp.id, { startMonth: e.target.value })}
                            className="px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white min-h-[38px] sm:min-h-[42px]"
                          >
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            value={exp.startYear}
                            onChange={(e) => handleUpdateItem(exp.id, { startYear: e.target.value })}
                            className="px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white min-h-[38px] sm:min-h-[42px]"
                          >
                            {YEARS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] sm:text-xs font-semibold text-gray-700">
                            End Date
                          </label>
                          <label className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-600 cursor-pointer font-medium">
                            <input
                              type="checkbox"
                              checked={exp.isCurrent}
                              onChange={(e) =>
                                handleUpdateItem(exp.id, { isCurrent: e.target.checked })
                              }
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            I currently work here
                          </label>
                        </div>

                        {!exp.isCurrent && (
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={exp.endMonth || "Dec"}
                              onChange={(e) =>
                                handleUpdateItem(exp.id, { endMonth: e.target.value })
                              }
                              className="px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white min-h-[38px] sm:min-h-[42px]"
                            >
                              {MONTHS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                            <select
                              value={exp.endYear || new Date().getFullYear().toString()}
                              onChange={(e) =>
                                handleUpdateItem(exp.id, { endYear: e.target.value })
                              }
                              className="px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white min-h-[38px] sm:min-h-[42px]"
                            >
                              {YEARS.map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-800">
                          Key Achievements & Responsibilities (Recommended 3 to 6 bullets)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddBullet(exp.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Bullet
                        </button>
                      </div>

                      {exp.bullets.map((bText, bIdx) => {
                        const len = bText.length;
                        const isOver = len > 220;
                        return (
                          <div key={bIdx} className="space-y-1">
                            <div className="flex items-start gap-1.5 sm:gap-2">
                              <span className="text-gray-400 mt-2 text-xs font-bold shrink-0">•</span>
                              <textarea
                                rows={2}
                                placeholder="e.g., Spearheaded migration of database cluster, reducing API latency by 35% across 2M daily requests."
                                value={bText}
                                onChange={(e) =>
                                  handleUpdateBullet(exp.id, bIdx, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddBullet(exp.id);
                                  }
                                }}
                                className={`flex-1 p-2 sm:p-2.5 border rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                  isOver ? "border-amber-400" : "border-gray-300"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveBullet(exp.id, bIdx)}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 mt-0.5"
                                title="Delete bullet"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            {isOver && (
                              <p className="text-[10px] sm:text-[11px] text-amber-600 text-right pr-6 sm:pr-8 font-medium">
                                {len}/220 chars (concise bullets under 220 chars scan better in ATS)
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
