import { NextRequest, NextResponse } from "next/server";
import { EXTERNAL_API } from "@/constants/endpoints";
import { getErrorMessage } from "@/constants/auth";

export const dynamic = "force-dynamic";

interface RapidApiJobItem {
  job_title: string;
  employer_name: string;
  job_city?: string;
  job_country?: string;
  job_employment_type?: string;
  job_highlights?: {
    Responsibilities?: string[];
    Qualifications?: string[];
  };
  job_apply_link?: string;
  job_posted_at_datetime_utc?: string;
}

const FALLBACK_JOBS: RapidApiJobItem[] = [
  {
    job_title: "Junior React & Next.js Developer",
    employer_name: "TechInnovate Solutions",
    job_city: "Bangalore",
    job_country: "India",
    job_employment_type: "Full-time",
    job_highlights: {
      Responsibilities: [
        "Build responsive web interfaces using React 18, TypeScript, and TailwindCSS",
        "Collaborate with backend engineers to integrate GraphQL and REST APIs",
      ],
      Qualifications: ["Proficiency in JavaScript ES6+, React, and HTML5/CSS3"],
    },
    job_apply_link: "https://www.linkedin.com/jobs",
    job_posted_at_datetime_utc: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    job_title: "AI / ML Engineering Intern",
    employer_name: "NeuralSphere Labs",
    job_city: "Remote",
    job_country: "India",
    job_employment_type: "Internship",
    job_highlights: {
      Responsibilities: [
        "Assist in fine-tuning LLM embeddings and evaluation pipelines",
        "Implement RAG (Retrieval-Augmented Generation) microservices using Python",
      ],
      Qualifications: ["Knowledge of Python, PyTorch/TensorFlow, and vector databases"],
    },
    job_apply_link: "https://internshala.com",
    job_posted_at_datetime_utc: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    job_title: "Backend Node.js Engineer",
    employer_name: "CloudScale Systems",
    job_city: "Hyderabad",
    job_country: "India",
    job_employment_type: "Full-time",
    job_highlights: {
      Responsibilities: [
        "Design scalable microservices using Express, PostgreSQL, and Redis",
        "Maintain zero-downtime CI/CD deployment pipelines on AWS",
      ],
      Qualifications: ["Strong grasp of asynchronous programming and database indexing"],
    },
    job_apply_link: "https://www.naukri.com",
    job_posted_at_datetime_utc: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    job_title: "Full Stack Software Fresher",
    employer_name: "FinPulse Global",
    job_city: "Pune",
    job_country: "India",
    job_employment_type: "Full-time",
    job_highlights: {
      Responsibilities: [
        "Develop web features across frontend components and database layers",
        "Write comprehensive unit and integration tests with Jest and Playwright",
      ],
      Qualifications: ["Bachelor's degree in Computer Science or related technical discipline"],
    },
    job_apply_link: "https://www.linkedin.com/jobs",
    job_posted_at_datetime_utc: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    job_title: "Frontend UI/UX Intern",
    employer_name: "DesignCraft Studios",
    job_city: "Mumbai",
    job_country: "India",
    job_employment_type: "Internship",
    job_highlights: {
      Responsibilities: [
        "Translate Figma designs and wireframes into clean, accessible web components",
        "Implement micro-animations and responsive mobile-first views",
      ],
      Qualifications: ["Familiarity with Figma, TailwindCSS, and modern JavaScript"],
    },
    job_apply_link: "https://internshala.com",
    job_posted_at_datetime_utc: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "Developer in India";
    const location = searchParams.get("location") || "";

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({
        data: FALLBACK_JOBS,
        isFallback: true,
        notice: "Displaying curated job opportunities. Configure RAPIDAPI_KEY for real-time live web searches.",
      });
    }

    const combinedQuery = location ? `${query} in ${location}` : query;
    const url = EXTERNAL_API.getJobsUrl(combinedQuery);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": EXTERNAL_API.RAPID_JOBS_HOST,
        },
      });

      if (!response.ok) {
        console.warn(`[Jobs API]: RapidAPI responded with status ${response.status}. Serving curated fallback.`);
        return NextResponse.json({
          data: FALLBACK_JOBS,
          isFallback: true,
        });
      }

      const data: unknown = await response.json();
      return NextResponse.json(data);
    } catch (fetchError: unknown) {
      console.warn("[Jobs API]: Network error calling RapidAPI. Serving curated fallback:", fetchError);
      return NextResponse.json({
        data: FALLBACK_JOBS,
        isFallback: true,
      });
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Internal Server Error") },
      { status: 500 }
    );
  }
}
