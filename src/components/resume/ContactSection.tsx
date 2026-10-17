"use client";

import React from "react";
import { ContactInfo } from "@/types/resume";
import { normalizeUrl } from "@/lib/resume/validation";
import { Mail, Phone, MapPin, Globe, Link2, User, Briefcase, Plus, Trash2 } from "lucide-react";
 

interface ContactSectionProps {
  data: ContactInfo;
  onChange: (updated: ContactInfo) => void;
}

export default function ContactSection({ data, onChange }: ContactSectionProps) {
  const updateField = <K extends keyof ContactInfo>(field: K, value: ContactInfo[K]) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleAddCustomLink = () => {
    const currentLinks = data.links || [];
    const newLink = {
      id: `link_${Date.now()}`,
      label: "Portfolio",
      url: "",
    };
    updateField("links", [...currentLinks, newLink]);
  };

  const handleUpdateCustomLink = (id: string, key: "label" | "url", val: string) => {
    const updated = (data.links || []).map((lnk) =>
      lnk.id === id ? { ...lnk, [key]: val } : lnk
    );
    updateField("links", updated);
  };

  const handleRemoveCustomLink = (id: string) => {
    updateField("links", (data.links || []).filter((lnk) => lnk.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          ATS parsers look for your full name, email, and location right at the top of page 1.
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-gray-800 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="fullName"
              placeholder="e.g., Alex Morgan"
              value={data.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Headline */}
        <div>
          <label htmlFor="headline" className="block text-sm font-semibold text-gray-800 mb-1">
            Target Job Title / Headline
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="headline"
              placeholder="e.g., Senior Full Stack Engineer"
              value={data.headline || ""}
              onChange={(e) => updateField("headline", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                id="email"
                autoCapitalize="none"
                placeholder="name@example.com"
                value={data.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                id="phone"
                placeholder="+91 98765 43210"
                value={data.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Location: City, State, Country */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-semibold text-gray-800 mb-1">
              City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="city"
                placeholder="e.g., Bengaluru"
                value={data.city || ""}
                onChange={(e) => updateField("city", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-semibold text-gray-800 mb-1">
              State / Region
            </label>
            <input
              type="text"
              id="state"
              placeholder="e.g., Karnataka"
              value={data.state || ""}
              onChange={(e) => updateField("state", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-semibold text-gray-800 mb-1">
              Country
            </label>
            <input
              type="text"
              id="country"
              placeholder="e.g., India"
              value={data.country || ""}
              onChange={(e) => updateField("country", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Links: Website, LinkedIn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="linkedin" className="block text-sm font-semibold text-gray-800 mb-1">
              LinkedIn URL
            </label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="url"
                id="linkedin"
                autoCapitalize="none"
                placeholder="https://linkedin.com/in/username"
                value={data.linkedin || ""}
                onChange={(e) => updateField("linkedin", e.target.value)}
                onBlur={(e) => updateField("linkedin", normalizeUrl(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-semibold text-gray-800 mb-1">
              Portfolio / Personal Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="url"
                id="website"
                autoCapitalize="none"
                placeholder="https://yourportfolio.com"
                value={data.website || ""}
                onChange={(e) => updateField("website", e.target.value)}
                onBlur={(e) => updateField("website", normalizeUrl(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Additional Custom Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-800">Additional Profiles (GitHub, Medium, etc.)</span>
            <button
              type="button"
              onClick={handleAddCustomLink}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="h-3.5 w-3.5" /> Add Link
            </button>
          </div>
          {(data.links || []).map((lnk) => (
            <div key={lnk.id} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Label (e.g., GitHub)"
                value={lnk.label}
                onChange={(e) => handleUpdateCustomLink(lnk.id, "label", e.target.value)}
                className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="url"
                placeholder="https://..."
                autoCapitalize="none"
                value={lnk.url}
                onChange={(e) => handleUpdateCustomLink(lnk.id, "url", e.target.value)}
                onBlur={(e) => handleUpdateCustomLink(lnk.id, "url", normalizeUrl(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleRemoveCustomLink(lnk.id)}
                className="p-2 text-red-500 hover:text-red-700"
                title="Remove link"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Work Authorization Note */}
        <div>
          <label htmlFor="workAuth" className="block text-sm font-semibold text-gray-800 mb-1">
            Work Authorization (Optional)
          </label>
          <input
            type="text"
            id="workAuth"
            placeholder="e.g., Authorized to work in India / US Green Card"
            value={data.workAuthorization || ""}
            onChange={(e) => updateField("workAuthorization", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
          />
        </div>
      </div>
    </div>
  );
}
