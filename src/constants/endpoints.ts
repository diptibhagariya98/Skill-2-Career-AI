/**
 * Centralized API Endpoints and Application Routes
 * 
 * Supports both:
 * 1. Standard Next.js serverless route handlers (default for local dev)
 * 2. Dedicated Supabase Edge Functions (free-tier serverless workers for production & mobile APKs)
 */

// Custom API Base URL (if using a custom domain or proxy)
const API_BASE = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL)
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
  : "";

// Supabase Edge Functions Endpoint Base (derived dynamically from environment)
const SUPABASE_URL = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL)
  ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")
  : "";

const SUPABASE_FUNCTIONS_BASE = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : "";

// Enable Supabase Edge Functions by setting NEXT_PUBLIC_USE_EDGE_FUNCTIONS=true
const isUsingEdge = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_USE_EDGE_FUNCTIONS === "true";

// Internal client-side API endpoints
export const API_ROUTES = {
  GEMINI: isUsingEdge ? `${SUPABASE_FUNCTIONS_BASE}/gemini` : `${API_BASE}/api/gemini`,
  JOBS: isUsingEdge ? `${SUPABASE_FUNCTIONS_BASE}/jobs` : `${API_BASE}/api/jobs`,
  RESUME_ANALYZE: isUsingEdge ? `${SUPABASE_FUNCTIONS_BASE}/resume-analyze` : `${API_BASE}/api/resume/analyze`,
  HEALTH_SUPABASE: isUsingEdge ? `${SUPABASE_FUNCTIONS_BASE}/health` : `${API_BASE}/api/health/supabase`,
  AUTH_SEND_OTP: isUsingEdge ? `${SUPABASE_FUNCTIONS_BASE}/auth-send-otp` : `${API_BASE}/api/auth/send-otp`,
  AUTH_VERIFY_OTP: isUsingEdge ? `${SUPABASE_FUNCTIONS_BASE}/auth-verify-otp` : `${API_BASE}/api/auth/verify-otp`,
  AUTH_RESEND_OTP: isUsingEdge ? `${SUPABASE_FUNCTIONS_BASE}/auth-send-otp` : `${API_BASE}/api/auth/resend-otp`,
  AUTH_REGISTER: `${API_BASE}/api/auth/register`,
  RESUME_EXPORT: `${API_BASE}/api/resumes/export`,
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
