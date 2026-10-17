"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Search, MapPin, Briefcase, Calendar } from "lucide-react";
import { API_ROUTES } from "../constants/endpoints";

interface JobItem {
  title: string;
  company: string;
  location: string;
  type: string;
  tags: string[];
  url?: string;
  postDate?: string;
}

export default function JobFinder() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    fetchJobs(keyword, location);
  };

  const recommendedJobs = jobs.slice(0, 2);
  const allJobs = jobs.slice(2);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search Form */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="job-keyword" className="block text-sm font-medium text-gray-700">
              Keywords (Title, Skill)
            </label>
            <input
              type="text"
              id="job-keyword"
              placeholder="e.g., React Developer"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="job-location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="job-location"
              placeholder="e.g., Mumbai, Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 h-[42px]"
          >
            <Search className="h-4 w-4" /> {loading ? "Searching..." : "Search Jobs"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Fetching job postings...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 text-center">
          <p className="font-semibold">Error Loading Jobs</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : (
        <>
          {/* Recommended Jobs */}
          {recommendedJobs.length > 0 && (
            <div id="recommended-section">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Recommended For You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedJobs.map((job, idx) => (
                  <JobCard key={idx} job={job} isRecommended={true} />
                ))}
              </div>
            </div>
          )}

          {/* All Jobs */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Job Postings</h2>
              <span className="text-sm font-medium text-gray-500">
                {jobs.length} jobs found
              </span>
            </div>
            {jobs.length === 0 ? (
              <div className="text-center text-gray-500 py-12 bg-white rounded-xl shadow-md border border-dashed border-gray-300">
                <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="font-semibold text-lg">No matching jobs found.</p>
                <p className="text-sm text-gray-400">Try modifying your keywords or location search.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {allJobs.map((job, idx) => (
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

  let badgeColorClass = "bg-blue-100 text-blue-800";
  if (job.type === "Full-time") badgeColorClass = "bg-green-100 text-green-800";
  else if (job.type === "Internship") badgeColorClass = "bg-yellow-100 text-yellow-800";

  return (
    <div
      className={`bg-white p-5 rounded-xl shadow-md border hover:border-indigo-500 transition-all ${
        isRecommended ? "border-indigo-200 ring-2 ring-indigo-500 ring-opacity-10" : "border-transparent"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-600 font-medium">{job.company}</p>
        </div>
        <span className={`text-xs font-semibold py-1 px-3 rounded-full whitespace-nowrap ${badgeColorClass}`}>
          {job.type}
        </span>
      </div>
      <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5 font-medium">
        <MapPin className="h-4 w-4 text-gray-400" /> {job.location}
      </p>

      {job.postDate && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> Posted: {postDateFormatted}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {job.tags.map((tag, idx) => (
          <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 font-medium py-1 px-2 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-gray-100 text-right">
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm transition"
          >
            Apply Now
          </a>
        )}
      </div>
    </div>
  );
}
