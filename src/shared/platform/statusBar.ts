"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export enum AppStatusBarStyle {
  /** White text/icons on dark surfaces (e.g. slate-900 / black headers) */
  LIGHT_CONTENT = "LIGHT_CONTENT",
  /** Dark text/icons on light surfaces (e.g. white / gray-50 headers) */
  DARK_CONTENT = "DARK_CONTENT",
}

/**
 * Updates the native Android & iOS system status bar style to match the current screen/modal theme.
 * Gracefully no-ops in web browsers.
 */
export async function setAppStatusBarStyle(style: AppStatusBarStyle): Promise<void> {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return;
  }

  try {
    if (style === AppStatusBarStyle.LIGHT_CONTENT) {
      await StatusBar.setStyle({ style: Style.Dark });
    } else {
      await StatusBar.setStyle({ style: Style.Light });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("setAppStatusBarStyle error:", message);
  }
}

/**
 * React hook: declare the status bar icon style for the current screen on mount.
 * Automatically restores DARK_CONTENT (safe default for light-surface app) on unmount.
 *
 * Usage (one line per screen):
 *   useStatusBarStyle(AppStatusBarStyle.DARK_CONTENT);  // light-surface screens
 *   useStatusBarStyle(AppStatusBarStyle.LIGHT_CONTENT); // dark-surface screens / modals
 */
export function useStatusBarStyle(style: AppStatusBarStyle): void {
  useEffect(() => {
    void setAppStatusBarStyle(style);
    return () => {
      // Restore safe default when leaving the screen
      void setAppStatusBarStyle(AppStatusBarStyle.DARK_CONTENT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
