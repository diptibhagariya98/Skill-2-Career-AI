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
export * from "./dialogs";
export * from "./speech";
export * from "./speechRecognition";
export * from "./notifications";

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
    case "dialog":
    case "toast":
    case "tts":
    case "stt":
    case "notifications":
      return true;
    case "voice":
      return true;
    default:
      return false;
  }
}
