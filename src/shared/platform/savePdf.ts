/**
 * savePdf — cross-platform PDF save + share helper
 *
 * Android (native WebView):
 *   1. Converts Blob → base64 string.
 *   2. Writes the bytes to the app's CACHE directory using @capacitor/filesystem.
 *      (Cache dir doesn't need scoped-storage permissions.)
 *   3. Calls @capacitor/share with the file:// URI so the OS share sheet appears.
 *      The user can pick "Save to Files", Drive, Gmail, WhatsApp, etc.
 *
 * Web (desktop / PWA):
 *   Triggers a programmatic <a download> which drops the file in the browser's
 *   Downloads folder. This path is unreachable inside a native WebView, which is
 *   why we always use the Filesystem → Share path on native.
 */

import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { isNative } from "./device";

/** Result returned to the caller after a save attempt. */
export interface SavePdfResult {
  /** Whether the file was delivered to the user (share sheet opened or browser download triggered). */
  delivered: boolean;
  /** The sanitised filename that was used. */
  filename: string;
  /** Human-readable status for a success snackbar. */
  message: string;
}

/**
 * Converts a Blob to a base64 string (without the data-URL prefix).
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Strip "data:application/pdf;base64," prefix
      const base64 = dataUrl.split(",")[1];
      if (!base64) reject(new Error("FileReader produced an empty base64 string."));
      else resolve(base64);
    };
    reader.onerror = () => reject(new Error("FileReader failed to read the PDF blob."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Save a PDF Blob and surface it to the user.
 *
 * @param pdfBlob  - The generated PDF as a Blob.
 * @param filename - Sanitised filename, e.g. "John_Doe_Resume.pdf".
 * @throws         Rethrows any unrecoverable error so the caller can show a snackbar.
 */
export async function savePdfAndShare(pdfBlob: Blob, filename: string): Promise<SavePdfResult> {
  if (isNative()) {
    // ── Native Android path ───────────────────────────────────────────────
    // Write to CACHE so we don't need READ_EXTERNAL_STORAGE / WRITE_EXTERNAL_STORAGE.
    // Scoped storage (Android 10+) allows apps to read their own cache freely.
    const base64Data = await blobToBase64(pdfBlob);

    const writeResult = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
      recursive: true,
    });

    // writeResult.uri is a file:// URI that @capacitor/share can open.
    const fileUri = writeResult.uri;

    const canShare = await Share.canShare();
    if (canShare.value) {
      try {
        await Share.share({
          title: filename,
          text: "My ATS-optimised resume",
          url: fileUri,
          files: [fileUri],
          dialogTitle: `Save or share ${filename}`,
        });
        return {
          delivered: true,
          filename,
          message: `Choose where to save ${filename} from the share sheet.`,
        };
      } catch (shareErr: unknown) {
        const msg = shareErr instanceof Error ? shareErr.message : String(shareErr ?? "");
        // User dismissed the share sheet — not an error
        if (msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("abort")) {
          return {
            delivered: false,
            filename,
            message: "Share cancelled.",
          };
        }
        throw new Error(`Share sheet failed: ${msg}`);
      }
    }

    // Share plugin unavailable (very rare) — open the file directly
    throw new Error(
      "Sharing is not available on this device. The file was written to app cache."
    );
  }

  // ── Browser / web path ────────────────────────────────────────────────
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke after a generous delay so Chrome has time to start the download
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);

  return {
    delivered: true,
    filename,
    message: `Saved as ${filename}`,
  };
}
