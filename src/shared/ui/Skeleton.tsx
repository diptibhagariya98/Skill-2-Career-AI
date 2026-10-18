"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "rounded" | "pill";
  width?: string | number;
  height?: string | number;
}

/**
 * Primitive Skeleton component with luxury multi-stop shimmer animation
 */
export function Skeleton({
  variant = "rounded",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    rectangular: "rounded-none",
    rounded: "rounded-2xl",
    pill: "rounded-full",
    circular: "rounded-full aspect-square",
  }[variant];

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={`luxury-shimmer bg-slate-100 ${variantClasses} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * Luxurious Card Skeleton (matches job cards, mentor cards, module cards)
 */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      className={`bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 ${className}`}
    >
      {/* Header with avatar & badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton variant="rounded" className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        </div>
        <Skeleton variant="pill" className="h-6 w-16" />
      </div>

      {/* Body lines */}
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3.5 w-full rounded-md" />
        <Skeleton className="h-3.5 w-4/5 rounded-md" />
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Skeleton variant="pill" className="h-5 w-14" />
        <Skeleton variant="pill" className="h-5 w-20" />
        <Skeleton variant="pill" className="h-5 w-16" />
      </div>

      {/* Footer button */}
      <div className="pt-2">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Stats / Metric Box Skeleton
 */
export function SkeletonStats({ className = "" }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      className={`bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton variant="rounded" className="w-9 h-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
      <Skeleton className="h-3 w-28 rounded-md" />
    </div>
  );
}

/**
 * Job Finder Page Skeleton
 */
export function SkeletonJobs() {
  return (
    <div aria-busy="true" className="space-y-6 animate-fade-in">
      {/* Search Bar Skeleton */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 w-full sm:w-36 rounded-2xl shrink-0" />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[20, 24, 28, 22, 26].map((w, i) => (
          <Skeleton key={i} variant="pill" className={`h-8 w-${w} shrink-0`} />
        ))}
      </div>

      {/* Grid of Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/**
 * Resume Builder / Review Section Skeleton
 */
export function SkeletonResume() {
  return (
    <div aria-busy="true" className="space-y-6 animate-fade-in">
      {/* ATS Score Overview Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton variant="circular" className="w-28 h-28 rounded-full" />
      </div>

      {/* Action Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete Full-Page Dashboard Skeleton (Mobile & Desktop Aware)
 */
export function SkeletonDashboard() {
  return (
    <div aria-busy="true" className="min-h-screen bg-slate-50 pt-safe pb-safe animate-fade-in">
      {/* Top Header Placeholder */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton variant="rounded" className="w-9 h-9 rounded-xl" />
          <Skeleton className="h-5 w-28 rounded-lg" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton variant="pill" className="w-9 h-9" />
          <Skeleton variant="circular" className="w-9 h-9" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Welcome Banner Skeleton */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <Skeleton variant="pill" className="h-11 w-36 rounded-xl shrink-0" />
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <SkeletonStats />
          <SkeletonStats />
          <SkeletonStats />
          <SkeletonStats />
        </div>

        {/* Content Section: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart / Feed */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton variant="pill" className="h-8 w-24" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>

          {/* Activity / Next Actions */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-32 rounded-md" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50/70">
                  <Skeleton variant="rounded" className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
