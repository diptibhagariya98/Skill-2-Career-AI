import { isNative } from "./device";

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

/**
 * Checks whether speech recognition is available on the current platform/device.
 */
export async function hasSpeechRecognition(): Promise<boolean> {
  if (isNative()) {
    try {
      const { SpeechRecognition } = await import("@capgo/capacitor-speech-recognition");
      const available = await SpeechRecognition.available();
      return Boolean(available.available);
    } catch {
      return false;
    }
  }

  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

/**
 * Request audio recording / speech recognition permission.
 */
export async function requestSpeechPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const { SpeechRecognition } = await import("@capgo/capacitor-speech-recognition");
      const perm = await SpeechRecognition.requestPermissions();
      return perm.speechRecognition === "granted";
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Start listening for speech input.
 */
export async function startSpeechListening(
  onResult: (result: SpeechRecognitionResult) => void,
  lang = "en-US"
): Promise<() => void> {
  if (isNative()) {
    try {
      const { SpeechRecognition } = await import("@capgo/capacitor-speech-recognition");
      const hasPerm = await requestSpeechPermission();
      if (!hasPerm) {
        throw new Error("Microphone permission not granted");
      }

      const listener = await SpeechRecognition.addListener(
        "partialResults",
        (data: { matches: string[] }) => {
          if (data.matches && data.matches.length > 0) {
            onResult({
              transcript: data.matches[0],
              isFinal: false,
            });
          }
        }
      );

      await SpeechRecognition.start({
        language: lang,
        maxResults: 2,
        prompt: "Speak your answer clearly...",
        partialResults: true,
        popup: false,
      });

      return async () => {
        try {
          await SpeechRecognition.stop();
          await listener.remove();
        } catch {
          // safe cleanup
        }
      };
    } catch (nativeErr: unknown) {
      console.warn("[Platform:STT] Native SpeechRecognition error:", nativeErr);
    }
  }

  // Web Browser Speech Recognition fallback
  if (typeof window !== "undefined") {
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;

    if (SpeechRecognitionAPI && typeof SpeechRecognitionAPI === "function") {
      interface WebSpeechEvent {
        resultIndex: number;
        results: {
          [index: number]: {
            isFinal: boolean;
            [index: number]: { transcript: string };
          };
          length: number;
        };
      }

      interface WebSpeechInstance {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        start: () => void;
        stop: () => void;
        abort: () => void;
        onresult: ((event: WebSpeechEvent) => void) | null;
        onerror: ((event: unknown) => void) | null;
      }

      const recognition = new (SpeechRecognitionAPI as new () => WebSpeechInstance)();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onresult = (event: WebSpeechEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        onResult({
          transcript: finalTranscript || interimTranscript,
          isFinal: Boolean(finalTranscript),
        });
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch {
          // safe cleanup
        }
      };
    }
  }

  return () => {};
}
