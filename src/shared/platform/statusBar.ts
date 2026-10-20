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
    // Graceful fallback for web/unsupported runtimes
    const message = error instanceof Error ? error.message : String(error);
    console.warn("setAppStatusBarStyle error:", message);
  }
}
