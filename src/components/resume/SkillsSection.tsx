"use client";

import React, { useState } from "react";
import { SkillsData, SkillGroup } from "@/types/resume";
import { Plus, Trash2, X, Tags, Sparkles } from "lucide-react";

interface SkillsSectionProps {
  skills: SkillsData;
  onChange: (updated: SkillsData) => void;
}

export default function SkillsSection({ skills, onChange }: SkillsSectionProps) {
  const [newTagInput, setNewTagInput] = useState<{ [groupId: string]: string }>({});
  const [flatTagInput, setFlatTagInput] = useState("");

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Skills</h2>
          <p className="text-sm text-gray-500 mt-1">
            ATS engines match keywords against candidate skills. Clean tags with zero graphic rating bars.
          </p>
        </div>

        {/* Grouped vs Flat Toggle */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleToggleGrouped(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              skills.isGrouped ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Categorized
          </button>
          <button
            type="button"
            onClick={() => handleToggleGrouped(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              !skills.isGrouped ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Flat List
          </button>
        </div>
      </div>

      {skills.isGrouped ? (
        /* Categorized Groups */
        <div className="space-y-5">
          {skills.groups.map((grp) => (
            <div key={grp.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Category Name (e.g., Languages, Frameworks)"
                  value={grp.name}
                  onChange={(e) => handleUpdateGroupName(grp.id, e.target.value)}
                  className="font-bold text-sm text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none px-1 py-1 w-2/3"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(grp.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500"
                  title="Remove category"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-1.5">
                {grp.skills.map((sText) => (
                  <span
                    key={sText}
                    className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100"
                  >
                    {sText}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillFromGroup(grp.id, sText)}
                      className="text-indigo-400 hover:text-indigo-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Tag Input for Group */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Type skill & press Enter (e.g. React, Next.js, Python)"
                  value={newTagInput[grp.id] || ""}
                  onChange={(e) => setNewTagInput({ ...newTagInput, [grp.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddSkillToGroup(grp.id);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkillToGroup(grp.id)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold px-3 py-2 rounded-xl transition"
                >
                  Add
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddGroup}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-xs font-semibold text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Skill Category
          </button>
        </div>
      ) : (
        /* Flat List Mode */
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {(skills.flatList || []).map((sText) => (
              <span
                key={sText}
                className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-100"
              >
                {sText}
                <button
                  type="button"
                  onClick={() => handleRemoveFlatSkill(sText)}
                  className="text-indigo-400 hover:text-indigo-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type skills separated by commas or press Enter (e.g., Python, SQL, Docker)"
              value={flatTagInput}
              onChange={(e) => setFlatTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAddFlatSkill();
                }
              }}
              className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
            <button
              type="button"
              onClick={handleAddFlatSkill}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
            >
              Add Skills
            </button>
          </div>
        </div>
      )}

      {/* ATS Rule Callout */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs text-gray-600 flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p>
          <strong>ATS Rule Compliant:</strong> All skills are rendered as plain, searchable text tokens.
          Graphic proficiency stars, dots, or percentages are excluded because ATS parsers cannot interpret visual score meters.
        </p>
      </div>
    </div>
  );
}
