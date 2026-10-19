"use client";

import React from "react";
import { useAndroidBackButton } from "./backButton";
import { ensurePlatformListeners } from "./backNavigation";
import { KeyboardProvider } from "./keyboard";
import { OfflineBanner } from "../ui/OfflineBanner";

export interface NativeAppProviderProps {
  children: React.ReactNode;
}

/**
 * Global Native Platform Provider for Capacitor mobile integration:
 * - Initializes unified Android hardware & gesture back button priority dispatcher
 * - Tracks virtual keyboard state globally across all pages
 * - Renders floating offline/reconnected alert banner
 */
export function NativeAppProvider({ children }: NativeAppProviderProps) {
  // Wire global Android back button and platform listeners
  ensurePlatformListeners();
  useAndroidBackButton();

  return (
    <KeyboardProvider>
      <OfflineBanner />
      {children}
    </KeyboardProvider>
  );
}

export default NativeAppProvider;
