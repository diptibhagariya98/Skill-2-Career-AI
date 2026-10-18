"use client";

import React, { useState } from "react";
import { ProjectItem } from "@/types/resume";
import { normalizeUrl } from "@/lib/resume/validation";
import { Plus, Trash2, ChevronDown, ChevronUp, FolderGit2, Link as LinkIcon } from "lucide-react";

interface ProjectsSectionProps {
  items: ProjectItem[];
  onChange: (updated: ProjectItem[]) => void;
}

export default function ProjectsSection({ items, onChange }: ProjectsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id || null);

  const handleAddItem = () => {
    const newItem: ProjectItem = {
      id: `proj_${Date.now()}`,
      name: "",
      role: "",
      url: "",
      startMonth: "Jan",
      startYear: new Date().getFullYear().toString(),
      bullets: [""],
      technologies: [],
    };
    onChange([...items, newItem]);
    setExpandedId(newItem.id);
  };

  const handleUpdateItem = (id: string, updates: Partial<ProjectItem>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const handleDeleteItem = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  const handleAddBullet = (projId: string) => {
    const proj = items.find((it) => it.id === projId);
    if (!proj) return;
    handleUpdateItem(projId, { bullets: [...proj.bullets, ""] });
  };

  const handleUpdateBullet = (projId: string, bIndex: number, text: string) => {
    const proj = items.find((it) => it.id === projId);
    if (!proj) return;
    const nextBullets = [...proj.bullets];
    nextBullets[bIndex] = text;
    handleUpdateItem(projId, { bullets: nextBullets });
  };

  const handleRemoveBullet = (projId: string, bIndex: number) => {
    const proj = items.find((it) => it.id === projId);
    if (!proj) return;
    const nextBullets = proj.bullets.filter((_, idx) => idx !== bIndex);
    handleUpdateItem(projId, { bullets: nextBullets.length ? nextBullets : [""] });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Projects</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Showcase technical, open-source, or entrepreneurial projects that prove hands-on skills.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 sm:px-4 py-2 rounded-xl transition min-h-[38px] sm:min-h-[44px] shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-4 sm:p-6">
          <FolderGit2 className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No projects added yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Highlight portfolio projects, hackathon prototypes, or open-source libraries.
          </p>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Project
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {items.map((proj, idx) => {
            const isExpanded = expandedId === proj.id;
            return (
              <div
                key={proj.id}
                className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : proj.id)}
                  className="p-2.5 sm:p-4 bg-gray-50/70 hover:bg-gray-100/70 cursor-pointer flex items-center justify-between transition min-h-[46px] sm:min-h-[56px]"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                    <span className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-indigo-100 text-indigo-700 text-[11px] sm:text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate">{proj.name || "Untitled Project"}</h3>
                      <p className="text-[11px] sm:text-xs text-gray-500 truncate">{proj.role || "Creator / Contributor"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(proj.id)}
                      className="p-1 sm:p-2 text-red-500 hover:text-red-700 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : proj.id)}
                      className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 min-h-[32px] min-w-[32px] flex items-center justify-center"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-2.5 sm:p-5 space-y-3 sm:space-y-4 border-t border-gray-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Project Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., DevPulse Analytics"
                          value={proj.name}
                          onChange={(e) => handleUpdateItem(proj.id, { name: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                          Your Role
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Lead Developer / Creator"
                          value={proj.role || ""}
                          onChange={(e) => handleUpdateItem(proj.id, { role: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                        Live Demo / GitHub Repository URL
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 sm:left-3.5 sm:top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="url"
                          autoCapitalize="none"
                          placeholder="https://github.com/username/project"
                          value={proj.url || ""}
                          onChange={(e) => handleUpdateItem(proj.id, { url: e.target.value })}
                          onBlur={(e) => handleUpdateItem(proj.id, { url: normalizeUrl(e.target.value) })}
                          className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-800">
                          Project Highlights / Bullets
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddBullet(proj.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Bullet
                        </button>
                      </div>

                      {proj.bullets.map((bText, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-1.5 sm:gap-2">
                          <span className="text-gray-400 mt-2 text-xs font-bold shrink-0">•</span>
                          <textarea
                            rows={2}
                            placeholder="e.g., Architected a serverless background worker to process real-time notifications with AWS Lambda."
                            value={bText}
                            onChange={(e) => handleUpdateBullet(proj.id, bIdx, e.target.value)}
                            className="flex-1 p-2 sm:p-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBullet(proj.id, bIdx)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 mt-0.5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
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
