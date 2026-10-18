import React from "react";
import { SkeletonDashboard } from "@/shared/ui/Skeleton";

/**
 * Next.js Dashboard Route Loading Boundary.
 * Displays the high-fidelity skeleton dashboard during navigation to /dashboard.
 */
export default function DashboardLoading() {
  return <SkeletonDashboard />;
}
