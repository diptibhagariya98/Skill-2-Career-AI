"use client";

import { Capacitor } from "@capacitor/core";

/**
 * Enums representing the detection source of device hardware insets
 */
export enum InsetDetectionSource {
  OPTION_A_SAFE_AREA_PLUGIN = "OPTION_A_SAFE_AREA_PLUGIN",
  OPTION_C_STATUS_BAR_PLUGIN = "OPTION_C_STATUS_BAR_PLUGIN",
  OPTION_C_CSS_SAFE_AREA = "OPTION_C_CSS_SAFE_AREA",
  FALLBACK_DEFAULT = "FALLBACK_DEFAULT",
}

/**
 * Safe area detection status enum
 */
export enum SafeAreaStatus {
  SUCCESS = "SUCCESS",
  FAILED_PLUGIN_RETURNED_ZERO = "FAILED_PLUGIN_RETURNED_ZERO",
  UNSUPPORTED_PLATFORM = "UNSUPPORTED_PLATFORM",
}

/**
 * Fallback constants for status bar and navigation bar heights
 * used when plugins fail to detect hardware insets (e.g. return 0).
 */
export const SAFE_AREA_FALLBACKS = {
  ANDROID_STATUS_BAR_PX: 36,
  ANDROID_NAV_BAR_PX: 24,
  DESKTOP_WEB_PX: 0,
} as const;

export interface DeviceSafeAreaMetrics {
  top: number;
  bottom: number;
  left: number;
  right: number;
  source: InsetDetectionSource;
  status: SafeAreaStatus;
}

/**
 * Parses numeric pixel value from CSS custom properties (e.g. "48px" -> 48)
 */
function parseCssPxValue(value: string): number {
  if (!value) return 0;
  const parsed = parseFloat(value.replace("px", "").trim());
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

/**
 * Resolves the device status bar and safe area insets by combining:
 * 1. Option A: `capacitor-plugin-safe-area` (hardware getStatusBarHeight / getSafeAreaInsets)
 * 2. Option C: `@capacitor-community/safe-area` (CSS safe area injection) + `@capacitor/status-bar` (StatusBar.getInfo)
 * 
 * Condition:
 * If the value returned is 0 or less, it indicates the plugin/package failed to detect
 * the hardware status bar. In that case, applies SAFE_AREA_FALLBACKS.ANDROID_STATUS_BAR_PX (36px).
 */
export async function getDeviceSafeAreaMetrics(): Promise<DeviceSafeAreaMetrics> {
  if (typeof window === "undefined") {
    return {
      top: SAFE_AREA_FALLBACKS.DESKTOP_WEB_PX,
      bottom: SAFE_AREA_FALLBACKS.DESKTOP_WEB_PX,
      left: SAFE_AREA_FALLBACKS.DESKTOP_WEB_PX,
      right: SAFE_AREA_FALLBACKS.DESKTOP_WEB_PX,
      source: InsetDetectionSource.FALLBACK_DEFAULT,
      status: SafeAreaStatus.UNSUPPORTED_PLATFORM,
    };
  }

  const isAndroid = Capacitor.getPlatform() === "android";
  const isIos = Capacitor.getPlatform() === "ios";
  const isNative = isAndroid || isIos;

  let resolvedTop = 0;
  let resolvedBottom = 0;
  let resolvedLeft = 0;
  let resolvedRight = 0;
  let source = InsetDetectionSource.FALLBACK_DEFAULT;

  // -------------------------------------------------------------
  // STEP 1: Option A (`capacitor-plugin-safe-area`)
  // -------------------------------------------------------------
  if (isNative) {
    try {
      const { SafeArea } = await import("capacitor-plugin-safe-area");
      
      // Query Option A: getStatusBarHeight
      const statusBarResult = await SafeArea.getStatusBarHeight().catch(() => null);
      if (statusBarResult && typeof statusBarResult.statusBarHeight === "number" && statusBarResult.statusBarHeight > 0) {
        resolvedTop = statusBarResult.statusBarHeight;
        source = InsetDetectionSource.OPTION_A_SAFE_AREA_PLUGIN;
      }

      // Query Option A: getSafeAreaInsets
      const insetsResult = await SafeArea.getSafeAreaInsets().catch(() => null);
      if (insetsResult && insetsResult.insets) {
        const { insets } = insetsResult;
        if (insets.top > 0 && resolvedTop === 0) {
          resolvedTop = insets.top;
          source = InsetDetectionSource.OPTION_A_SAFE_AREA_PLUGIN;
        }
        if (insets.bottom > 0) {
          resolvedBottom = insets.bottom;
        }
        if (insets.left > 0) resolvedLeft = insets.left;
        if (insets.right > 0) resolvedRight = insets.right;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn("[SafeArea:OptionA] Query failed:", msg);
    }
  }

  // -------------------------------------------------------------
  // STEP 2: Option C (`@capacitor/status-bar` & injected CSS)
  // -------------------------------------------------------------
  if (isNative && resolvedTop === 0) {
    try {
      const { StatusBar } = await import("@capacitor/status-bar");
      const info = await StatusBar.getInfo().catch(() => null);
      if (info && typeof info.height === "number" && info.height > 0) {
        resolvedTop = info.height;
        source = InsetDetectionSource.OPTION_C_STATUS_BAR_PLUGIN;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn("[SafeArea:OptionC:StatusBar] Query failed:", msg);
    }
  }

  // Check CSS variables from `@capacitor-community/safe-area` / WebView
  if (resolvedTop === 0) {
    const computed = window.getComputedStyle(document.documentElement);
    const cssTop = parseCssPxValue(computed.getPropertyValue("--safe-area-inset-top"));
    if (cssTop > 0) {
      resolvedTop = cssTop;
      source = InsetDetectionSource.OPTION_C_CSS_SAFE_AREA;
    }
  }

  if (resolvedBottom === 0) {
    const computed = window.getComputedStyle(document.documentElement);
    const cssBottom = parseCssPxValue(computed.getPropertyValue("--safe-area-inset-bottom"));
    if (cssBottom > 0) {
      resolvedBottom = cssBottom;
    }
  }

  // -------------------------------------------------------------
  // STEP 3: Fallback Condition (Value is 0 -> Plugin failed to detect)
  // -------------------------------------------------------------
  let status = SafeAreaStatus.SUCCESS;

  if (isAndroid) {
    if (resolvedTop <= 0) {
      // Condition met: Plugin or package failed to detect the hardware status bar
      status = SafeAreaStatus.FAILED_PLUGIN_RETURNED_ZERO;
      resolvedTop = SAFE_AREA_FALLBACKS.ANDROID_STATUS_BAR_PX;
      source = InsetDetectionSource.FALLBACK_DEFAULT;
      console.warn(
        `[SafeArea] Plugins returned 0 (failed to detect status bar on this device). Applied fallback of ${SAFE_AREA_FALLBACKS.ANDROID_STATUS_BAR_PX}px.`
      );
    }

    if (resolvedBottom <= 0) {
      resolvedBottom = SAFE_AREA_FALLBACKS.ANDROID_NAV_BAR_PX;
    }
  }

  return {
    top: resolvedTop,
    bottom: resolvedBottom,
    left: resolvedLeft,
    right: resolvedRight,
    source,
    status,
  };
}

/**
 * Applies the resolved insets directly to DOM documentElement CSS custom properties
 * (--sat, --sab, --safe-area-inset-top, --safe-area-inset-bottom)
 */
export function applyDeviceSafeAreaMetrics(metrics: DeviceSafeAreaMetrics): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--sat", `${metrics.top}px`);
  root.style.setProperty("--safe-area-inset-top", `${metrics.top}px`);
  root.style.setProperty("--sab", `${metrics.bottom}px`);
  root.style.setProperty("--safe-area-inset-bottom", `${metrics.bottom}px`);
  root.style.setProperty("--sal", `${metrics.left}px`);
  root.style.setProperty("--sar", `${metrics.right}px`);

  root.setAttribute("data-sat-source", metrics.source);
  root.setAttribute("data-sat-status", metrics.status);
}

/**
 * Initializes and continuously synchronizes safe area insets combining Option A & Option C
 * with dynamic orientation and fold/unfold change listeners.
 */
export function initSafeAreaSynchronization(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  let cleanupListener: (() => void) | null = null;

  const sync = async () => {
    const metrics = await getDeviceSafeAreaMetrics();
    applyDeviceSafeAreaMetrics(metrics);
  };

  // Immediate sync on execution
  sync().catch((err: unknown) => {
    console.error("[SafeArea] Immediate sync error:", err);
  });

  // Attach listener for dynamic hardware changes (rotation, screen fold/unfold)
  if (Capacitor.isNativePlatform()) {
    import("capacitor-plugin-safe-area")
      .then(async ({ SafeArea }) => {
        const handle = await SafeArea.addListener("safeAreaChanged", (data) => {
          let top = data?.insets?.top ?? 0;
          let bottom = data?.insets?.bottom ?? 0;
          let status = SafeAreaStatus.SUCCESS;
          let source = InsetDetectionSource.OPTION_A_SAFE_AREA_PLUGIN;

          if (top <= 0 && Capacitor.getPlatform() === "android") {
            status = SafeAreaStatus.FAILED_PLUGIN_RETURNED_ZERO;
            top = SAFE_AREA_FALLBACKS.ANDROID_STATUS_BAR_PX;
            source = InsetDetectionSource.FALLBACK_DEFAULT;
            console.warn("[SafeArea:Listener] Detected 0 inset on change; applied fallback.");
          }

          if (bottom <= 0 && Capacitor.getPlatform() === "android") {
            bottom = SAFE_AREA_FALLBACKS.ANDROID_NAV_BAR_PX;
          }

          applyDeviceSafeAreaMetrics({
            top,
            bottom,
            left: data?.insets?.left ?? 0,
            right: data?.insets?.right ?? 0,
            source,
            status,
          });
        });

        cleanupListener = () => {
          handle.remove().catch(() => {});
        };
      })
      .catch((error: unknown) => {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn("[SafeArea] Could not attach safeAreaChanged listener:", msg);
      });
  }

  // Also listen to window resize as fallback
  const onResize = () => {
    sync().catch(() => {});
  };
  window.addEventListener("resize", onResize, { passive: true });

  return () => {
    window.removeEventListener("resize", onResize);
    if (cleanupListener) {
      cleanupListener();
    }
  };
}
