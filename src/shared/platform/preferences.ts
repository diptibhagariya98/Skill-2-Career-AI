"use client";

import { isNative } from "./device";

/**
 * Cross-platform persistent key-value store:
 * - Native: @capacitor/preferences (isolated SharedPreferences on Android, not clearable on low memory)
 * - Web: window.localStorage with error guards
 */

export async function getPreference(key: string): Promise<string | null> {
  if (isNative()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key });
      return value;
    } catch (e: unknown) {
      console.warn("[getPreference Native Error]:", e);
    }
  }

  if (typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  return null;
}

export async function setPreference(key: string, value: string): Promise<void> {
  if (isNative()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key, value });
      return;
    } catch (e: unknown) {
      console.warn("[setPreference Native Error]:", e);
    }
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      console.warn("[setPreference Web Error]:", err);
    }
  }
}

export async function removePreference(key: string): Promise<void> {
  if (isNative()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key });
      return;
    } catch (e: unknown) {
      console.warn("[removePreference Native Error]:", e);
    }
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // safe fallback
    }
  }
}
