"use client";

import React, { useState } from "react";
import { EducationItem } from "@/types/resume";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  Undo2,
} from "lucide-react";

interface EducationSectionProps {
  items: EducationItem[];
  onChange: (updated: EducationItem[]) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 45 }, (_, i) => (new Date().getFullYear() + 6 - i).toString());

export default function EducationSection({ items, onChange }: EducationSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id || null);
  const [lastDeleted, setLastDeleted] = useState<{ item: EducationItem; index: number } | null>(null);

  const handleAddItem = () => {
    const newItem: EducationItem = {
      id: `edu_${Date.now()}`,
      institution: "",
      degree: "",
      field: "",
      location: "",
      startMonth: "Aug",
      startYear: (new Date().getFullYear() - 4).toString(),
      endMonth: "May",
      endYear: new Date().getFullYear().toString(),
      isExpected: false,
      grade: "",
      highlights: [""],
    };
    onChange([...items, newItem]);
    setExpandedId(newItem.id);
  };

  const handleUpdateItem = (id: string, updates: Partial<EducationItem>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const handleDuplicateItem = (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    const duplicated: EducationItem = {
      ...target,
      id: `edu_${Date.now()}`,
      degree: `${target.degree} (Copy)`,
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Education</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Degrees, qualifications, institutions, and academic honors.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 sm:px-4 py-2 rounded-xl transition min-h-[38px] sm:min-h-[44px] shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Education
        </button>
      </div>

      {lastDeleted && (
        <div className="bg-amber-50 border border-amber-200 p-2.5 sm:p-3 rounded-xl flex items-center justify-between text-xs text-amber-800">
          <span>
            Deleted <strong>{lastDeleted.item.degree || "Education entry"}</strong>
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
          <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No education entries added yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Add your degree, diploma, or highest qualification.
          </p>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Education
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {items.map((edu, idx) => {
            const isExpanded = expandedId === edu.id;
            return (
              <div
                key={edu.id}
                className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Header Card / Accordion Banner */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : edu.id)}
                  className="p-2.5 sm:p-4 bg-gray-50/70 hover:bg-gray-100/70 cursor-pointer flex items-center justify-between transition min-h-[46px] sm:min-h-[56px]"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                    <span className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-indigo-100 text-indigo-700 text-[11px] sm:text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                        {edu.degree || "Degree / Course"} {edu.field && `in ${edu.field}`}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                        {edu.institution || "Institution"} • {edu.startYear} - {edu.endYear || "Present"}
                        {edu.isExpected && " (Expected)"}
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
                      onClick={() => handleDuplicateItem(edu.id)}
                      className="p-1 sm:p-2 text-gray-500 hover:text-indigo-600 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(edu.id)}
                      className="p-1 sm:p-2 text-red-500 hover:text-red-700 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : edu.id)}
                      className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 min-h-[32px] min-w-[32px] flex items-center justify-center"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Fields */}
                {isExpanded && (
                  <div className="p-2.5 sm:p-5 space-y-3 sm:space-y-4 border-t border-gray-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Institution / University <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., University of Mumbai"
                          value={edu.institution}
                          onChange={(e) => handleUpdateItem(edu.id, { institution: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Degree / Qualification <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Bachelor of Technology"
                          value={edu.degree}
                          onChange={(e) => handleUpdateItem(edu.id, { degree: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Computer Science"
                          value={edu.field || ""}
                          onChange={(e) => handleUpdateItem(edu.id, { field: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Location (City, Country)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Mumbai, India"
                          value={edu.location || ""}
                          onChange={(e) => handleUpdateItem(edu.id, { location: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Grade / CGPA / Percentage
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 8.8 CGPA or 85%"
                          value={edu.grade || ""}
                          onChange={(e) => handleUpdateItem(edu.id, { grade: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
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
                            value={edu.startMonth}
                            onChange={(e) => handleUpdateItem(edu.id, { startMonth: e.target.value })}
                            className="px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white min-h-[38px] sm:min-h-[42px]"
                          >
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            value={edu.startYear}
                            onChange={(e) => handleUpdateItem(edu.id, { startYear: e.target.value })}
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
                              checked={edu.isExpected || false}
                              onChange={(e) =>
                                handleUpdateItem(edu.id, { isExpected: e.target.checked })
                              }
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            Expected Graduation
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={edu.endMonth || "May"}
                            onChange={(e) => handleUpdateItem(edu.id, { endMonth: e.target.value })}
                            className="px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white min-h-[38px] sm:min-h-[42px]"
                          >
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            value={edu.endYear || new Date().getFullYear().toString()}
                            onChange={(e) => handleUpdateItem(edu.id, { endYear: e.target.value })}
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
