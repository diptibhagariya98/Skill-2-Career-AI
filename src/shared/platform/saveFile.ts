"use client";

import { saveFileAndShare, SavePdfResult } from "./savePdf";

export type SaveFileResult = SavePdfResult;

/**
 * Saves a plain text or JSON string to a file and surfaces it safely to the user.
 * Routes directly through the unified crash-proof `saveFileAndShare` platform helper.
 */
export async function saveTextFile(
  content: string,
  filename: string,
  mimeType = "application/json"
): Promise<SaveFileResult> {
  const blob = new Blob([content], { type: mimeType });
  return await saveFileAndShare(blob, filename, {
    dialogTitle: `Save or share ${filename}`,
  });
}

