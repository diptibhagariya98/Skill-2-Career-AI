"use client";

import React, { useState } from "react";
import {
  StudentProfile,
  SocialCategory,
  StudyLevel,
  ScoreType,
  InstitutionType,
  Gender,
  DisabilityStatus,
} from "../../types/scholarships";
import { INDIAN_STATES } from "../../constants/seedScholarships";
import {
  GraduationCap,
  IndianRupee,
  MapPin,
  Users,
  Award,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface EligibilityWizardProps {
  onEvaluate: (profile: StudentProfile) => void;
  initialProfile?: Partial<StudentProfile>;
  isSaving?: boolean;
}

const SOCIAL_CATEGORIES: SocialCategory[] = [
  "General",
  "OBC",
  "SC",
  "ST",
  "EWS",
  "Prefer not to say",
];

const STUDY_LEVELS: { label: string; value: StudyLevel }[] = [
  { label: "Class 10 / 12 School", value: "school" },
  { label: "Diploma / Polytechnic", value: "diploma" },
  { label: "Undergraduate (B.Tech / B.Sc / BA / MBBS)", value: "undergraduate" },
  { label: "Postgraduate (M.Tech / M.Sc / MBA / MD)", value: "postgraduate" },
  { label: "Doctoral / PhD", value: "doctoral" },
];

export default function EligibilityWizard({ onEvaluate, initialProfile }: EligibilityWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State with strict typing
  const [domicileState, setDomicileState] = useState<string>(initialProfile?.domicileState || "Gujarat");
  const [socialCategory, setSocialCategory] = useState<SocialCategory>(initialProfile?.socialCategory || "General");
  const [studyLevel, setStudyLevel] = useState<StudyLevel>(initialProfile?.studyLevel || "undergraduate");
  const [scoreType, setScoreType] = useState<ScoreType>(initialProfile?.scoreType || "percentage");
  const [scoreValue, setScoreValue] = useState<string>(initialProfile?.scoreValue ? String(initialProfile.scoreValue) : "82");
  const [cgpaScale, setCgpaScale] = useState<number>(initialProfile?.cgpaScale || 10);
  const [courseStream, setCourseStream] = useState<string>(initialProfile?.courseStream || "Engineering / Technology");
  const [institutionType, setInstitutionType] = useState<InstitutionType | "">(initialProfile?.institutionType || "government");
  const [annualIncome, setAnnualIncome] = useState<string>(initialProfile?.annualIncome ? String(initialProfile.annualIncome) : "450000");
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || "prefer_not_to_say");
  const [disability, setDisability] = useState<DisabilityStatus>(initialProfile?.disability || "no");

  const [validationError, setValidationError] = useState<string | null>(null);

  // Convert annual income number to formatted Indian Lakhs & Words
  const getIncomePreview = (val: string): string => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return "Please enter positive annual income";
    if (num >= 10000000) {
      const cr = num / 10000000;
      return `₹${cr.toFixed(2)} Crore / year`;
    }
    if (num >= 100000) {
      const lakhs = num / 100000;
      return `₹${lakhs.toFixed(2)} Lakh / year (₹${num.toLocaleString("en-IN")})`;
    }
    return `₹${num.toLocaleString("en-IN")} / year`;
  };

  const handleNext = () => {
    setValidationError(null);

    if (currentStep === 1) {
      if (!domicileState) {
        setValidationError("Please select your State of Domicile.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const score = parseFloat(scoreValue);
      if (isNaN(score) || score <= 0) {
        setValidationError("Please enter a valid qualifying score / result.");
        return;
      }
      if (scoreType === "percentage" && score > 100) {
        setValidationError("Percentage cannot exceed 100%.");
        return;
      }
      if (scoreType === "cgpa" && score > cgpaScale) {
        setValidationError(`CGPA cannot exceed the selected scale (${cgpaScale}).`);
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const income = parseFloat(annualIncome);
    if (isNaN(income) || income < 0) {
      setValidationError("Please enter a valid non-negative family annual income.");
      return;
    }

    const score = parseFloat(scoreValue);

    const profile: StudentProfile = {
      domicileState,
      socialCategory,
      annualIncome: income,
      studyLevel,
      scoreType,
      scoreValue: score,
      cgpaScale: scoreType === "cgpa" ? cgpaScale : undefined,
      courseStream: courseStream || undefined,
      institutionType: institutionType ? (institutionType as InstitutionType) : undefined,
      gender: gender !== "prefer_not_to_say" ? gender : undefined,
      disability,
    };

    onEvaluate(profile);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Wizard Header & Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-500 mb-3">
          <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
            <Award className="w-4 h-4" /> Eligibility Check Wizard
          </span>
          <span>Step {currentStep} of 3</span>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              currentStep >= 1 ? "bg-indigo-600" : "bg-gray-100"
            }`}
          />
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              currentStep >= 2 ? "bg-indigo-600" : "bg-gray-100"
            }`}
          />
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              currentStep >= 3 ? "bg-indigo-600" : "bg-gray-100"
            }`}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
          <span className={currentStep === 1 ? "text-indigo-600 font-bold" : ""}>1. Domicile & Category</span>
          <span className={currentStep === 2 ? "text-indigo-600 font-bold" : ""}>2. Academics & Marks</span>
          <span className={currentStep === 3 ? "text-indigo-600 font-bold" : ""}>3. Income & Demographics</span>
        </div>
      </div>

      {validationError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2 animate-fade-in">
          <HelpCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP 1: Domicile State & Social Category */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" /> State of Domicile <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Required for state-specific schemes such as Gujarat MYSY.</p>
            <select
              value={domicileState}
              onChange={(e) => setDomicileState(e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Social Category <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Used strictly for matching category-specific central & state quotas. Never shared.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SOCIAL_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSocialCategory(cat)}
                  className={`min-h-[48px] px-3 py-2.5 text-xs sm:text-sm rounded-xl border text-center font-medium transition-all ${
                    socialCategory === cat
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-sm"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              Next: Academics <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Academics & Marks */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" /> Current Level of Study <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {STUDY_LEVELS.map((lvl) => (
                <label
                  key={lvl.value}
                  className={`flex items-center min-h-[48px] p-3 rounded-xl border cursor-pointer transition ${
                    studyLevel === lvl.value
                      ? "border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="studyLevel"
                    value={lvl.value}
                    checked={studyLevel === lvl.value}
                    onChange={() => setStudyLevel(lvl.value)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 mr-3"
                  />
                  <span className="text-sm">{lvl.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-800">
                Qualifying Board Result / CGPA <span className="text-red-500">*</span>
              </label>
              <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setScoreType("percentage")}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition ${
                    scoreType === "percentage" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setScoreType("cgpa")}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition ${
                    scoreType === "cgpa" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600"
                  }`}
                >
                  CGPA
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={scoreType === "percentage" ? "100" : String(cgpaScale)}
                  value={scoreValue}
                  onChange={(e) => setScoreValue(e.target.value)}
                  placeholder={scoreType === "percentage" ? "e.g. 85.5" : "e.g. 8.5"}
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
              {scoreType === "cgpa" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Scale:</span>
                  <select
                    value={cgpaScale}
                    onChange={(e) => setCgpaScale(Number(e.target.value))}
                    className="flex-1 px-3 py-3 min-h-[48px] rounded-xl border border-gray-200 text-gray-900 bg-white font-medium"
                  >
                    <option value={10}>Out of 10.0</option>
                    <option value={4}>Out of 4.0</option>
                  </select>
                </div>
              )}
            </div>
            {scoreType === "cgpa" && (
              <p className="text-xs text-indigo-600 font-medium">
                ResuMentor automatically converts CGPA to estimated percentage using standard AICTE/UGC multiplier (x 9.5).
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Course Stream (Optional)</label>
              <input
                type="text"
                value={courseStream}
                onChange={(e) => setCourseStream(e.target.value)}
                placeholder="e.g. Engineering, Medical, Arts"
                className="w-full px-3 py-2.5 min-h-[48px] rounded-xl border border-gray-200 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Institution Type (Optional)</label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value as InstitutionType)}
                className="w-full px-3 py-2.5 min-h-[48px] rounded-xl border border-gray-200 text-sm text-gray-900 bg-white"
              >
                <option value="">Any / Not Specified</option>
                <option value="government">Government College / University</option>
                <option value="aided">Government-Aided College</option>
                <option value="private">Private College / University</option>
                <option value="university">Central / State University Campus</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="min-h-[48px] px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="min-h-[48px] px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 flex items-center gap-1.5"
            >
              Next: Income <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Income & Demographics */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-indigo-600" /> Annual Family Income (INR) <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Total gross annual income from all sources as per Revenue Income Certificate.</p>
            <input
              type="number"
              min="0"
              step="5000"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              placeholder="e.g. 500000"
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-gray-200 text-gray-900 bg-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="mt-2 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-800">
              Preview: <span className="font-extrabold">{getIncomePreview(annualIncome)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Gender (Optional)</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2.5 min-h-[48px] rounded-xl border border-gray-200 text-sm text-gray-900 bg-white"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="female">Female (Matches AICTE Pragati)</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Disability / PwD Status (Optional)</label>
              <select
                value={disability}
                onChange={(e) => setDisability(e.target.value as DisabilityStatus)}
                className="w-full px-3 py-2.5 min-h-[48px] rounded-xl border border-gray-200 text-sm text-gray-900 bg-white"
              >
                <option value="no">No</option>
                <option value="yes">Yes (40%+ disability certificate)</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800">
              <span className="font-bold">Zero-Risk Privacy Guarantee:</span> Your income, category, and demographic answers are evaluated exclusively client-side in your browser. We never log or sell this data.
            </div>
          </div>

          <div className="pt-4 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="min-h-[48px] px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 flex items-center gap-2 transform active:scale-95 transition"
            >
              Check My Matches Now <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
