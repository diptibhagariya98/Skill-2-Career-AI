"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "../components/LandingPage";
import IntroScreens, { INTRO_STORAGE_KEY } from "../components/mobile/IntroScreens";
import Auth from "../components/Auth";
import { isNative } from "@/shared/platform";
import { supabase } from "@/lib/supabase";
import { APP_ROUTES } from "@/constants/endpoints";

type ScreenState = "evaluating" | "intro" | "auth" | "landing";

export default function Home() {
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>("evaluating");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    let isMounted = true;

    const evaluateScreen = async () => {
      // 1. Determine if current environment is mobile viewport (< 768px) or native Capacitor shell
      const isMobile =
        typeof window !== "undefined" &&
        (window.innerWidth < 768 || isNative());

      if (!isMobile) {
        // Desktop website: Always show the full website landing page
        if (isMounted) setScreenState("landing");
        return;
      }

      // 2. Mobile environment: Check if session is already active
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // If logged in on mobile -> jump straight to Dashboard (never show landing page)
          router.replace(APP_ROUTES.DASHBOARD);
          return;
        }
      } catch (err) {
        console.warn("[Mobile Auth Session Check Notice]:", err);
      }

      // 3. User is NOT logged in on mobile: Check if the 3-screen intro tour was seen
      let seen = false;
      try {
        seen = localStorage.getItem(INTRO_STORAGE_KEY) === "true";
      } catch {
        // Fallback if localStorage restricted
      }

      if (!seen) {
        // First launch on mobile: Show Intro Tour
        if (isMounted) setScreenState("intro");
        return;
      }

      // 4. Mobile user has completed the intro tour and is not logged in:
      // Show Login / Sign Up directly — NEVER show the desktop marketing landing page!
      if (isMounted) setScreenState("auth");
    };

    evaluateScreen();

    // Listen for auth state changes on mobile (e.g. if user logs in)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || isNative());
      if (session?.user && isMobile) {
        router.replace(APP_ROUTES.DASHBOARD);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // While evaluating first-launch decision, render a smooth matching splash container
  if (screenState === "evaluating") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 animate-pulse">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <p className="mt-4 text-xs font-bold tracking-wider uppercase text-slate-400">ResuMentor</p>
      </div>
    );
  }

  // First-launch mobile users see the curated native intro screens
  if (screenState === "intro") {
    return (
      <IntroScreens
        onFinish={(action) => {
          if (action === "guest") {
            router.replace(`${APP_ROUTES.DASHBOARD}?guest=true`);
          } else if (action === "login") {
            setAuthMode("login");
            setScreenState("auth");
          } else {
            setAuthMode("register");
            setScreenState("auth");
          }
        }}
      />
    );
  }

  // Mobile users after tour or when returning: Show Login / Sign Up directly (never Landing Page)
  if (screenState === "auth") {
    return <Auth initialMode={authMode} />;
  }

  // Desktop website visitors: Show full desktop website marketing landing page
  return <LandingPage />;
}
