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
import { ResumeData } from "@/types/resume";
import { API_ROUTES } from "@/constants/endpoints";

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
 * Generic cross-platform file save and surface helper.
 * Handles both binary Blobs (PDF, images) and text Blobs (JSON, TXT).
 */
export async function saveFileAndShare(
  fileBlob: Blob,
  filename: string,
  options: SavePdfOptions = {}
): Promise<SavePdfResult> {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  if (isNative()) {
    // ── Native Android path ───────────────────────────────────────────────
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const base64Data = await blobToBase64(fileBlob);

      // Write directly to app Cache (no storage permissions required on Android)
      const writeResult = await Filesystem.writeFile({
        path: safeFilename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      let fileUri = writeResult.uri;
      if (!fileUri) {
        const uriResult = await Filesystem.getUri({
          directory: Directory.Cache,
          path: safeFilename,
        });
        fileUri = uriResult.uri;
      }

      // Present the OS Share Sheet — gives instant 1-tap options:
      // "Open with (PDF viewer)", "Save to Drive", "Files", WhatsApp, Gmail, etc.
      try {
        const { Share } = await import("@capacitor/share");
        await Share.share({
          title: safeFilename,
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
        if (
          msg.toLowerCase().includes("cancel") ||
          msg.toLowerCase().includes("abort") ||
          msg.toLowerCase().includes("dismiss")
        ) {
          return {
            ok: true,
            delivered: false,
            filename: safeFilename,
            message: "Share dismissed.",
          };
        }
        console.warn("[savePdf] Share sheet dismissed or failed:", shareErr);
        return {
          ok: true,
          delivered: false,
          filename: safeFilename,
          message: `File saved: ${safeFilename}`,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save PDF on device";
      console.error("[savePdf] Native save error:", err);
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
    const blobUrl = URL.createObjectURL(fileBlob);
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
    const msg = err instanceof Error ? err.message : "Failed to download file";
    return {
      ok: false,
      delivered: false,
      filename: safeFilename,
      message: msg,
    };
  }
}

/** Backward compatibility alias for PDF calls */
export const savePdfAndShare = saveFileAndShare;

/**
 * Calls the server-side Next.js headless rendering API (/api/resumes/export)
 * and delivers the resulting high-res vector PDF via browser download or native Android Share Sheet.
 */
export async function exportResumeFromServer(
  resume: ResumeData,
  options: SavePdfOptions = {}
): Promise<SavePdfResult> {
  const cleanName = (resume.contact.fullName || "")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const filename = cleanName ? `${cleanName}_Resume.pdf` : "Resume.pdf";

  try {
    const res = await fetch(API_ROUTES.RESUME_EXPORT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resume }),
    });

    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      try {
        const errorJson = (await res.json()) as { error?: { message?: string } };
        if (errorJson?.error?.message) {
          errorMsg = errorJson.error.message;
        }
      } catch {}
      throw new Error(errorMsg);
    }

    const pdfBlob = await res.blob();
    if (!pdfBlob || pdfBlob.size < 500) {
      throw new Error("Received an empty or corrupted PDF from the server.");
    }

    return await savePdfAndShare(pdfBlob, filename, options);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to export PDF from server";
    return {
      ok: false,
      delivered: false,
      filename,
      message: msg,
    };
  }
}
