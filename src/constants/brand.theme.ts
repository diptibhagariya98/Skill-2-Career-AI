/**
 * Brand Theme Configuration
 * Single source of truth for Web App, Mobile, and Branded Transactional Emails.
 * Compatible with React Email (plain hex colors & inline styles) and Tailwind.
 */

export const BRAND = {
  name: "ResuMentor",
  tagline: "Next-Gen Student Career Companion",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://resumentor.app",
  supportEmail: "support@resumentor.app",
  companyAddress: "ResuMentor Inc. • AI Career Mentorship Platform",
  logo: {
    src: "/logo.png",
    width: 48,
    height: 48,
    alt: "ResuMentor",
  },
  colors: {
    primary: "#4F46E5",        // Indigo-600 (Signature brand color)
    primaryHover: "#4338CA",   // Indigo-700
    primaryLight: "#EEF2FF",   // Indigo-50
    secondary: "#0D9488",      // Teal-600 (Accent color)
    background: "#F8FAFC",     // Slate-50 (Email background)
    surface: "#FFFFFF",        // White (Card body)
    text: "#0F172A",           // Slate-900 (High contrast heading)
    textSecondary: "#334155",  // Slate-700 (Body text)
    muted: "#64748B",          // Slate-500 (Footers, helper text)
    border: "#E2E8F0",         // Slate-200 (Dividers, borders)
    danger: "#EF4444",         // Red-500
    success: "#10B981",        // Emerald-500
  },
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  radius: 10,
} as const;

export type BrandTheme = typeof BRAND;
