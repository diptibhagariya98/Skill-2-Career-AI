"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "../components/LandingPage";
import IntroScreens, { INTRO_STORAGE_KEY } from "../components/mobile/IntroScreens";
import { isNative } from "@/shared/platform";
import { supabase } from "@/lib/supabase";
import { APP_ROUTES } from "@/constants/endpoints";

export default function Home() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Determine if current environment is mobile viewport or native Capacitor shell
    const isMobileViewport =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || isNative());

    if (!isMobileViewport) {
      // Desktop web: always show the complete desktop landing page directly
      setShowIntro(false);
      return;
    }

    // 2. Mobile startup evaluation: check if intro was previously seen
    try {
      const seen = localStorage.getItem(INTRO_STORAGE_KEY);
      if (!seen) {
        // First launch on mobile: render Intro screens
        setShowIntro(true);
        return;
      }
    } catch {
      // Fallback if localStorage restricted
    }

    // 3. Intro was already seen on mobile: check if session is active
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isNative()) {
        // In native mobile app with active session, jump straight to dashboard
        router.replace(APP_ROUTES.DASHBOARD);
      } else {
        setShowIntro(false);
      }
    });
  }, [router]);

  // While evaluating first-launch decision, render a smooth matching splash container
  if (showIntro === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 animate-pulse">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <p className="mt-4 text-xs font-bold tracking-wider uppercase text-gray-400">ResuMentor</p>
      </div>
    );
  }

  // First-launch mobile users see the curated native intro screens
  if (showIntro) {
    return (
      <IntroScreens
        onFinish={(action) => {
          if (action === "guest") {
            router.push(`${APP_ROUTES.DASHBOARD}?guest=true`);
          } else if (action === "login") {
            router.push(`${APP_ROUTES.AUTH}?mode=login`);
          } else {
            router.push(APP_ROUTES.AUTH);
          }
        }}
      />
    );
  }

  // Desktop or returning mobile users see the website landing page
  return <LandingPage />;
}
