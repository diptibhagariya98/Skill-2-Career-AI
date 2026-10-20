"use client";

import React, { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useAndroidBackButton } from "./backButton";
import { ensurePlatformListeners } from "./backNavigation";
import { KeyboardProvider } from "./keyboard";
import { initSafeAreaSynchronization } from "./safeArea";
import { OfflineBanner } from "../ui/OfflineBanner";

export interface NativeAppProviderProps {
  children: React.ReactNode;
}

/**
 * Global Native Platform Provider for Capacitor mobile integration:
 * - Initializes unified Android hardware & gesture back button priority dispatcher
 * - Tracks virtual keyboard state globally across all pages
 * - Renders floating offline/reconnected alert banner
 * - Injects hardware safe area insets (--sat, --sab) and sets data-platform on Android
 */
export function NativeAppProvider({ children }: NativeAppProviderProps) {
  // Wire global Android back button and platform listeners
  ensurePlatformListeners();
  useAndroidBackButton();

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const platform = Capacitor.getPlatform();
      if (platform === "android") {
        document.documentElement.setAttribute("data-platform", "android");
      }
    } catch {
      // Graceful fallback for non-native web
    }

    // Initialize unified Option A + Option C safe area detection and live synchronization
    const cleanupSafeArea = initSafeAreaSynchronization();
    return () => {
      cleanupSafeArea();
    };
  }, []);

  return (
    <KeyboardProvider>
      <OfflineBanner />
      {children}
    </KeyboardProvider>
  );
}

export default NativeAppProvider;
