/**
 * Centralized API Endpoints and Application Routes
 * 
 * RULE: Do NOT hardcode API endpoints or internal route paths in components or route handlers.
 * Always import and reference from this file.
 */

// API Base URL prefix for remote mobile APK builds vs relative web dev
const API_BASE = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL)
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
  : "";

// Internal client-side API endpoints
export const API_ROUTES = {
  GEMINI: `${API_BASE}/api/gemini`,
  JOBS: `${API_BASE}/api/jobs`,
  RESUME_ANALYZE: `${API_BASE}/api/resume/analyze`,
} as const;

export type ApiRouteKey = keyof typeof API_ROUTES;
export type ApiRoutePath = (typeof API_ROUTES)[ApiRouteKey];

// Application navigation routes
export const APP_ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  LOGIN: "/login",
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;
export type AppRoutePath = (typeof APP_ROUTES)[AppRouteKey];

// Server-side external API endpoints & builders
export const EXTERNAL_API = {
  GEMINI_BASE: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
  getGeminiUrl: (apiKey: string): string =>
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
  RAPID_JOBS_BASE: "https://jsearch.p.rapidapi.com/search",
  RAPID_JOBS_HOST: "jsearch.p.rapidapi.com",
  getJobsUrl: (query: string): string =>
    `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1`,
} as const;
