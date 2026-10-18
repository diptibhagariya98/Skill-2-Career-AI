"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Search, MapPin, Briefcase, Calendar, Sparkles, Filter, ExternalLink, RotateCcw } from "lucide-react";
import { API_ROUTES } from "../constants/endpoints";
import { hapticLight } from "@/shared/platform";
import { Skeleton, SkeletonCard } from "@/shared/ui";

interface JobItem {
  title: string;
  company: string;
  location: string;
  type: string;
  tags: string[];
  url?: string;
  postDate?: string;
}

const QUICK_SEARCH_CHIPS = [
  "React Developer",
  "Python Fresher",
  "Remote Intern",
  "Node.js Backend",
  "AI / ML Engineer",
];

export default function JobFinder() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");

  const fetchJobs = async (searchQuery: string, searchLocation = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_ROUTES.JOBS}?query=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(searchLocation)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch jobs");
      }
      const data = await res.json();
      const apiJobs = data.data || [];

      const mapped: JobItem[] = apiJobs.map((job: any) => ({
        title: job.job_title,
        company: job.employer_name || "N/A",
        location: `${job.job_city || ""}, ${job.job_country || ""}`.replace(/^, |^, $/, "") || "Remote",
        type: job.job_employment_type || "Full-time",
        tags: (job.job_highlights?.Responsibilities || job.job_highlights?.Qualifications || []).slice(0, 3),
        url: job.job_apply_link,
        postDate: job.job_posted_at_datetime_utc,
      }));

      setJobs(mapped);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to fetch jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs("Developer in India");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      toast.error("Please enter a keyword to search.");
      return;
    }
    hapticLight();
    fetchJobs(keyword, location);
  };

  const handleChipClick = (chip: string) => {
    hapticLight();
    setKeyword(chip);
    fetchJobs(chip, location);
  };

  const filteredJobs = jobs.filter((job) => {
    if (selectedType === "all") return true;
    return job.type.toLowerCase().includes(selectedType.toLowerCase());
  });

  const recommendedJobs = filteredJobs.slice(0, 2);
  const otherJobs = filteredJobs.slice(2);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16 sm:pb-8">
      {/* Search Bar & Quick Chips Container */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-gray-150">
        <form onSubmit={handleSearchSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 items-end">
            <div className="md:col-span-2">
              <label htmlFor="job-keyword" className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
                Keywords &amp; Skills
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="job-keyword"
                  placeholder="e.g. React Developer, Data Analyst"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="block w-full border border-gray-250 rounded-xl shadow-2xs py-3 px-3.5 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base text-gray-900 min-h-[48px]"
                />
                <Search className="h-4.5 w-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="job-location" className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="job-location"
                  placeholder="e.g. Remote, Bangalore, Delhi"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full border border-gray-250 rounded-xl shadow-2xs py-3 px-3.5 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base text-gray-900 min-h-[48px]"
                />
                <MapPin className="h-4.5 w-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-5 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px] text-sm shadow-md shadow-indigo-150"
            >
              <Search className="h-4 w-4" /> {loading ? "Searching..." : "Search Jobs"}
            </button>
          </div>

          {/* Quick Search Horizontal Scroll Pills (Mobile Thumb Friendly) */}
          <div className="pt-2 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
              Popular:
            </span>
            {QUICK_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 border transition active:scale-95 min-h-[36px] flex items-center ${
                  keyword === chip
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 bg-gray-200/70 p-1 rounded-xl">
          {[
            { id: "all", label: "All Types" },
            { id: "full-time", label: "Full-time" },
            { id: "internship", label: "Internship" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => {
                hapticLight();
                setSelectedType(type.id);
              }}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition min-h-[36px] ${
                selectedType === type.id
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            hapticLight();
            fetchJobs(keyword || "Developer in India", location);
          }}
          className="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 min-h-[36px] transition shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeleton States (UX-40 matching final layout) */}
      {loading ? (
        <div className="space-y-4 animate-fade-in" aria-busy="true">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <p className="font-bold text-base">Error Loading Jobs</p>
          <p className="text-xs sm:text-sm mt-1 text-red-600">{error}</p>
          <button
            onClick={() => fetchJobs(keyword || "Developer in India", location)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold bg-white text-red-700 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            Retry Search
          </button>
        </div>
      ) : (
        <>
          {/* Recommended Jobs */}
          {recommendedJobs.length > 0 && (
            <div id="recommended-section" className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recommended For You</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {recommendedJobs.map((job, idx) => (
                  <JobCard key={idx} job={job} isRecommended={true} />
                ))}
              </div>
            </div>
          )}

          {/* All Postings */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Job Postings</h2>
              <span className="text-xs font-semibold text-gray-500">
                {filteredJobs.length} available
              </span>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="text-center text-gray-500 py-12 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
                <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="font-bold text-base text-gray-800">No matching jobs found</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Try adjusting your search terms or tap one of the popular search tags above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {otherJobs.map((job, idx) => (
                  <JobCard key={idx} job={job} isRecommended={false} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function JobCard({ job, isRecommended }: { job: JobItem; isRecommended: boolean }) {
  const postDateFormatted = job.postDate
    ? new Date(job.postDate).toLocaleDateString()
    : "Recently";

  let badgeColorClass = "bg-blue-50 text-blue-700 border-blue-200";
  if (job.type === "Full-time") badgeColorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  else if (job.type === "Internship") badgeColorClass = "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div
      className={`bg-white p-4 sm:p-5 rounded-2xl shadow-xs border transition-all flex flex-col justify-between ${
        isRecommended
          ? "border-indigo-300 ring-2 ring-indigo-500/10 shadow-sm"
          : "border-gray-150 hover:border-indigo-300"
      }`}
    >
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-snug line-clamp-2">
              {job.title}
            </h3>
            <p className="text-xs text-gray-600 font-semibold truncate mt-1">
              {job.company}
            </p>
          </div>
          <span
            className={`text-[10px] font-bold py-0.5 px-2.5 rounded-full border shrink-0 ${badgeColorClass}`}
          >
            {job.type}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-2.5 flex items-center gap-1.5 font-medium truncate">
          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" /> {job.location}
        </p>

        {job.postDate && (
          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" /> Posted: {postDateFormatted}
          </p>
        )}

        {job.tags && job.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold py-0.5 px-2 rounded-md border border-indigo-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-md">
          {isRecommended ? "Top Match" : "Direct Role"}
        </span>
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-indigo-700 text-xs sm:text-sm transition min-h-[48px] shadow-xs active:scale-[0.98]"
          >
            <span>Apply Now</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
