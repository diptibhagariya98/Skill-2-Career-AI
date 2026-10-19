export * from "./device";
export * from "./haptics";
export * from "./network";
export * from "./backButton";
export * from "./backNavigation";
export * from "./share";
export * from "./savePdf";
export * from "./saveFile";
export * from "./browser";
export * from "./preferences";
export * from "./keyboard";
export * from "./NativeAppProvider";

/**
 * Feature capability detector (Rule 08 Platform Wrapper Contract)
 */
export function has(capability: string): boolean {
  switch (capability) {
    case "share":
    case "savePdf":
    case "saveFile":
    case "browser":
    case "network":
    case "haptics":
    case "backButton":
    case "preferences":
      return true;
    case "voice":
      // Web speech is only supported in browser, not Android WebView
      return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    default:
      return false;
  }
}

