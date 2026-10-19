import { isNative } from "./device";

export interface SpeakOptions {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * Native Text-to-Speech for spoken AI interview questions.
 * Fallback to browser SpeechSynthesis.
 */
export async function speakText(options: SpeakOptions): Promise<boolean> {
  const { text, lang = "en-US", rate = 1.0, pitch = 1.0, volume = 1.0 } = options;
  if (!text.trim()) return false;

  if (isNative()) {
    try {
      const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
      await TextToSpeech.speak({
        text,
        lang,
        rate,
        pitch,
        volume,
        category: "ambient",
      });
      return true;
    } catch (err: unknown) {
      console.warn("[Platform:TTS] Native speak failed, attempting web fallback:", err);
    }
  }

  // Web Browser SpeechSynthesis Fallback
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    return new Promise((resolve) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        utterance.onend = () => resolve(true);
        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
          console.warn("[Platform:TTS] Web speech synthesis error:", e);
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (synthErr: unknown) {
        console.warn("[Platform:TTS] Browser SpeechSynthesis threw:", synthErr);
        resolve(false);
      }
    });
  }

  return false;
}

/**
 * Stop any active text-to-speech synthesis immediately.
 */
export async function stopSpeaking(): Promise<void> {
  if (isNative()) {
    try {
      const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
      await TextToSpeech.stop();
    } catch {
      // safe fallback
    }
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // safe fallback
    }
  }
}
