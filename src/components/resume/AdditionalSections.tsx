"use client";

import React from "react";
import {
  ResumeData,
  LanguageItem,
  AwardItem,
  VolunteerItem,
} from "@/types/resume";
import { Plus, Trash2, Globe2, Award, HeartHandshake, UserCheck } from "lucide-react";

interface AdditionalSectionsProps {
  sectionKey: "languages" | "awards" | "volunteer" | "references";
  resume: ResumeData;
  onChange: (updated: ResumeData) => void;
}

export default function AdditionalSections({
  sectionKey,
  resume,
  onChange,
}: AdditionalSectionsProps) {
  // 1. LANGUAGES
  if (sectionKey === "languages") {
    const items = resume.languages || [];
    const handleAdd = () => {
      const newItem: LanguageItem = {
        id: `lang_${Date.now()}`,
        language: "",
        proficiency: "conversational",
      };
      onChange({ ...resume, languages: [...items, newItem] });
    };

    const handleUpdate = (id: string, updates: Partial<LanguageItem>) => {
      onChange({
        ...resume,
        languages: items.map((it) => (it.id === id ? { ...it, ...updates } : it)),
      });
    };

    const handleDelete = (id: string) => {
      onChange({ ...resume, languages: items.filter((it) => it.id !== id) });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Languages</h2>
            <p className="text-sm text-gray-500 mt-1">
              Spoken languages and proficiency levels (plain text, no graphics).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Add Language
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-6">
            <Globe2 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No languages added yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Add English, Hindi, French, Spanish, or other languages you speak.
            </p>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Add Language
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                <input
                  type="text"
                  placeholder="e.g., English"
                  value={it.language}
                  onChange={(e) => handleUpdate(it.id, { language: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
                <select
                  value={it.proficiency}
                  onChange={(e) => handleUpdate(it.id, { proficiency: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                >
                  <option value="native">Native / Bilingual</option>
                  <option value="fluent">Fluent</option>
                  <option value="professional">Professional Working</option>
                  <option value="conversational">Conversational</option>
                  <option value="basic">Elementary / Basic</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleDelete(it.id)}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. AWARDS
  if (sectionKey === "awards") {
    const items = resume.awards || [];
    const handleAdd = () => {
      const newItem: AwardItem = {
        id: `award_${Date.now()}`,
        title: "",
        issuer: "",
        date: "",
        description: "",
      };
      onChange({ ...resume, awards: [...items, newItem] });
    };

    const handleUpdate = (id: string, updates: Partial<AwardItem>) => {
      onChange({
        ...resume,
        awards: items.map((it) => (it.id === id ? { ...it, ...updates } : it)),
      });
    };

    const handleDelete = (id: string) => {
      onChange({ ...resume, awards: items.filter((it) => it.id !== id) });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Awards & Honours</h2>
            <p className="text-sm text-gray-500 mt-1">
              Hackathon wins, academic accolades, corporate honors, or merit list rankings.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Add Award
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-6">
            <Award className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No awards listed</p>
            <button
              type="button"
              onClick={handleAdd}
              className="mt-3 inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Plus className="h-4 w-4" /> Add Award
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <input
                    type="text"
                    placeholder="Award Title (e.g. 1st Place National Hackathon)"
                    value={it.title}
                    onChange={(e) => handleUpdate(it.id, { title: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(it.id)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Issuer / Organization"
                    value={it.issuer}
                    onChange={(e) => handleUpdate(it.id, { issuer: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Year (e.g. 2024)"
                    value={it.date || ""}
                    onChange={(e) => handleUpdate(it.id, { date: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 3. VOLUNTEER
  if (sectionKey === "volunteer") {
    const items = resume.volunteer || [];
    const handleAdd = () => {
      const newItem: VolunteerItem = {
        id: `vol_${Date.now()}`,
        organization: "",
        role: "",
        bullets: [""],
      };
      onChange({ ...resume, volunteer: [...items, newItem] });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Volunteer Experience</h2>
            <p className="text-sm text-gray-500 mt-1">Community engagement, student clubs, or pro-bono work.</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Add Volunteer
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-6">
            <HeartHandshake className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No volunteer experience added</p>
            <button
              type="button"
              onClick={handleAdd}
              className="mt-3 inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Plus className="h-4 w-4" /> Add Volunteer
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <input
                    type="text"
                    placeholder="Organization Name"
                    value={it.organization}
                    onChange={(e) =>
                      onChange({
                        ...resume,
                        volunteer: items.map((v) =>
                          v.id === it.id ? { ...v, organization: e.target.value } : v
                        ),
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...resume,
                        volunteer: items.filter((v) => v.id !== it.id),
                      })
                    }
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Role (e.g. Youth Mentor / Community Volunteer)"
                  value={it.role}
                  onChange={(e) =>
                    onChange({
                      ...resume,
                      volunteer: items.map((v) =>
                        v.id === it.id ? { ...v, role: e.target.value } : v
                      ),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 4. REFERENCES
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">References</h2>
        <p className="text-sm text-gray-500 mt-1">
          Standard ATS best practice is stating &quot;Available upon request&quot; unless explicit referees are requested.
        </p>
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700">Reference Note</label>
        <textarea
          rows={3}
          value={resume.referencesText}
          onChange={(e) => onChange({ ...resume, referencesText: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl text-sm"
          placeholder="Available upon request."
        />
      </div>
    </div>
  );
}
