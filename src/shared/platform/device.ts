import { Capacitor } from "@capacitor/core";

/**
 * Returns true if the application is running inside a native mobile container (Capacitor Android or iOS).
 */
export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Returns the current runtime platform: 'android' | 'ios' | 'web'
 */
export function getPlatform(): "android" | "ios" | "web" {
  if (typeof window === "undefined") return "web";
  try {
    const platform = Capacitor.getPlatform();
    if (platform === "android" || platform === "ios") {
      return platform;
    }
    return "web";
  } catch {
    return "web";
  }
}
