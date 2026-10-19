"use client";

import React, { useState } from "react";
import { ContactInfo } from "@/types/resume";
import { normalizeUrl, isValidEmail, isValidPhone } from "@/lib/resume/validation";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Link2,
  User,
  Briefcase,
  Plus,
  Trash2,
  Building,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

interface ContactSectionProps {
  data: ContactInfo;
  onChange: (updated: ContactInfo) => void;
}

export default function ContactSection({ data, onChange }: ContactSectionProps) {
  // Track touched state for field-level error validation (no error before first touch)
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLocationOpen, setIsLocationOpen] = useState(true);
  const [isLinksOpen, setIsLinksOpen] = useState(true);

  const updateField = <K extends keyof ContactInfo>(field: K, value: ContactInfo[K]) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Validation states
  const fullNameError =
    touched.fullName && !data.fullName?.trim() ? "Full name is required." : null;

  const emailError =
    touched.email &&
    (!data.email?.trim()
      ? "Email address is required."
      : !isValidEmail(data.email)
      ? "Please enter a valid email address."
      : null);

  const phoneError =
    touched.phone && data.phone && !isValidPhone(data.phone)
      ? "Please enter a valid phone number (7-15 digits)."
      : null;

  // Custom Links handlers
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
    <div className="space-y-4 sm:space-y-6">
      {/* CARD 1: Personal Details */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden transition-all">
        {/* Card Header */}
        <div className="p-4 sm:p-5 flex items-center gap-3.5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
              Personal Details
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              Your basic identity and professional title
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Full Name Field */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
                <User className="h-4.5 w-4.5" />
              </div>
              <input
                type="text"
                id="fullName"
                autoComplete="name"
                autoCapitalize="words"
                placeholder="e.g., Alex Morgan"
                value={data.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                onBlur={() => markTouched("fullName")}
                className={`w-full h-12 sm:h-13 pl-10 sm:pl-11 pr-11 border rounded-xl text-sm sm:text-base text-gray-900 transition-colors placeholder:text-gray-400/80 focus:outline-none focus:ring-2 ${
                  fullNameError
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                    : "border-gray-300 hover:border-gray-400 focus:border-indigo-600 focus:ring-indigo-100"
                }`}
              />
              {data.fullName && (
                <button
                  type="button"
                  onClick={() => updateField("fullName", "")}
                  aria-label="Clear full name"
                  className="absolute right-1 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition rounded-lg active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {fullNameError && (
              <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5 ml-0.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{fullNameError}</span>
              </p>
            )}
          </div>

          {/* Headline Field */}
          <div>
            <label
              htmlFor="headline"
              className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
            >
              Target Job Title / Headline{" "}
              <span className="text-[11px] font-normal text-gray-400 ml-1">(optional)</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
              <input
                type="text"
                id="headline"
                autoCapitalize="words"
                placeholder="e.g., Senior Full Stack Engineer"
                value={data.headline || ""}
                onChange={(e) => updateField("headline", e.target.value)}
                className="w-full h-12 sm:h-13 pl-10 sm:pl-11 pr-11 border border-gray-300 hover:border-gray-400 rounded-xl text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors placeholder:text-gray-400/80"
              />
              {data.headline && (
                <button
                  type="button"
                  onClick={() => updateField("headline", "")}
                  aria-label="Clear job headline"
                  className="absolute right-1 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition rounded-lg active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1 ml-0.5">
              e.g., Software Engineer · Full Stack Developer · Recent Graduate
            </p>
          </div>

          {/* Email & Phone (Responsive Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  id="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  value={data.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  onBlur={() => markTouched("email")}
                  className={`w-full h-12 sm:h-13 pl-10 sm:pl-11 pr-11 border rounded-xl text-sm sm:text-base text-gray-900 transition-colors placeholder:text-gray-400/80 focus:outline-none focus:ring-2 ${
                    emailError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                      : "border-gray-300 hover:border-gray-400 focus:border-indigo-600 focus:ring-indigo-100"
                  }`}
                />
                {data.email && (
                  <button
                    type="button"
                    onClick={() => updateField("email", "")}
                    aria-label="Clear email"
                    className="absolute right-1 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition rounded-lg active:scale-95"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {emailError && (
                <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5 ml-0.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
              >
                Phone Number{" "}
                <span className="text-[11px] font-normal text-gray-400 ml-1">(optional)</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={data.phone || ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  onBlur={() => markTouched("phone")}
                  className={`w-full h-12 sm:h-13 pl-10 sm:pl-11 pr-11 border rounded-xl text-sm sm:text-base text-gray-900 transition-colors placeholder:text-gray-400/80 focus:outline-none focus:ring-2 ${
                    phoneError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                      : "border-gray-300 hover:border-gray-400 focus:border-indigo-600 focus:ring-indigo-100"
                  }`}
                />
                {data.phone && (
                  <button
                    type="button"
                    onClick={() => updateField("phone", "")}
                    aria-label="Clear phone"
                    className="absolute right-1 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition rounded-lg active:scale-95"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {phoneError && (
                <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5 ml-0.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{phoneError}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Location (Collapsible) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsLocationOpen(!isLocationOpen)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-gray-50/60 transition"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                Location
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Where are you currently based?
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0">
            {isLocationOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>

        {isLocationOpen && (
          <div className="p-4 sm:p-6 pt-1 sm:pt-2 border-t border-gray-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
              {/* City */}
              <div>
                <label
                  htmlFor="city"
                  className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
                >
                  City{" "}
                  <span className="text-[11px] font-normal text-gray-400 ml-1">(optional)</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    id="city"
                    autoComplete="address-level2"
                    placeholder="e.g., Bengaluru"
                    value={data.city || ""}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full h-12 sm:h-13 pl-10 sm:pl-11 pr-11 border border-gray-300 hover:border-gray-400 rounded-xl text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors placeholder:text-gray-400/80"
                  />
                  {data.city && (
                    <button
                      type="button"
                      onClick={() => updateField("city", "")}
                      aria-label="Clear city"
                      className="absolute right-1 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition rounded-lg active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* State / Region */}
              <div>
                <label
                  htmlFor="state"
                  className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
                >
                  State / Region{" "}
                  <span className="text-[11px] font-normal text-gray-400 ml-1">(optional)</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
                    <Building className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    id="state"
                    autoComplete="address-level1"
                    placeholder="e.g., Karnataka"
                    value={data.state || ""}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="w-full h-12 sm:h-13 pl-10 sm:pl-11 pr-11 border border-gray-300 hover:border-gray-400 rounded-xl text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors placeholder:text-gray-400/80"
                  />
                  {data.state && (
                    <button
                      type="button"
                      onClick={() => updateField("state", "")}
                      aria-label="Clear state"
                      className="absolute right-1 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition rounded-lg active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Country */}
              <div>
                <label
                  htmlFor="country"
                  className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
                >
                  Country{" "}
                  <span className="text-[11px] font-normal text-gray-400 ml-1">(optional)</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
                    <Globe className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    id="country"
                    autoComplete="country-name"
                    placeholder="e.g., India"
                    value={data.country || ""}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="w-full h-12 sm:h-13 pl-10 sm:pl-11 pr-11 border border-gray-300 hover:border-gray-400 rounded-xl text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors placeholder:text-gray-400/80"
                  />
                  {data.country && (
                    <button
                      type="button"
                      onClick={() => updateField("country", "")}
                      aria-label="Clear country"
                      className="absolute right-1 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition rounded-lg active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CARD 3: Professional Links & Profiles (Collapsible) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsLinksOpen(!isLinksOpen)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-gray-50/60 transition"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                Online Profiles & Links
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                LinkedIn, portfolio website, GitHub
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0">
            {isLinksOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>

        {isLinksOpen && (
          <div className="p-4 sm:p-6 pt-1 sm:pt-2 border-t border-gray-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LinkedIn URL */}
              <div>
                <label
                  htmlFor="linkedin"
                  className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
                >
                  LinkedIn Profile
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
                    <Link2 className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="url"
                    id="linkedin"
                    autoCapitalize="none"
                    placeholder="https://linkedin.com/in/username"
                    value={data.linkedin || ""}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                    onBlur={(e) => updateField("linkedin", normalizeUrl(e.target.value))}
                    className="w-full h-12 sm:h-13 pl-10 sm:pl-11 pr-11 border border-gray-300 hover:border-gray-400 rounded-xl text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors placeholder:text-gray-400/80"
                  />
                  {data.linkedin && (
                    <button
                      type="button"
                      onClick={() => updateField("linkedin", "")}
                      aria-label="Clear LinkedIn link"
                      className="absolute right-1 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition rounded-lg active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Portfolio / Personal Website */}
              <div>
                <label
                  htmlFor="website"
                  className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
                >
                  Portfolio / Personal Website
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
                    <Globe className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="url"
                    id="website"
                    autoCapitalize="none"
                    placeholder="https://yourportfolio.com"
                    value={data.website || ""}
                    onChange={(e) => updateField("website", e.target.value)}
                    onBlur={(e) => updateField("website", normalizeUrl(e.target.value))}
                    className="w-full h-12 sm:h-13 pl-10 sm:pl-11 pr-11 border border-gray-300 hover:border-gray-400 rounded-xl text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors placeholder:text-gray-400/80"
                  />
                  {data.website && (
                    <button
                      type="button"
                      onClick={() => updateField("website", "")}
                      aria-label="Clear portfolio link"
                      className="absolute right-1 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition rounded-lg active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Links (GitHub, Behance, etc.) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs sm:text-sm font-semibold text-gray-800">
                  Additional Profiles (GitHub, Medium, etc.)
                </span>
                <button
                  type="button"
                  onClick={handleAddCustomLink}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition min-h-[36px]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Link
                </button>
              </div>

              {(data.links || []).map((lnk) => (
                <div key={lnk.id} className="flex items-center gap-2 mb-2.5">
                  <input
                    type="text"
                    placeholder="Label (e.g. GitHub)"
                    value={lnk.label}
                    onChange={(e) => handleUpdateCustomLink(lnk.id, "label", e.target.value)}
                    className="w-1/3 h-11 px-3 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    autoCapitalize="none"
                    value={lnk.url}
                    onChange={(e) => handleUpdateCustomLink(lnk.id, "url", e.target.value)}
                    onBlur={(e) =>
                      handleUpdateCustomLink(lnk.id, "url", normalizeUrl(e.target.value))
                    }
                    className="flex-1 h-11 px-3 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomLink(lnk.id)}
                    aria-label="Remove link"
                    className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    title="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Work Authorization Note */}
            <div className="pt-2 border-t border-gray-100">
              <label
                htmlFor="workAuth"
                className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
              >
                Work Authorization{" "}
                <span className="text-[11px] font-normal text-gray-400 ml-1">(optional)</span>
              </label>
              <input
                type="text"
                id="workAuth"
                placeholder="e.g., Authorized to work in India / US Green Card"
                value={data.workAuthorization || ""}
                onChange={(e) => updateField("workAuthorization", e.target.value)}
                className="w-full h-12 sm:h-13 px-4 border border-gray-300 hover:border-gray-400 rounded-xl text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors placeholder:text-gray-400/80"
              />
            </div>
          </div>
        )}
      </div>

      {/* QUICK TIPS: Professional Guidance Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-indigo-950">
        <Lightbulb className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-900">ATS Best Practice</p>
          <p className="text-indigo-800/90 leading-relaxed text-xs">
            Recruiters scan your name, email, and location in the first 6 seconds. Ensure your email is professional and your phone number includes the appropriate country code.
          </p>
        </div>
      </div>
    </div>
  );
}
