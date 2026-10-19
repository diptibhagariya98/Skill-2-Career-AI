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

import { isNative } from "./device";

/** Result returned to the caller after a save attempt. */
export interface SavePdfResult {
  /** Whether the operation completed successfully without fatal error */
  ok: boolean;
  /** Whether the file was delivered to the user (share sheet opened or browser download triggered). */
  delivered: boolean;
  /** The sanitised filename that was used. */
  filename: string;
  /** Human-readable status for a success snackbar. */
  message: string;
}

export interface SavePdfOptions {
  shareText?: string;
  dialogTitle?: string;
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
 * @param options  - Optional share text and dialog title.
 */
export async function savePdfAndShare(
  pdfBlob: Blob,
  filename: string,
  options: SavePdfOptions = {}
): Promise<SavePdfResult> {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  if (isNative()) {
    // ── Native Android path ───────────────────────────────────────────────
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");

      const base64Data = await blobToBase64(pdfBlob);

      const writeResult = await Filesystem.writeFile({
        path: safeFilename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      const fileUri = writeResult.uri;

      // 1. Try native FileOpener first to open PDF in the system's preferred PDF viewer
      let openedWithNativeViewer = false;
      try {
        const { FileOpener } = await import("@capawesome-team/capacitor-file-opener");
        await FileOpener.openFile({
          path: fileUri,
          mimeType: "application/pdf",
        });
        openedWithNativeViewer = true;
      } catch (openerErr: unknown) {
        console.warn("[savePdf] FileOpener not available or no viewer, falling back to Share:", openerErr);
      }

      if (openedWithNativeViewer) {
        return {
          ok: true,
          delivered: true,
          filename: safeFilename,
          message: `Opened ${safeFilename} in PDF viewer`,
        };
      }

      // 2. Fallback to native Android Share Sheet (files array ONLY, do NOT pass url with local files)
      const canShare = await Share.canShare();

      if (canShare.value) {
        try {
          await Share.share({
            title: safeFilename,
            text: options.shareText || "ResuMentor Career Document",
            files: [fileUri],
            dialogTitle: options.dialogTitle || `Save or share ${safeFilename}`,
          });

          return {
            ok: true,
            delivered: true,
            filename: safeFilename,
            message: `Ready to save or share ${safeFilename}`,
          };
        } catch (shareErr: unknown) {
          const msg = shareErr instanceof Error ? shareErr.message : String(shareErr ?? "");
          if (msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("abort")) {
            return {
              ok: true,
              delivered: false,
              filename: safeFilename,
              message: "Share cancelled.",
            };
          }
          throw new Error(`Share sheet failed: ${msg}`);
        }
      }

      return {
        ok: true,
        delivered: true,
        filename: safeFilename,
        message: `Saved to cache as ${safeFilename}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save PDF";
      return {
        ok: false,
        delivered: false,
        filename: safeFilename,
        message: msg,
      };
    }
  }

  // ── Browser / web path ────────────────────────────────────────────────
  try {
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = safeFilename;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);

    return {
      ok: true,
      delivered: true,
      filename: safeFilename,
      message: `Saved as ${safeFilename}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to download PDF";
    return {
      ok: false,
      delivered: false,
      filename: safeFilename,
      message: msg,
    };
  }
}
