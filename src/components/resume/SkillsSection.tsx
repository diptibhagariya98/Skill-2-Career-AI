"use client";

import React, { useState } from "react";
import { SkillsData, SkillGroup } from "@/types/resume";
import { Plus, Trash2, X, Sparkles, ChevronDown, Edit2 } from "lucide-react";

interface SkillsSectionProps {
  skills: SkillsData;
  onChange: (updated: SkillsData) => void;
}

const getCategoryPlaceholder = (groupName: string) => {
  const n = (groupName || "").toLowerCase();
  if (n.includes("tool") || n.includes("framework") || n.includes("devops") || n.includes("platform")) {
    return "Add tool (e.g. Git, Docker, AWS)";
  }
  if (n.includes("language") || n.includes("tech") || n.includes("backend") || n.includes("frontend")) {
    return "Add tech (e.g. TypeScript, SQL)";
  }
  if (n.includes("soft") || n.includes("interpersonal") || n.includes("people") || n.includes("communication")) {
    return "Add soft skill (e.g. Leadership, Mentoring)";
  }
  if (n.includes("design") || n.includes("ui") || n.includes("ux")) {
    return "Add design skill (e.g. Figma, Wireframing)";
  }
  if (n.includes("method") || n.includes("process") || n.includes("agile")) {
    return "Add methodology (e.g. Agile, CI/CD)";
  }
  return "Add a skill (e.g. Strategic Planning)";
};

export default function SkillsSection({ skills, onChange }: SkillsSectionProps) {
  const [newTagInput, setNewTagInput] = useState<{ [groupId: string]: string }>({});
  const [flatTagInput, setFlatTagInput] = useState("");
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [showAtsDetails, setShowAtsDetails] = useState(false);

  const handleToggleGrouped = (isGrouped: boolean) => {
    onChange({
      ...skills,
      isGrouped,
    });
  };

  // Grouped mode actions
  const handleAddGroup = () => {
    const newGroup: SkillGroup = {
      id: `grp_${Date.now()}`,
      name: "Tools & Technologies",
      skills: [],
    };
    onChange({
      ...skills,
      groups: [...skills.groups, newGroup],
    });
  };

  const handleUpdateGroupName = (groupId: string, name: string) => {
    onChange({
      ...skills,
      groups: skills.groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
    });
  };

  const handleRemoveGroup = (groupId: string) => {
    onChange({
      ...skills,
      groups: skills.groups.filter((g) => g.id !== groupId),
    });
  };

  const handleAddSkillToGroup = (groupId: string) => {
    const raw = (newTagInput[groupId] || "").trim();
    if (!raw) return;

    // Split by commas if multiple entered
    const tokens = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const grp = skills.groups.find((g) => g.id === groupId);
    if (!grp) return;

    const currentSkills = new Set(grp.skills);
    tokens.forEach((t) => currentSkills.add(t));

    onChange({
      ...skills,
      groups: skills.groups.map((g) =>
        g.id === groupId ? { ...g, skills: Array.from(currentSkills) } : g
      ),
    });

    setNewTagInput({ ...newTagInput, [groupId]: "" });
  };

  const handleRemoveSkillFromGroup = (groupId: string, skillText: string) => {
    onChange({
      ...skills,
      groups: skills.groups.map((g) =>
        g.id === groupId ? { ...g, skills: g.skills.filter((s) => s !== skillText) } : g
      ),
    });
  };

  // Flat mode actions
  const handleAddFlatSkill = () => {
    const raw = flatTagInput.trim();
    if (!raw) return;
    const tokens = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const current = new Set(skills.flatList || []);
    tokens.forEach((t) => current.add(t));
    onChange({
      ...skills,
      flatList: Array.from(current),
    });
    setFlatTagInput("");
  };

  const handleRemoveFlatSkill = (skillText: string) => {
    onChange({
      ...skills,
      flatList: (skills.flatList || []).filter((s) => s !== skillText),
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Section Header */}
      <div className="flex flex-col gap-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Skills</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Keywords matched against applicant tracking systems. Clean text tokens without graphical score meters.
          </p>
        </div>

        {/* Grouped vs Flat Toggle - Full width on mobile with > 4.5:1 text contrast */}
        <div className="w-full grid grid-cols-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => handleToggleGrouped(true)}
            className={`py-1.5 sm:py-2 text-center text-xs sm:text-sm font-bold rounded-lg transition min-h-[38px] ${
              skills.isGrouped
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Categorized
          </button>
          <button
            type="button"
            onClick={() => handleToggleGrouped(false)}
            className={`py-1.5 sm:py-2 text-center text-xs sm:text-sm font-bold rounded-lg transition min-h-[38px] ${
              !skills.isGrouped
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Flat List
          </button>
        </div>
      </div>

      {skills.isGrouped ? (
        /* Categorized Groups */
        <div className="space-y-3 sm:space-y-4">
          {skills.groups.map((grp) => (
            <div
              key={grp.id}
              className="bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3"
            >
              {/* Category Header with Editable Title and 48px Touch Target Delete */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={grp.name}
                    onChange={(e) => handleUpdateGroupName(grp.id, e.target.value)}
                    className="font-bold text-sm sm:text-base text-gray-900 bg-transparent hover:bg-gray-50 focus:bg-white border-b border-dashed border-gray-300 focus:border-indigo-600 rounded px-1.5 py-1 focus:outline-none transition w-full max-w-[260px] truncate"
                    title="Tap to rename category"
                  />
                  <Edit2 className="h-3.5 w-3.5 text-gray-400 shrink-0 hidden sm:inline" />
                </div>

                {confirmDeleteGroupId === grp.id ? (
                  <div className="flex items-center gap-1.5 shrink-0 animate-fade-in">
                    <span className="text-xs text-red-600 font-bold hidden sm:inline">Delete?</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleRemoveGroup(grp.id);
                        setConfirmDeleteGroupId(null);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold min-h-[40px]"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteGroupId(null)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold min-h-[40px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteGroupId(grp.id)}
                    className="min-h-[48px] min-w-[48px] p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition shrink-0"
                    title="Remove category"
                    aria-label="Remove category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Tag Badges or Empty Hint */}
              {grp.skills.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-0.5">No skills added yet</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {grp.skills.map((sText) => (
                    <span
                      key={sText}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100"
                    >
                      {sText}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillFromGroup(grp.id, sText)}
                        className="text-indigo-400 hover:text-indigo-800 p-0.5"
                        aria-label={`Remove ${sText}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Input for Group with Comma support & Disabled Add Button */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder={getCategoryPlaceholder(grp.name)}
                  value={newTagInput[grp.id] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes(",")) {
                      const tokens = val.split(",").map((s) => s.trim()).filter(Boolean);
                      if (tokens.length > 0) {
                        const currentSkills = new Set(grp.skills);
                        tokens.forEach((t) => currentSkills.add(t));
                        onChange({
                          ...skills,
                          groups: skills.groups.map((g) =>
                            g.id === grp.id ? { ...g, skills: Array.from(currentSkills) } : g
                          ),
                        });
                        setNewTagInput({ ...newTagInput, [grp.id]: "" });
                        return;
                      }
                    }
                    setNewTagInput({ ...newTagInput, [grp.id]: val });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkillToGroup(grp.id);
                    }
                  }}
                  enterKeyHint="done"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
                />
                <button
                  type="button"
                  disabled={!(newTagInput[grp.id] || "").trim()}
                  onClick={() => handleAddSkillToGroup(grp.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition min-h-[42px] flex items-center justify-center shrink-0 shadow-xs"
                >
                  Add
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddGroup}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-xs sm:text-sm font-semibold text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-2 min-h-[48px] bg-white hover:bg-gray-50 shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add Skill Category
          </button>
        </div>
      ) : (
        /* Flat List Mode */
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {(skills.flatList || []).length === 0 ? (
            <p className="text-xs text-gray-400 italic">No skills added yet</p>
          ) : (
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {(skills.flatList || []).map((sText) => (
                <span
                  key={sText}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-100"
                >
                  {sText}
                  <button
                    type="button"
                    onClick={() => handleRemoveFlatSkill(sText)}
                    className="text-indigo-400 hover:text-indigo-800"
                    aria-label={`Remove ${sText}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add skills (e.g. Python, SQL, Docker)"
              value={flatTagInput}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes(",")) {
                  const tokens = val.split(",").map((s) => s.trim()).filter(Boolean);
                  if (tokens.length > 0) {
                    const current = new Set(skills.flatList || []);
                    tokens.forEach((t) => current.add(t));
                    onChange({
                      ...skills,
                      flatList: Array.from(current),
                    });
                    setFlatTagInput("");
                    return;
                  }
                }
                setFlatTagInput(val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddFlatSkill();
                }
              }}
              enterKeyHint="done"
              className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
            <button
              type="button"
              disabled={!flatTagInput.trim()}
              onClick={handleAddFlatSkill}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition min-h-[44px] shrink-0 shadow-xs"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Collapsible ATS Rule Callout to avoid duplicate messaging */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 sm:p-4 text-xs text-gray-600">
        <button
          type="button"
          onClick={() => setShowAtsDetails(!showAtsDetails)}
          className="w-full flex items-center justify-between font-bold text-gray-800 text-left min-h-[32px]"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
            ATS Rule Compliant Guidelines
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              showAtsDetails ? "rotate-180" : ""
            }`}
          />
        </button>
        {showAtsDetails && (
          <p className="mt-2 text-gray-600 leading-relaxed border-t border-gray-200 pt-2">
            All skills are rendered as plain, searchable text tokens. Graphic proficiency stars, dots, or percentages are excluded because ATS parsers cannot interpret visual score meters.
          </p>
        )}
      </div>
    </div>
  );
}
