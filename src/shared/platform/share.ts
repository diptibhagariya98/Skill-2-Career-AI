import { Share } from "@capacitor/share";
import { isNative } from "./device";

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

/**
 * Triggers native OS share sheet (WhatsApp, Gmail, Drive, etc.) or web fallback.
 */
export async function shareContent(options: ShareOptions): Promise<boolean> {
  if (isNative()) {
    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: options.title || "ResuMentor",
          text: options.text,
          url: options.url,
          dialogTitle: options.dialogTitle || "Share via",
        });
        return true;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e || "");
      if (msg.includes("canceled") || msg.includes("cancelled")) {
        return false;
      }
      console.warn("[Share Native Notice]:", msg);
    }
  }

  // Web Fallback
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
