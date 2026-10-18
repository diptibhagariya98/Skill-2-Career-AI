import React from "react";
import { PremiumTransitionLoader } from "@/shared/ui/PremiumTransitionLoader";

/**
 * Root Next.js Loading Boundary.
 * Automatically triggered by Next.js during client-side route transitions.
 */
export default function Loading() {
  return (
    <PremiumTransitionLoader
      label="Loading ResuMentor"
      subtitle="Connecting your personalized workspace..."
      fullscreen={true}
    />
  );
}
