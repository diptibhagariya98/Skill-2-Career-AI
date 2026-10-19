"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "../components/LandingPage";
import IntroScreens, { INTRO_STORAGE_KEY } from "../components/mobile/IntroScreens";
import Auth from "../components/Auth";
import { isNative } from "@/shared/platform";
import { supabase } from "@/lib/supabase";
import { APP_ROUTES } from "@/constants/endpoints";
import { PremiumTransitionLoader } from "@/shared/ui/PremiumTransitionLoader";
import { AuthMode } from "@/constants/auth";

enum ScreenState {
  EVALUATING = "EVALUATING",
  INTRO = "INTRO",
  AUTH = "AUTH",
  LANDING = "LANDING",
}

export default function Home() {
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>(ScreenState.EVALUATING);
  const [authMode, setAuthMode] = useState<AuthMode>(AuthMode.LOGIN);

  useEffect(() => {
    let isMounted = true;

    const evaluateScreen = async () => {
      // 1. Determine if current environment is mobile viewport (< 768px) or native Capacitor shell
      const isMobile =
        typeof window !== "undefined" &&
        (window.innerWidth < 768 || isNative());

      if (!isMobile) {
        // Desktop website: Always show the full website landing page
        if (isMounted) setScreenState(ScreenState.LANDING);
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
      } catch (err: unknown) {
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
        if (isMounted) setScreenState(ScreenState.INTRO);
        return;
      }

      // 4. Mobile user has completed the intro tour and is not logged in:
      // Show Login / Sign Up directly — NEVER show the desktop marketing landing page!
      if (isMounted) setScreenState(ScreenState.AUTH);
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

  // While evaluating first-launch decision, render the luxury branded loader
  if (screenState === ScreenState.EVALUATING) {
    return (
      <PremiumTransitionLoader
        label="Welcome to ResuMentor"
        subtitle="Optimizing your mobile career experience..."
        fullscreen={true}
      />
    );
  }

  // First-launch mobile users see the curated native intro screens
  if (screenState === ScreenState.INTRO) {
    return (
      <IntroScreens
        onFinish={(action) => {
          if (action === "guest") {
            router.replace(`${APP_ROUTES.DASHBOARD}?guest=true`);
          } else if (action === "login") {
            setAuthMode(AuthMode.LOGIN);
            setScreenState(ScreenState.AUTH);
          } else {
            setAuthMode(AuthMode.REGISTER);
            setScreenState(ScreenState.AUTH);
          }
        }}
      />
    );
  }

  // Mobile users after tour or when returning: Show Login / Sign Up directly (never Landing Page)
  if (screenState === ScreenState.AUTH) {
    return <Auth initialMode={authMode} />;
  }

  // Desktop website visitors: Show full desktop website marketing landing page
  return <LandingPage />;
}
