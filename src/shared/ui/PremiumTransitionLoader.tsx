"use client";

import { Sparkles } from "lucide-react";
import ResuMentorBrandLogo from "./ResuMentorBrandLogo";

export interface PremiumTransitionLoaderProps {
  /** Main title or greeting */
  label?: string;
  /** Explanatory subtext */
  subtitle?: string;
  /** Fullscreen overlay vs. inline card */
  fullscreen?: boolean;
}

/**
 * Luxurious, brand-aligned transition loading screen.
 * Displays during route changes, authentication evaluations, and primary module transitions.
 */
export function PremiumTransitionLoader({
  label = "Loading ResuMentor",
  subtitle = "Preparing your AI career workspace...",
  fullscreen = true,
}: PremiumTransitionLoaderProps) {
  const containerClasses = fullscreen
    ? "fixed inset-0 z-50 min-h-dvh flex items-center justify-center p-4 pt-safe pb-safe bg-gradient-to-br from-indigo-50/80 via-slate-50 to-teal-50/50"
    : "w-full py-16 flex items-center justify-center p-4";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={containerClasses}
    >
      {/* Ambient background glows */}
      {fullscreen && (
        <>
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none luxury-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-300/15 rounded-full blur-3xl pointer-events-none luxury-glow" style={{ animationDelay: "1.5s" }} />
        </>
      )}

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-sm bg-white/85 backdrop-blur-xl border border-white/80 p-8 rounded-3xl shadow-2xl shadow-indigo-100/60 flex flex-col items-center text-center animate-fade-in">
        
        {/* Glowing Brand Icon Capsule */}
        <div className="relative mb-5">
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-3xl blur-md opacity-30 animate-pulse" />
          <ResuMentorBrandLogo variant="ready" colorScheme="indigo" size={64} showWordmark={false} />
        </div>

        {/* Brand & Loading Labels */}
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          {label}
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px] font-medium leading-relaxed">
          {subtitle}
        </p>

        {/* Shimmering Progress Bar */}
        <div className="w-44 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-5 relative border border-slate-200/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400"
            style={{
              width: "100%",
              backgroundSize: "200% 100%",
              animation: "luxuryShimmer 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          />
        </div>

        {/* Subtle Micro-Tag */}
        <div className="mt-4 flex items-center space-x-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Syncing Cloud Engine</span>
        </div>
      </div>
    </div>
  );
}
