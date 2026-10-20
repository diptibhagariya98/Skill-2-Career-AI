"use client";

import { isNative } from "./device";

/**
 * Open external web URLs safely.
 *
 * Android Native:
 *   Opens via In-App Chrome Custom Tab (@capacitor/browser).
 *   This preserves the app lifecycle and keeps the app's WebView session intact.
 *
 * Web:
 *   Opens in a new tab with noopener, noreferrer protection.
 */
export async function openUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== "string" || !url.trim() || url === "https://none") {
    console.warn("[openUrl]: Invalid or placeholder URL omitted:", url);
    return false;
  }

  let cleanUrl = url.trim();
  if (
    typeof window !== "undefined" &&
    !cleanUrl.startsWith("http://") &&
    !cleanUrl.startsWith("https://") &&
    !cleanUrl.startsWith("mailto:") &&
    !cleanUrl.startsWith("tel:")
  ) {
    try {
      cleanUrl = new URL(cleanUrl, window.location.origin).href;
    } catch {
      // Ignore if URL resolution fails
    }
  }

  if (isNative()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({
        url: cleanUrl,
        presentationStyle: "popover",
        toolbarColor: "#1e1b4b",
      });
      return true;
    } catch (nativeErr: unknown) {
      console.warn("[openUrl Native Fallback]:", nativeErr);
    }
  }

  // Web Browser fallback
  if (typeof window !== "undefined") {
    try {
      const newTab = window.open(cleanUrl, "_blank", "noopener,noreferrer");
      return !!newTab;
    } catch (webErr: unknown) {
      console.error("[openUrl Web Failed]:", webErr);
      return false;
    }
  }

  return false;
}
