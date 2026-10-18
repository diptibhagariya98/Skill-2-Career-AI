"use client";

import React from "react";

export type LogoVariant = "ready" | "A" | "B" | "C";

interface BrandLogoProps {
  variant?: LogoVariant;
  size?: number | "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  theme?: "light" | "dark";
  className?: string;
  badgeClassName?: string;
}

export default function ResuMentorBrandLogo({
  variant = "ready",
  size = "md",
  showWordmark = false,
  theme = "light",
  className = "",
  badgeClassName = "",
}: BrandLogoProps) {
  const pixelSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 28
      : size === "md"
      ? 36
      : size === "lg"
      ? 48
      : 64;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Mark: Ready Teal Squircle + White Line-Art Graduation Cap */}
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 drop-shadow-sm ${badgeClassName}`}
      >
        <defs>
          <linearGradient id="rm-teal-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>
        </defs>

        {/* Teal Rounded Squircle */}
        <rect width="100" height="100" rx="28" fill="url(#rm-teal-bg)" />

        {/* Crisp White Line-Art Graduation Cap */}
        <g stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          {/* Mortarboard Rhombus */}
          <path d="M50 29L81 42L50 55L19 42L50 29Z" />

          {/* Cap Headband Arc */}
          <path d="M33 48V59C33 65.5 40 70 50 70C60 70 67 65.5 67 59V48" />

          {/* Right Tassel */}
          <path d="M74 44.5V57" />
        </g>
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span
          className={`font-black tracking-tight leading-none ${
            pixelSize >= 48
              ? "text-2xl"
              : pixelSize >= 36
              ? "text-xl"
              : "text-base"
          }`}
        >
          <span className={theme === "dark" ? "text-white" : "text-slate-900"}>
            Resu
          </span>
          <span className={theme === "dark" ? "text-teal-400" : "text-teal-600"}>
            Mentor
          </span>
        </span>
      )}
    </div>
  );
}

