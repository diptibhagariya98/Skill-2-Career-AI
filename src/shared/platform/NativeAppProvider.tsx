"use client";

import React from "react";
import { useAndroidBackButton } from "./backButton";
import { OfflineBanner } from "../ui/OfflineBanner";

export interface NativeAppProviderProps {
  children: React.ReactNode;
}

/**
 * Global Native Platform Provider for Capacitor mobile integration:
 * - Listens to Android hardware back button
 * - Renders floating offline/reconnected alert banner
 */
export function NativeAppProvider({ children }: NativeAppProviderProps) {
  // Wire global Android back button
  useAndroidBackButton();

  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
}

export default NativeAppProvider;
