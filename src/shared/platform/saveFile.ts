"use client";

import { isNative } from "./device";

export interface SaveFileResult {
  ok: boolean;
  delivered: boolean;
  filename: string;
  message: string;
}

/**
 * Saves a plain text or JSON string to a file and surfaces it to the user.
 *
 * Android Native:
 *   1. Writes to app Cache directory via @capacitor/filesystem (no broad storage permissions required).
 *   2. Opens @capacitor/share sheet with file:// URI so user can choose "Save to Files", Drive, WhatsApp, etc.
 *
 * Web:
 *   Standard programmatic Blob download.
 */
export async function saveTextFile(
  content: string,
  filename: string,
  mimeType = "application/json"
): Promise<SaveFileResult> {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  if (isNative()) {
    try {
      const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");

      const writeResult = await Filesystem.writeFile({
        path: safeFilename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
        recursive: true,
      });

      const fileUri = writeResult.uri;
      const canShare = await Share.canShare();

      if (canShare.value) {
        try {
          await Share.share({
            title: safeFilename,
            text: `Backup data: ${safeFilename}`,
            url: fileUri,
            files: [fileUri],
            dialogTitle: `Save or share ${safeFilename}`,
          });

          return {
            ok: true,
            delivered: true,
            filename: safeFilename,
            message: `Ready to save or share ${safeFilename}`,
          };
        } catch (shareErr: unknown) {
          const msg = shareErr instanceof Error ? shareErr.message : String(shareErr || "");
          if (msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("abort")) {
            return {
              ok: true,
              delivered: false,
              filename: safeFilename,
              message: "Share cancelled.",
            };
          }
          throw shareErr;
        }
      }

      return {
        ok: true,
        delivered: true,
        filename: safeFilename,
        message: `Saved to application storage as ${safeFilename}`,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to save file";
      return {
        ok: false,
        delivered: false,
        filename: safeFilename,
        message: errMsg,
      };
    }
  }

  // Web Browser Download
  try {
    const blob = new Blob([content], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = safeFilename;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);

    return {
      ok: true,
      delivered: true,
      filename: safeFilename,
      message: `Downloaded ${safeFilename}`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to download file";
    return {
      ok: false,
      delivered: false,
      filename: safeFilename,
      message: errMsg,
    };
  }
}
