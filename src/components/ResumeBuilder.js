"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Download, Plus, Trash2, ShieldAlert, Sparkles, Award } from "lucide-react";

const monthsList = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const yearsList = [];
for (let y = 2035; y >= 1990; y--) {
  yearsList.push(y.toString());
}

export default function ResumeBuilder() {
  // Core states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");

  // Section states
  const [experience, setExperience] = useState([
    { title: "", company: "", startMonth: "", startYear: "", isCurrent: false, endMonth: "", endYear: "", description: "" },
  ]);
  const [education, setEducation] = useState([
    { degree: "", school: "", startMonth: "", startYear: "", isCurrent: false, endMonth: "", endYear: "" },
  ]);
  const [projects, setProjects] = useState([{ title: "", description: "", link: "" }]);
  const [certifications, setCertifications] = useState([{ name: "", issuer: "", date: "", link: "" }]);
  const [achievements, setAchievements] = useState([{ title: "", description: "" }]);
  const [languages, setLanguages] = useState("");

  // Validation state
  const [errors, setErrors] = useState({});

  // AI analysis state
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Pure JavaScript validation logic for a single field
  const validateField = (fieldKey, value) => {
    let errorMsg = "";
    const cleanValue = (value || "").trim();

    const hasSqlInjection = (text) => {
      if (!text) return false;
      const sqlPatterns = [
        /--/,
        /\/\*/,
        /xp_cmdshell/i,
        /UNION\s+SELECT/i,
        /SELECT\s+.*\s+FROM/i,
        /INSERT\s+INTO/i,
        /UPDATE\s+.*\s+SET/i,
        /DELETE\s+FROM/i,
        /DROP\s+TABLE/i,
        /OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i
      ];
      return sqlPatterns.some(pattern => pattern.test(text));
    };

    const isRequired = [
      "name", "email", "phone", "linkedin", "summary", "skills"
    ].includes(fieldKey) || 
    fieldKey.endsWith("_title") || 
    fieldKey.endsWith("_company") || 
    fieldKey.endsWith("_startMonth") || 
    fieldKey.endsWith("_startYear") || 
    fieldKey.endsWith("_endMonth") || 
    fieldKey.endsWith("_endYear") || 
    fieldKey.endsWith("_degree") || 
    fieldKey.endsWith("_school") || 
    fieldKey.endsWith("_description") || 
    fieldKey.endsWith("_name") || 
    fieldKey.endsWith("_issuer") || 
    fieldKey.endsWith("_date");

    if (isRequired && !cleanValue) {
      errorMsg = "This field is required";
    } else if (cleanValue) {
      // 1. Name fields — letters and spaces only, no numbers or special characters
      if (fieldKey === "name" || fieldKey.endsWith("_title")) {
        if (!/^[a-zA-Z\s]+$/.test(cleanValue)) {
          errorMsg = "Letters and spaces only, no numbers or special characters";
        }
      }

      // 2. Email — valid format only, no special characters except @ _ . -
      if (fieldKey === "email") {
        if (!/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanValue)) {
          errorMsg = "Invalid email format. Only @, _, ., - are allowed as special characters";
        }
      }

      // 3. Phone — 10 digits, must start with 6, 7, 8, or 9 (Indian numbers)
      if (fieldKey === "phone") {
        if (!/^[6789]\d{9}$/.test(cleanValue)) {
          errorMsg = "Must be a 10-digit number starting with 6, 7, 8, or 9";
        }
      }

      // 4. LinkedIn URL — must start with https://linkedin.com/in/
      if (fieldKey === "linkedin") {
        if (!cleanValue.startsWith("https://linkedin.com/in/")) {
          errorMsg = "URL must start with https://linkedin.com/in/";
        }
      }

      // 5. GitHub URL — must start with https://github.com/
      if (fieldKey.endsWith("_link") && fieldKey.includes("proj_")) {
        if (!cleanValue.startsWith("https://github.com/")) {
          errorMsg = "GitHub URL must start with https://github.com/";
        }
      }

      // 6. SQL Injection patterns & Text areas max character limits
      if (typeof value === "string") {
        if (hasSqlInjection(cleanValue)) {
          errorMsg = "Potential SQL injection pattern detected";
        }
      }

      if (fieldKey === "summary" && cleanValue.length > 500) {
        errorMsg = "Summary cannot exceed 500 characters";
      }
      if (fieldKey.endsWith("_description") && cleanValue.length > 800) {
        errorMsg = "Description cannot exceed 800 characters";
      }
    }

    setErrors(prev => {
      const next = { ...prev };
      if (errorMsg) {
        next[fieldKey] = errorMsg;
      } else {
        delete next[fieldKey];
      }
      return next;
    });

    return !errorMsg;
  };

  // Validate all fields for form submission
  const validateAllFields = () => {
    let isValid = true;
    
    // Core fields
    if (!validateField("name", name)) isValid = false;
    if (!validateField("email", email)) isValid = false;
    if (!validateField("phone", phone)) isValid = false;
    if (!validateField("linkedin", linkedin)) isValid = false;
    if (portfolio) {
      if (!validateField("portfolio", portfolio)) isValid = false;
    }
    if (!validateField("summary", summary)) isValid = false;
    if (!validateField("skills", skills)) isValid = false;

    // Experience
    experience.forEach((exp, idx) => {
      if (!validateField(`exp_${idx}_title`, exp.title)) isValid = false;
      if (!validateField(`exp_${idx}_company`, exp.company)) isValid = false;
      if (!validateField(`exp_${idx}_startMonth`, exp.startMonth)) isValid = false;
      if (!validateField(`exp_${idx}_startYear`, exp.startYear)) isValid = false;
      if (!exp.isCurrent) {
        if (!validateField(`exp_${idx}_endMonth`, exp.endMonth)) isValid = false;
        if (!validateField(`exp_${idx}_endYear`, exp.endYear)) isValid = false;
      }
      if (!validateField(`exp_${idx}_description`, exp.description)) isValid = false;
    });

    // Education
    education.forEach((edu, idx) => {
      if (!validateField(`edu_${idx}_degree`, edu.degree)) isValid = false;
      if (!validateField(`edu_${idx}_school`, edu.school)) isValid = false;
      if (!validateField(`edu_${idx}_startMonth`, edu.startMonth)) isValid = false;
      if (!validateField(`edu_${idx}_startYear`, edu.startYear)) isValid = false;
      if (!edu.isCurrent) {
        if (!validateField(`edu_${idx}_endMonth`, edu.endMonth)) isValid = false;
        if (!validateField(`edu_${idx}_endYear`, edu.endYear)) isValid = false;
      }
    });

    // Projects
    projects.forEach((proj, idx) => {
      if (proj.title || proj.description || proj.link) {
        if (!validateField(`proj_${idx}_title`, proj.title)) isValid = false;
        if (!validateField(`proj_${idx}_description`, proj.description)) isValid = false;
        if (proj.link) {
          if (!validateField(`proj_${idx}_link`, proj.link)) isValid = false;
        }
      }
    });

    // Certifications
    certifications.forEach((cert, idx) => {
      if (cert.name || cert.issuer || cert.date || cert.link) {
        if (!validateField(`cert_${idx}_name`, cert.name)) isValid = false;
        if (!validateField(`cert_${idx}_issuer`, cert.issuer)) isValid = false;
        if (!validateField(`cert_${idx}_date`, cert.date)) isValid = false;
        if (cert.link) {
          if (!validateField(`cert_${idx}_link`, cert.link)) isValid = false;
        }
      }
    });

    // Achievements
    achievements.forEach((ach, idx) => {
      if (ach.title || ach.description) {
        if (!validateField(`ach_${idx}_title`, ach.title)) isValid = false;
        if (!validateField(`ach_${idx}_description`, ach.description)) isValid = false;
      }
    });

    return isValid;
  };

  const handleBlur = (fieldKey, value) => {
    validateField(fieldKey, value);
  };

  const handleFieldChange = (fieldKey, setter, value) => {
    setter(value);
    if (errors[fieldKey]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  // Handlers for experience array
  const handleAddExperience = () => {
    setExperience([
      ...experience,
      { title: "", company: "", startMonth: "", startYear: "", isCurrent: false, endMonth: "", endYear: "", description: "" },
    ]);
  };
  const handleRemoveExperience = (index) => {
    setExperience(experience.filter((_, idx) => idx !== index));
    const cleaned = { ...errors };
    Object.keys(cleaned).forEach(key => {
      if (key.startsWith(`exp_${index}_`)) delete cleaned[key];
    });
    setErrors(cleaned);
  };
  const handleExperienceChange = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    if (field === "isCurrent" && value === true) {
      updated[index]["endMonth"] = "";
      updated[index]["endYear"] = "";
    }
    setExperience(updated);

    const errKey = `exp_${index}_${field}`;
    if (errors[errKey]) {
      const cleaned = { ...errors };
      delete cleaned[errKey];
      if (field === "isCurrent" && value === true) {
        delete cleaned[`exp_${index}_endMonth`];
        delete cleaned[`exp_${index}_endYear`];
      }
      setErrors(cleaned);
    }
  };

  // Handlers for education array
  const handleAddEducation = () => {
    setEducation([
      ...education,
      { degree: "", school: "", startMonth: "", startYear: "", isCurrent: false, endMonth: "", endYear: "" },
    ]);
  };
  const handleRemoveEducation = (index) => {
    setEducation(education.filter((_, idx) => idx !== index));
    const cleaned = { ...errors };
    Object.keys(cleaned).forEach(key => {
      if (key.startsWith(`edu_${index}_`)) delete cleaned[key];
    });
    setErrors(cleaned);
  };
  const handleEducationChange = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    if (field === "isCurrent" && value === true) {
      updated[index]["endMonth"] = "";
      updated[index]["endYear"] = "";
    }
    setEducation(updated);

    const errKey = `edu_${index}_${field}`;
    if (errors[errKey]) {
      const cleaned = { ...errors };
      delete cleaned[errKey];
      if (field === "isCurrent" && value === true) {
        delete cleaned[`edu_${index}_endMonth`];
        delete cleaned[`edu_${index}_endYear`];
      }
      setErrors(cleaned);
    }
  };

  // Handlers for projects
  const handleAddProject = () => {
    setProjects([...projects, { title: "", description: "", link: "" }]);
  };
  const handleRemoveProject = (index) => {
    setProjects(projects.filter((_, idx) => idx !== index));
    const cleaned = { ...errors };
    Object.keys(cleaned).forEach(key => {
      if (key.startsWith(`proj_${index}_`)) delete cleaned[key];
    });
    setErrors(cleaned);
  };
  const handleProjectChange = (index, field, value) => {
    const updated = [...projects];
    updated[index][field] = value;
    setProjects(updated);

    const errKey = `proj_${index}_${field}`;
    if (errors[errKey]) {
      const cleaned = { ...errors };
      delete cleaned[errKey];
      setErrors(cleaned);
    }
  };

  // Handlers for certifications
  const handleAddCertification = () => {
    setCertifications([...certifications, { name: "", issuer: "", date: "", link: "" }]);
  };
  const handleRemoveCertification = (index) => {
    setCertifications(certifications.filter((_, idx) => idx !== index));
    const cleaned = { ...errors };
    Object.keys(cleaned).forEach(key => {
      if (key.startsWith(`cert_${index}_`)) delete cleaned[key];
    });
    setErrors(cleaned);
  };
  const handleCertificationChange = (index, field, value) => {
    const updated = [...certifications];
    updated[index][field] = value;
    setCertifications(updated);

    const errKey = `cert_${index}_${field}`;
    if (errors[errKey]) {
      const cleaned = { ...errors };
      delete cleaned[errKey];
      setErrors(cleaned);
    }
  };

  // Handlers for achievements
  const handleAddAchievement = () => {
    setAchievements([...achievements, { title: "", description: "" }]);
  };
  const handleRemoveAchievement = (index) => {
    setAchievements(achievements.filter((_, idx) => idx !== index));
    const cleaned = { ...errors };
    Object.keys(cleaned).forEach(key => {
      if (key.startsWith(`ach_${index}_`)) delete cleaned[key];
    });
    setErrors(cleaned);
  };
  const handleAchievementChange = (index, field, value) => {
    const updated = [...achievements];
    updated[index][field] = value;
    setAchievements(updated);

    const errKey = `ach_${index}_${field}`;
    if (errors[errKey]) {
      const cleaned = { ...errors };
      delete cleaned[errKey];
      setErrors(cleaned);
    }
  };

  // AI Resume Analysis calling Gemini
  const handleAnalyzeResume = async () => {
    const isValid = validateAllFields();
    if (!isValid) {
      toast.error("Please resolve all validation errors in the form first.");
      return;
    }

    setAnalysisLoading(true);
    const toastId = toast.loading("Evaluating resume with Gemini AI...");

    try {
      const resumePayload = {
        name,
        email,
        phone,
        linkedin,
        portfolio,
        summary,
        skills,
        experience,
        education,
        projects,
        certifications,
        achievements,
        languages
      };

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert ATS (Applicant Tracking System) parser and executive recruiter. 
Analyze this candidate's resume data and output a structured review matching this JSON schema:
{
  "score": 85,
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "feedback": "..."
}

Keep strengths and improvements brief (max 3 items each). 
Resume Data:
${JSON.stringify(resumePayload, null, 2)}`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach AI evaluation backend.");
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      let parsedData;
      try {
        parsedData = JSON.parse(text.trim());
      } catch (e) {
        parsedData = {
          score: 70,
          strengths: ["Clear section boundaries", "Has certifications section"],
          improvements: ["Expand professional summary detail", "Add more tech skills"],
          feedback: "Evaluation fell back due to unexpected format. Verify content matches professional expectations."
        };
      }
      
      setAnalysisResult(parsedData);
      toast.success("Resume ATS analysis ready!", { id: toastId });
    } catch (err) {
      toast.error("An error occurred during resume analysis.", { id: toastId });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const downloadResumeAsPDF = async (e) => {
    e.preventDefault();
    
    const isValid = validateAllFields();
    if (!isValid) {
      toast.error("Form submission blocked. Correct the highlighted errors first.");
      return;
    }

    const element = document.getElementById("resume-content");
    if (!element) {
      toast.error("Preview content not found!");
      return;
    }

    const toastId = toast.loading("Generating PDF download...");

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const fileName = `${(name || "Resume").replace(/ /g, "_")}.pdf`;

      const opt = {
        margin: 0.4,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, logging: false },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      element.classList.add("pdf-render-fixed-width");

      setTimeout(() => {
        html2pdf()
          .from(element)
          .set(opt)
          .save()
          .then(() => {
            element.classList.remove("pdf-render-fixed-width");
            toast.success("Resume downloaded successfully!", { id: toastId });
          })
          .catch((err) => {
            toast.error("An error occurred while exporting PDF.", { id: toastId });
            element.classList.remove("pdf-render-fixed-width");
          });
      }, 100);
    } catch (error) {
      toast.error("Failed to load PDF library.", { id: toastId });
    }
  };

  const skillsList = skills
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);

  const getFieldClass = (fieldKey) => {
    const base = "w-full border rounded-md p-2.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-gray-900 border-gray-300 bg-white";
    return errors[fieldKey]
      ? `${base} border-red-500 ring-1 ring-red-200`
      : base;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      {/* Resume Form */}
      <div id="resume-form-container" className="bg-white p-6 rounded-xl shadow-md overflow-y-auto max-h-[85vh] space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Resume Details</h2>
          <p className="text-sm text-gray-500 mt-1">Fill out the fields. Validation triggers on blur and submit.</p>
        </div>

        <form onSubmit={downloadResumeAsPDF} className="space-y-6">
          {/* Personal Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-1 text-indigo-700">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => handleFieldChange("name", setName, e.target.value)}
                  onBlur={(e) => handleBlur("name", e.target.value)}
                  className={getFieldClass("name")}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>}
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => handleFieldChange("email", setEmail, e.target.value)}
                  onBlur={(e) => handleBlur("email", e.target.value)}
                  className={getFieldClass("email")}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Phone Number (10 digits)"
                  value={phone}
                  onChange={(e) => handleFieldChange("phone", setPhone, e.target.value)}
                  onBlur={(e) => handleBlur("phone", e.target.value)}
                  className={getFieldClass("phone")}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone}</p>}
              </div>

              <div>
                <input
                  type="url"
                  placeholder="LinkedIn Profile URL"
                  value={linkedin}
                  onChange={(e) => handleFieldChange("linkedin", setLinkedin, e.target.value)}
                  onBlur={(e) => handleBlur("linkedin", e.target.value)}
                  className={getFieldClass("linkedin")}
                />
                {errors.linkedin && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.linkedin}</p>}
              </div>
            </div>
            <div>
              <input
                type="url"
                placeholder="Portfolio/Website URL (Optional)"
                value={portfolio}
                onChange={(e) => handleFieldChange("portfolio", setPortfolio, e.target.value)}
                onBlur={(e) => handleBlur("portfolio", e.target.value)}
                className={getFieldClass("portfolio")}
              />
              {errors.portfolio && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.portfolio}</p>}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg border-b pb-1 text-indigo-700">Professional Summary</h3>
            <textarea
              placeholder="Brief summary of your background (Max 500 chars)"
              value={summary}
              onChange={(e) => handleFieldChange("summary", setSummary, e.target.value)}
              onBlur={(e) => handleBlur("summary", e.target.value)}
              className={`${getFieldClass("summary")} h-24`}
            ></textarea>
            {errors.summary && <p className="text-red-500 text-xs mt-0.5 font-semibold">{errors.summary}</p>}
          </div>

          {/* Work Experience */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-1 text-indigo-700">Work Experience</h3>
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3 relative bg-gray-50">
                  {experience.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(idx)}
                      className="absolute -top-2.5 -right-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                  <div>
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={exp.title}
                      onChange={(e) => handleExperienceChange(idx, "title", e.target.value)}
                      onBlur={(e) => handleBlur(`exp_${idx}_title`, e.target.value)}
                      className={getFieldClass(`exp_${idx}_title`)}
                    />
                    {errors[`exp_${idx}_title`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`exp_${idx}_title`]}</p>}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={exp.company}
                      onChange={(e) => handleExperienceChange(idx, "company", e.target.value)}
                      onBlur={(e) => handleBlur(`exp_${idx}_company`, e.target.value)}
                      className={getFieldClass(`exp_${idx}_company`)}
                    />
                    {errors[`exp_${idx}_company`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`exp_${idx}_company`]}</p>}
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500">Start Date</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select
                          value={exp.startMonth}
                          onChange={(e) => handleExperienceChange(idx, "startMonth", e.target.value)}
                          onBlur={(e) => handleBlur(`exp_${idx}_startMonth`, e.target.value)}
                          className={getFieldClass(`exp_${idx}_startMonth`)}
                        >
                          <option value="">Month</option>
                          {monthsList.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        {errors[`exp_${idx}_startMonth`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`exp_${idx}_startMonth`]}</p>}
                      </div>
                      <div>
                        <select
                          value={exp.startYear}
                          onChange={(e) => handleExperienceChange(idx, "startYear", e.target.value)}
                          onBlur={(e) => handleBlur(`exp_${idx}_startYear`, e.target.value)}
                          className={getFieldClass(`exp_${idx}_startYear`)}
                        >
                          <option value="">Year</option>
                          {yearsList.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        {errors[`exp_${idx}_startYear`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`exp_${idx}_startYear`]}</p>}
                      </div>
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-gray-500">End Date</label>
                      <label className="flex items-center text-xs font-semibold text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exp.isCurrent}
                          onChange={(e) => handleExperienceChange(idx, "isCurrent", e.target.checked)}
                          className="mr-1.5 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        Present
                      </label>
                    </div>

                    {!exp.isCurrent && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <select
                            value={exp.endMonth}
                            onChange={(e) => handleExperienceChange(idx, "endMonth", e.target.value)}
                            onBlur={(e) => handleBlur(`exp_${idx}_endMonth`, e.target.value)}
                            className={getFieldClass(`exp_${idx}_endMonth`)}
                          >
                            <option value="">Month</option>
                            {monthsList.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          {errors[`exp_${idx}_endMonth`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`exp_${idx}_endMonth`]}</p>}
                        </div>
                        <div>
                          <select
                            value={exp.endYear}
                            onChange={(e) => handleExperienceChange(idx, "endYear", e.target.value)}
                            onBlur={(e) => handleBlur(`exp_${idx}_endYear`, e.target.value)}
                            className={getFieldClass(`exp_${idx}_endYear`)}
                          >
                            <option value="">Year</option>
                            {yearsList.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                          {errors[`exp_${idx}_endYear`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`exp_${idx}_endYear`]}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <textarea
                      placeholder="Responsibilities (Max 800 chars)"
                      value={exp.description}
                      onChange={(e) => handleExperienceChange(idx, "description", e.target.value)}
                      onBlur={(e) => handleBlur(`exp_${idx}_description`, e.target.value)}
                      className={`${getFieldClass(`exp_${idx}_description`)} h-20`}
                    ></textarea>
                    {errors[`exp_${idx}_description`] && <p className="text-red-500 text-xs mt-0.5 font-semibold">{errors[`exp_${idx}_description`]}</p>}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddExperience}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add another experience
            </button>
          </div>

          {/* Education */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-1 text-indigo-700">Education</h3>
            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3 relative bg-gray-50">
                  {education.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(idx)}
                      className="absolute -top-2.5 -right-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                  <div>
                    <input
                      type="text"
                      placeholder="Degree (e.g. B.Tech Computer Science)"
                      value={edu.degree}
                      onChange={(e) => handleEducationChange(idx, "degree", e.target.value)}
                      onBlur={(e) => handleBlur(`edu_${idx}_degree`, e.target.value)}
                      className={getFieldClass(`edu_${idx}_degree`)}
                    />
                    {errors[`edu_${idx}_degree`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`edu_${idx}_degree`]}</p>}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="University/College Name"
                      value={edu.school}
                      onChange={(e) => handleEducationChange(idx, "school", e.target.value)}
                      onBlur={(e) => handleBlur(`edu_${idx}_school`, e.target.value)}
                      className={getFieldClass(`edu_${idx}_school`)}
                    />
                    {errors[`edu_${idx}_school`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`edu_${idx}_school`]}</p>}
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500">Start Date</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select
                          value={edu.startMonth}
                          onChange={(e) => handleEducationChange(idx, "startMonth", e.target.value)}
                          onBlur={(e) => handleBlur(`edu_${idx}_startMonth`, e.target.value)}
                          className={getFieldClass(`edu_${idx}_startMonth`)}
                        >
                          <option value="">Month</option>
                          {monthsList.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        {errors[`edu_${idx}_startMonth`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`edu_${idx}_startMonth`]}</p>}
                      </div>
                      <div>
                        <select
                          value={edu.startYear}
                          onChange={(e) => handleEducationChange(idx, "startYear", e.target.value)}
                          onBlur={(e) => handleBlur(`edu_${idx}_startYear`, e.target.value)}
                          className={getFieldClass(`edu_${idx}_startYear`)}
                        >
                          <option value="">Year</option>
                          {yearsList.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        {errors[`edu_${idx}_startYear`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`edu_${idx}_startYear`]}</p>}
                      </div>
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-gray-500">Graduation Date</label>
                      <label className="flex items-center text-xs font-semibold text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={edu.isCurrent}
                          onChange={(e) => handleEducationChange(idx, "isCurrent", e.target.checked)}
                          className="mr-1.5 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        Currently Studying
                      </label>
                    </div>

                    {!edu.isCurrent && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <select
                            value={edu.endMonth}
                            onChange={(e) => handleEducationChange(idx, "endMonth", e.target.value)}
                            onBlur={(e) => handleBlur(`edu_${idx}_endMonth`, e.target.value)}
                            className={getFieldClass(`edu_${idx}_endMonth`)}
                          >
                            <option value="">Month</option>
                            {monthsList.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          {errors[`edu_${idx}_endMonth`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`edu_${idx}_endMonth`]}</p>}
                        </div>
                        <div>
                          <select
                            value={edu.endYear}
                            onChange={(e) => handleEducationChange(idx, "endYear", e.target.value)}
                            onBlur={(e) => handleBlur(`edu_${idx}_endYear`, e.target.value)}
                            className={getFieldClass(`edu_${idx}_endYear`)}
                          >
                            <option value="">Year</option>
                            {yearsList.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                          {errors[`edu_${idx}_endYear`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`edu_${idx}_endYear`]}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddEducation}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add another education
            </button>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg border-b pb-1 text-indigo-700">Skills</h3>
            <textarea
              placeholder="List technical skills, separated by commas"
              value={skills}
              onChange={(e) => handleFieldChange("skills", setSkills, e.target.value)}
              onBlur={(e) => handleBlur("skills", e.target.value)}
              className={`${getFieldClass("skills")} h-20`}
            ></textarea>
            {errors.skills && <p className="text-red-500 text-xs mt-0.5 font-semibold">{errors.skills}</p>}
          </div>

          {/* Projects */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-1 text-indigo-700">Projects</h3>
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3 relative bg-gray-50">
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(idx)}
                      className="absolute -top-2.5 -right-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                  <div>
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={proj.title}
                      onChange={(e) => handleProjectChange(idx, "title", e.target.value)}
                      onBlur={(e) => handleBlur(`proj_${idx}_title`, e.target.value)}
                      className={getFieldClass(`proj_${idx}_title`)}
                    />
                    {errors[`proj_${idx}_title`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`proj_${idx}_title`]}</p>}
                  </div>

                  <div>
                    <textarea
                      placeholder="Project Description"
                      value={proj.description}
                      onChange={(e) => handleProjectChange(idx, "description", e.target.value)}
                      onBlur={(e) => handleBlur(`proj_${idx}_description`, e.target.value)}
                      className={`${getFieldClass(`proj_${idx}_description`)} h-20`}
                    ></textarea>
                    {errors[`proj_${idx}_description`] && <p className="text-red-500 text-xs mt-0.5 font-semibold">{errors[`proj_${idx}_description`]}</p>}
                  </div>

                  <div>
                    <input
                      type="url"
                      placeholder="GitHub Link (https://github.com/...)"
                      value={proj.link}
                      onChange={(e) => handleProjectChange(idx, "link", e.target.value)}
                      onBlur={(e) => handleBlur(`proj_${idx}_link`, e.target.value)}
                      className={getFieldClass(`proj_${idx}_link`)}
                    />
                    {errors[`proj_${idx}_link`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`proj_${idx}_link`]}</p>}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddProject}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add another project
            </button>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-1 text-indigo-700">Certifications</h3>
            <div className="space-y-4">
              {certifications.map((cert, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3 relative bg-gray-50">
                  {certifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(idx)}
                      className="absolute -top-2.5 -right-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                  <div>
                    <input
                      type="text"
                      placeholder="Certification Name"
                      value={cert.name}
                      onChange={(e) => handleCertificationChange(idx, "name", e.target.value)}
                      onBlur={(e) => handleBlur(`cert_${idx}_name`, e.target.value)}
                      className={getFieldClass(`cert_${idx}_name`)}
                    />
                    {errors[`cert_${idx}_name`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`cert_${idx}_name`]}</p>}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Issuer Organization"
                      value={cert.issuer}
                      onChange={(e) => handleCertificationChange(idx, "issuer", e.target.value)}
                      onBlur={(e) => handleBlur(`cert_${idx}_issuer`, e.target.value)}
                      className={getFieldClass(`cert_${idx}_issuer`)}
                    />
                    {errors[`cert_${idx}_issuer`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`cert_${idx}_issuer`]}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <select
                        value={cert.date}
                        onChange={(e) => handleCertificationChange(idx, "date", e.target.value)}
                        onBlur={(e) => handleBlur(`cert_${idx}_date`, e.target.value)}
                        className={getFieldClass(`cert_${idx}_date`)}
                      >
                        <option value="">Issue Year</option>
                        {yearsList.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      {errors[`cert_${idx}_date`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`cert_${idx}_date`]}</p>}
                    </div>

                    <div>
                      <input
                        type="url"
                        placeholder="Credential URL (Optional)"
                        value={cert.link}
                        onChange={(e) => handleCertificationChange(idx, "link", e.target.value)}
                        onBlur={(e) => handleBlur(`cert_${idx}_link`, e.target.value)}
                        className={getFieldClass(`cert_${idx}_link`)}
                      />
                      {errors[`cert_${idx}_link`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`cert_${idx}_link`]}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddCertification}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add another certification
            </button>
          </div>

          {/* Achievements */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-1 text-indigo-700">Achievements & Awards</h3>
            <div className="space-y-4">
              {achievements.map((ach, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3 relative bg-gray-50">
                  {achievements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAchievement(idx)}
                      className="absolute -top-2.5 -right-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                  <div>
                    <input
                      type="text"
                      placeholder="Achievement/Award Title"
                      value={ach.title}
                      onChange={(e) => handleAchievementChange(idx, "title", e.target.value)}
                      onBlur={(e) => handleBlur(`ach_${idx}_title`, e.target.value)}
                      className={getFieldClass(`ach_${idx}_title`)}
                    />
                    {errors[`ach_${idx}_title`] && <p className="text-red-500 text-xs mt-1 font-semibold">{errors[`ach_${idx}_title`]}</p>}
                  </div>

                  <div>
                    <textarea
                      placeholder="Short details of achievement..."
                      value={ach.description}
                      onChange={(e) => handleAchievementChange(idx, "description", e.target.value)}
                      onBlur={(e) => handleBlur(`ach_${idx}_description`, e.target.value)}
                      className={`${getFieldClass(`ach_${idx}_description`)} h-16`}
                    ></textarea>
                    {errors[`ach_${idx}_description`] && <p className="text-red-500 text-xs mt-0.5 font-semibold">{errors[`ach_${idx}_description`]}</p>}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddAchievement}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add another achievement
            </button>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg border-b pb-1 text-indigo-700">Languages</h3>
            <input
              type="text"
              placeholder="Languages (e.g. English, Hindi)"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2.5 text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="pt-4 border-t flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleAnalyzeResume}
              disabled={analysisLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 inline-flex items-center justify-center transition gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <Sparkles className="h-5 w-5" /> {analysisLoading ? "Analyzing..." : "Analyze Resume First"}
            </button>

            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 inline-flex items-center justify-center transition gap-2 shadow-md hover:shadow-lg"
            >
              <Download className="h-5 w-5" /> Export PDF & Apply
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Container */}
      <div id="resume-preview-container" className="bg-white p-6 rounded-xl shadow-md overflow-y-auto max-h-[85vh] space-y-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Live Preview & Analysis</h2>
        
        {/* AI Analysis Result Board */}
        {analysisResult && (
          <div className="bg-indigo-50 border border-indigo-150 p-5 rounded-xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
              <span className="font-bold text-indigo-800 text-lg flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" /> AI ATS Analysis Report
              </span>
              <span className={`font-black text-2xl py-1 px-3 rounded-lg text-white ${
                analysisResult.score >= 80 ? "bg-green-600" : analysisResult.score >= 50 ? "bg-yellow-600" : "bg-red-600"
              }`}>
                {analysisResult.score}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1.5">
                <h4 className="font-bold text-green-800">✅ Key Strengths:</h4>
                <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                  {analysisResult.strengths?.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-yellow-800">⚠️ Areas of Improvement:</h4>
                <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                  {analysisResult.improvements?.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {analysisResult.feedback && (
              <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border leading-relaxed border-gray-150">
                <strong>Feedback: </strong> {analysisResult.feedback}
              </p>
            )}
          </div>
        )}

        <div id="resume-content" className="p-6 bg-white shadow-none text-left font-serif leading-relaxed text-black">
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-3 text-center">
            <h2 className="text-3xl font-black uppercase tracking-wide text-gray-900">
              {name || "Your Name"}
            </h2>
            <div className="flex flex-wrap justify-center text-xs text-gray-600 mt-2 gap-x-4 gap-y-1 font-sans">
              {email && <span>{email}</span>}
              {phone && <span>{phone}</span>}
              {linkedin && (
                <span>
                  <a href={linkedin} className="underline" target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                </span>
              )}
              {portfolio && (
                <span>
                  <a href={portfolio} className="underline" target="_blank" rel="noopener noreferrer">
                    Portfolio
                  </a>
                </span>
              )}
            </div>
          </div>

          {/* Professional Summary */}
          {summary && (
            <section className="mt-5">
              <h3 className="text-base font-bold text-indigo-800 uppercase tracking-wider border-b border-gray-300 pb-0.5 mb-2 font-sans">
                Professional Summary
              </h3>
              <p className="text-sm text-gray-800 leading-normal whitespace-pre-wrap">
                {summary}
              </p>
            </section>
          )}

          {/* Skills */}
          {skillsList.length > 0 && (
            <section className="mt-5">
              <h3 className="text-base font-bold text-indigo-800 uppercase tracking-wider border-b border-gray-300 pb-0.5 mb-2 font-sans">
                Skills
              </h3>
              <p className="text-sm text-gray-800 leading-normal">
                {skillsList.join(" • ")}
              </p>
            </section>
          )}

          {/* Work Experience */}
          {experience.some((exp) => exp.title.trim() || exp.company.trim()) && (
            <section className="mt-5">
              <h3 className="text-base font-bold text-indigo-800 uppercase tracking-wider border-b border-gray-300 pb-0.5 mb-2 font-sans">
                Professional Experience
              </h3>
              {experience.map((exp, idx) => {
                const startFormatted = exp.startMonth && exp.startYear ? `${exp.startMonth} ${exp.startYear}` : "";
                const endFormatted = exp.isCurrent ? "Present" : (exp.endMonth && exp.endYear ? `${exp.endMonth} ${exp.endYear}` : "");
                const datesCombined = startFormatted || endFormatted ? `${startFormatted} - ${endFormatted}` : "";

                return (
                  <div key={idx} className="mb-3">
                    <div className="flex justify-between font-sans text-sm font-semibold text-gray-900">
                      <span>{exp.title || "Job Title"}</span>
                      <span className="text-gray-500 font-normal">
                        {datesCombined}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 italic">{exp.company || "Company Name"}</p>
                    {exp.description && (
                      <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap leading-normal pl-2 border-l border-gray-200 font-sans">
                        {exp.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Education */}
          {education.some((edu) => edu.degree.trim() || edu.school.trim()) && (
            <section className="mt-5">
              <h3 className="text-base font-bold text-indigo-800 uppercase tracking-wider border-b border-gray-300 pb-0.5 mb-2 font-sans">
                Education
              </h3>
              {education.map((edu, idx) => {
                const startFormatted = edu.startMonth && edu.startYear ? `${edu.startMonth} ${edu.startYear}` : "";
                const endFormatted = edu.isCurrent ? "Present" : (edu.endMonth && edu.endYear ? `${edu.endMonth} ${edu.endYear}` : "");
                const datesCombined = startFormatted || endFormatted ? `${startFormatted} - ${endFormatted}` : "";

                return (
                  <div key={idx} className="mb-3">
                    <div className="flex justify-between font-sans text-sm font-semibold text-gray-900">
                      <span>{edu.degree || "Degree"}</span>
                      <span className="text-gray-500 font-normal">
                        {datesCombined}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 italic">{edu.school || "School/University Name"}</p>
                  </div>
                );
              })}
            </section>
          )}

          {/* Projects */}
          {projects.some((proj) => proj.title.trim() || proj.description.trim()) && (
            <section className="mt-5">
              <h3 className="text-base font-bold text-indigo-800 uppercase tracking-wider border-b border-gray-300 pb-0.5 mb-2 font-sans">
                Projects
              </h3>
              {projects.map((proj, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between font-sans text-sm font-semibold text-gray-900">
                    <span>{proj.title || "Project Title"}</span>
                    {proj.link && (
                      <a href={proj.link} className="text-xs text-indigo-600 font-normal hover:underline" target="_blank" rel="noopener noreferrer font-sans">
                        Link
                      </a>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-sm text-gray-800 mt-0.5 leading-normal">
                      {proj.description}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Certifications */}
          {certifications.some((cert) => cert.name.trim() || cert.issuer.trim()) && (
            <section className="mt-5">
              <h3 className="text-base font-bold text-indigo-800 uppercase tracking-wider border-b border-gray-300 pb-0.5 mb-2 font-sans">
                Certifications
              </h3>
              {certifications.map((cert, idx) => (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between font-sans text-sm font-semibold text-gray-900">
                    <span>{cert.name || "Certification Name"}</span>
                    <span className="text-gray-500 font-normal">{cert.date || "Year"}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700 italic">
                    <span>{cert.issuer || "Issuing Body"}</span>
                    {cert.link && (
                      <a href={cert.link} className="text-xs text-indigo-600 font-normal hover:underline" target="_blank" rel="noopener noreferrer font-sans">
                        Verify
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Achievements */}
          {achievements.some((ach) => ach.title.trim() || ach.description.trim()) && (
            <section className="mt-5">
              <h3 className="text-base font-bold text-indigo-800 uppercase tracking-wider border-b border-gray-300 pb-0.5 mb-2 font-sans">
                Achievements & Awards
              </h3>
              {achievements.map((ach, idx) => (
                <div key={idx} className="mb-2 text-sm text-gray-850">
                  <span className="font-semibold font-sans text-gray-900">{ach.title || "Award Title"}</span>
                  {ach.description && <span className="text-gray-700"> — {ach.description}</span>}
                </div>
              ))}
            </section>
          )}

          {/* Languages */}
          {languages.trim() && (
            <section className="mt-5">
              <h3 className="text-base font-bold text-indigo-800 uppercase tracking-wider border-b border-gray-300 pb-0.5 mb-2 font-sans">
                Languages
              </h3>
              <p className="text-sm text-gray-800">
                {languages}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
