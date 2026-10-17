"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { Filter, ExternalLink } from "lucide-react";

export default function Scholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [currentTab, setCurrentTab] = useState("All");
  const [cgpa, setCgpa] = useState("");
  const [income, setIncome] = useState("");
  const [category, setCategory] = useState(""); // Category from dropdown ('General', 'OBC', 'SC/ST')

  const [activeFilters, setActiveFilters] = useState({
    cgpa: null,
    income: null,
    studentCategory: null,
  });

  const fetchScholarships = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "scholarship"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setScholarships(docs);
    } catch (err) {
      setError(err.message || "Failed to load scholarship schemes.");
      toast.error("Error fetching scholarship database. Please check connection and Firestore rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarships();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setActiveFilters({
      cgpa: cgpa ? parseFloat(cgpa) : null,
      income: income ? parseFloat(income) : null,
      studentCategory: category || null,
    });
    toast.success("Eligibility filters applied!");
  };

  const checkEligibility = (scheme) => {
    let isEligible = true;
    let reason = "Fully Eligible";

    // 1. Tab category source filtering (handled in render list filtering, but good to check)
    if (currentTab !== "All" && scheme.category !== currentTab) {
      return { isEligible: false, reason: "Filtered by Tab" };
    }

    // 2. CGPA check
    if (activeFilters.cgpa !== null && scheme.minCGPA) {
      if (activeFilters.cgpa < scheme.minCGPA) {
        isEligible = false;
        reason = `Requires ${scheme.minCGPA}+ CGPA`;
      }
    }

    // 3. Income check
    if (activeFilters.income !== null && scheme.maxIncome) {
      if (activeFilters.income > scheme.maxIncome) {
        isEligible = false;
        reason = `Max income ₹${scheme.maxIncome.toLocaleString()}`;
      }
    }

    // 4. Student Category check
    if (activeFilters.studentCategory && activeFilters.studentCategory !== "Any" && scheme.categories) {
      const studentCat = activeFilters.studentCategory.toUpperCase().replace("/", "");
      const schemeCategories = scheme.categories.map((c) => c.toUpperCase().replace("/", ""));
      if (!schemeCategories.includes(studentCat)) {
        isEligible = false;
        reason = `Not eligible for category ${activeFilters.studentCategory}`;
      }
    }

    return { isEligible, reason };
  };

  // Filter list by currentTab
  const listToRender = scholarships.filter((scheme) => {
    return currentTab === "All" || scheme.category === currentTab;
  });

  const hasEligibilityChecked =
    activeFilters.cgpa !== null || activeFilters.income !== null || activeFilters.studentCategory !== null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Eligibility Checker Form */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Check Your Eligibility</h2>
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="filter-cgpa" className="block text-sm font-medium text-gray-700">
              Your CGPA (out of 10)
            </label>
            <input
              type="number"
              id="filter-cgpa"
              step="0.1"
              placeholder="e.g., 8.5"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="filter-income" className="block text-sm font-medium text-gray-700">
              Annual Family Income (₹)
            </label>
            <input
              type="number"
              id="filter-income"
              placeholder="e.g., 450000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700">
              Your Category
            </label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            >
              <option value="">Any</option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC/ST">SC/ST</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 h-[42px]"
          >
            <Filter className="h-4 w-4" /> Filter Schemes
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {["All", "Gujarat", "Central"].map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`font-semibold py-2 px-4 rounded-lg transition ${
              currentTab === tab
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            {tab === "All" ? "All Schemes" : tab}
          </button>
        ))}
      </div>

      {/* Scholarship Listings */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Loading scholarships...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 text-center">
          <p className="font-semibold">Error Loading Scholarships</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : listToRender.length === 0 ? (
        <p className="text-gray-600 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          No scholarships found for the selected category source ({currentTab}).
        </p>
      ) : (
        <div className="space-y-6">
          {listToRender.map((scheme) => {
            const eligibility = checkEligibility(scheme);
            
            let badgeClass = "text-gray-500 bg-gray-100";
            let badgeText = "Check Eligibility Above";

            if (hasEligibilityChecked) {
              if (eligibility.isEligible) {
                badgeClass = "text-green-700 bg-green-100 border border-green-300";
                badgeText = "✅ Fully Eligible";
              } else {
                badgeClass = "text-red-700 bg-red-100 border border-red-300";
                badgeText = `❌ Ineligible: ${eligibility.reason}`;
              }
            }

            const maxAmountFormatted = scheme.maxAmount ? scheme.maxAmount.toLocaleString("en-IN") : "N/A";
            const maxIncomeFormatted = scheme.maxIncome ? scheme.maxIncome.toLocaleString("en-IN") : "N/A";

            return (
              <div
                key={scheme.id}
                className={`bg-white p-6 rounded-xl shadow-lg border-l-4 hover:shadow-xl transition duration-150 ${
                  hasEligibilityChecked
                    ? eligibility.isEligible
                      ? "border-green-500"
                      : "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-bold text-gray-900">{scheme.name}</h3>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4 border-b pb-4">
                  <div>
                    <p className="font-medium text-gray-400">Max Benefit</p>
                    <p className="text-lg text-indigo-600 font-bold">₹ {maxAmountFormatted}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-400">Min CGPA</p>
                    <p className="text-lg text-gray-800 font-bold">{scheme.minCGPA || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-400">Max Income</p>
                    <p className="text-lg text-gray-800 font-bold">₹ {maxIncomeFormatted}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-400">Source</p>
                    <p className="text-lg text-gray-800 font-bold">{scheme.category || "N/A"}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="font-semibold text-gray-800">Benefits:</p>
                  <p className="text-sm text-gray-600 mt-0.5">{scheme.benefits || "Detailed benefits not provided."}</p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-sm text-gray-500 font-medium">
                    Eligible Categories: {scheme.categories ? scheme.categories.join(", ") : "All"}
                  </p>
                  <a
                    href={scheme.applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-600 transition flex items-center gap-1.5"
                  >
                    Apply Now <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipient Connect Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect with Scholarship Recipients</h2>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-gray-600 mb-4 font-medium">
            Connect with students who have successfully received these scholarships. (Please be respectful and responsible).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-400 font-bold text-sm">
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">College</th>
                  <th className="py-3 px-2">Scholarship</th>
                  <th className="py-3 px-2">Contact (WhatsApp)</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm">
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">Ananya Sharma</td>
                  <td className="py-3 px-2">BMCET, SURAT</td>
                  <td className="py-3 px-2">Central Scheme CSSS</td>
                  <td className="py-3 px-2 font-bold text-indigo-600">98765-85142</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">Rahul Verma</td>
                  <td className="py-3 px-2">BMCET, SURAT</td>
                  <td className="py-3 px-2">Central Scheme CSSS</td>
                  <td className="py-3 px-2 font-bold text-indigo-600">98765-97432</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">Priya Singh</td>
                  <td className="py-3 px-2">BMCET, SURAT</td>
                  <td className="py-3 px-2">State Scheme MYSY</td>
                  <td className="py-3 px-2 font-bold text-indigo-600">98765-54763</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">Vikram Yadav</td>
                  <td className="py-3 px-2">BMCET, SURAT</td>
                  <td className="py-3 px-2">State Scheme MYSY</td>
                  <td className="py-3 px-2 font-bold text-indigo-600">98765-51474</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
