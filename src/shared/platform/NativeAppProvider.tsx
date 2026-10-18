"use client";

import React from "react";
import { useAndroidBackButton } from "./backButton";
import { KeyboardProvider } from "./keyboard";
import { OfflineBanner } from "../ui/OfflineBanner";

export interface NativeAppProviderProps {
  children: React.ReactNode;
}

/**
 * Global Native Platform Provider for Capacitor mobile integration:
 * - Listens to Android hardware back button
 * - Tracks virtual keyboard state globally across all pages
 * - Renders floating offline/reconnected alert banner
 */
export function NativeAppProvider({ children }: NativeAppProviderProps) {
  // Wire global Android back button
  useAndroidBackButton();

  return (
    <KeyboardProvider>
      <OfflineBanner />
      {children}
    </KeyboardProvider>
  );
}

export default NativeAppProvider;
