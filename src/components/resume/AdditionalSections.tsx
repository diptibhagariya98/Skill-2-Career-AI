"use client";

import React, { useState } from "react";
import {
  ResumeData,
  LanguageItem,
  AwardItem,
  VolunteerItem,
  PublicationItem,
  CustomSectionItem,
} from "@/types/resume";
import {
  Plus,
  Trash2,
  Globe2,
  Award,
  HeartHandshake,
  BookOpen,
  Heart,
  FileText,
} from "lucide-react";

export type AdditionalSectionKey =
  | "languages"
  | "awards"
  | "publications"
  | "volunteer"
  | "interests"
  | "references"
  | "custom";

interface AdditionalSectionsProps {
  sectionKey: AdditionalSectionKey;
  resume: ResumeData;
  onChange: (updated: ResumeData) => void;
}

export default function AdditionalSections({
  sectionKey,
  resume,
  onChange,
}: AdditionalSectionsProps) {
  const [newInterest, setNewInterest] = useState("");

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
                  onChange={(e) =>
                    handleUpdate(it.id, {
                      proficiency: e.target.value as LanguageItem["proficiency"],
                    })
                  }
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

  // 2. AWARDS & HONOURS
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
              Hackathon wins, academic accolades, corporate honors, or merit rankings.
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
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Add competitions won, scholarships, hackathon ranks, or formal accolades.
            </p>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <input
                  type="text"
                  placeholder="Short description (e.g. Outperformed 400+ participants across 3 rounds)"
                  value={it.description || ""}
                  onChange={(e) => handleUpdate(it.id, { description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 3. PUBLICATIONS
  if (sectionKey === "publications") {
    const items = resume.publications || [];
    const handleAdd = () => {
      const newItem: PublicationItem = {
        id: `pub_${Date.now()}`,
        title: "",
        venue: "",
        date: "",
        url: "",
      };
      onChange({ ...resume, publications: [...items, newItem] });
    };

    const handleUpdate = (id: string, updates: Partial<PublicationItem>) => {
      onChange({
        ...resume,
        publications: items.map((it) => (it.id === id ? { ...it, ...updates } : it)),
      });
    };

    const handleDelete = (id: string) => {
      onChange({ ...resume, publications: items.filter((it) => it.id !== id) });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Publications & Research</h2>
            <p className="text-sm text-gray-500 mt-1">
              Research papers, conference articles, patents, or published technical articles.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Add Publication
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-6">
            <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No publications listed</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Add research journals, IEEE conference papers, or technical publications.
            </p>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Plus className="h-4 w-4" /> Add Publication
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <input
                    type="text"
                    placeholder="Paper / Article Title"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Venue / Conference / Journal (e.g. IEEE Access)"
                    value={it.venue}
                    onChange={(e) => handleUpdate(it.id, { venue: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Date / Year (e.g. 2023)"
                    value={it.date || ""}
                    onChange={(e) => handleUpdate(it.id, { date: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Link / DOI URL (optional)"
                  value={it.url || ""}
                  onChange={(e) => handleUpdate(it.id, { url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 4. VOLUNTEER
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

  // 5. INTERESTS
  if (sectionKey === "interests") {
    const items = resume.interests || [];

    const handleAddInterest = () => {
      const trimmed = newInterest.trim();
      if (!trimmed || items.includes(trimmed)) return;
      onChange({ ...resume, interests: [...items, trimmed] });
      setNewInterest("");
    };

    const handleRemoveInterest = (target: string) => {
      onChange({ ...resume, interests: items.filter((i) => i !== target) });
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Interests & Hobbies</h2>
          <p className="text-sm text-gray-500 mt-1">
            Concise extracurricular interests (e.g., Open-Source Mentorship, Chess, Distance Running).
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add an interest (e.g. Autonomous Robotics)"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddInterest();
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm"
          />
          <button
            type="button"
            onClick={handleAddInterest}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition min-h-[42px]"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-6">
            <Heart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No interests added</p>
            <p className="text-xs text-gray-400 mt-1">
              Adding 2-3 genuine interests gives recruiters conversational touchpoints.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            {items.map((interest, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full transition"
              >
                <span>{interest}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="text-gray-400 hover:text-red-500 ml-1"
                  aria-label={`Remove ${interest}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 6. CUSTOM SECTIONS
  if (sectionKey === "custom") {
    const items = resume.customSections || [];

    const handleAddCustom = () => {
      const newItem: CustomSectionItem = {
        id: `custom_${Date.now()}`,
        title: "Additional Information",
        type: "bullets",
        content: [""],
      };
      onChange({ ...resume, customSections: [...items, newItem] });
    };

    const handleUpdateCustom = (id: string, updates: Partial<CustomSectionItem>) => {
      onChange({
        ...resume,
        customSections: items.map((it) => (it.id === id ? { ...it, ...updates } : it)),
      });
    };

    const handleDeleteCustom = (id: string) => {
      onChange({ ...resume, customSections: items.filter((it) => it.id !== id) });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Custom Sections</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add user-defined sections such as Patents, Workshops, or Leadership activities.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddCustom}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Add Section
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-6">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No custom sections</p>
            <button
              type="button"
              onClick={handleAddCustom}
              className="mt-3 inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Plus className="h-4 w-4" /> Add Section
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((sec) => (
              <div key={sec.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <input
                    type="text"
                    placeholder="Section Title (e.g. Patents, Workshops)"
                    value={sec.title}
                    onChange={(e) => handleUpdateCustom(sec.id, { title: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteCustom(sec.id)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Enter details or bullet content..."
                  value={Array.isArray(sec.content) ? sec.content.join("\n") : sec.content}
                  onChange={(e) =>
                    handleUpdateCustom(sec.id, {
                      content: e.target.value.split("\n"),
                      type: "bullets",
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 7. REFERENCES (Default or explicit)
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
