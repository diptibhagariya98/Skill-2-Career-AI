/**
 * Resume Storage, Autosave, Revision History & Portability
 * Conforms to Production Spec Sections 5.3, 5.4, and 13
 */

import { ResumeData, ResumeRevision } from "@/types/resume";
import { createEmptyResume, migrateResumeSchema } from "./schema";

const STORAGE_KEY_CURRENT = "resumentor_resume_current";
const STORAGE_KEY_REVISIONS = "resumentor_resume_revisions";
const MAX_REVISIONS = 10;

/**
 * Loads the active resume from local storage, with fallback to an empty resume
 */
export function loadLocalResume(): ResumeData {
  if (typeof window === "undefined") return createEmptyResume();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (!raw) return createEmptyResume();
    const parsed = JSON.parse(raw);
    return migrateResumeSchema(parsed);
  } catch (err) {
    console.error("Failed to load local resume:", err);
    return createEmptyResume();
  }
}

/**
 * Saves current resume to local storage and updates the 10-revision history log
 */
export function saveLocalResume(data: ResumeData): void {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      ...data,
      meta: {
        ...data.meta,
        updatedAt: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(payload));

    // Append to revisions (max 10)
    const rawRevisions = localStorage.getItem(STORAGE_KEY_REVISIONS);
    let revisions: ResumeRevision[] = rawRevisions ? JSON.parse(rawRevisions) : [];
    revisions.unshift({
      timestamp: payload.meta.updatedAt,
      data: payload,
    });
    if (revisions.length > MAX_REVISIONS) {
      revisions = revisions.slice(0, MAX_REVISIONS);
    }
    localStorage.setItem(STORAGE_KEY_REVISIONS, JSON.stringify(revisions));
  } catch (err) {
    console.error("Failed to save local resume:", err);
  }
}

/**
 * Loads the 10 most recent timestamped revisions
 */
export function loadRevisionHistory(): ResumeRevision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVISIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Restores a specific revision
 */
export function restoreRevision(revision: ResumeRevision): ResumeData {
  const migrated = migrateResumeSchema(revision.data);
  saveLocalResume(migrated);
  return migrated;
}

/**
 * Exports the raw resume as a portable .json data file (Section 5.4)
 */
export function exportResumeDataFile(data: ResumeData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const safeName = (data.contact.fullName || "resume").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${safeName}_data.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports and validates a raw resume JSON file (Section 5.4)
 */
export async function importResumeDataFile(file: File): Promise<ResumeData> {
  if (!file.name.endsWith(".json") && file.type !== "application/json") {
    throw new Error("File must be a valid .json resume data file.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File exceeds maximum allowable size (5MB).");
  }

  const text = await file.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Malformed JSON file: Unable to parse contents.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid resume format: Root must be an object.");
  }

  const migrated = migrateResumeSchema(parsed);
  saveLocalResume(migrated);
  return migrated;
}

/**
 * One-click "Delete all my data" (Section 13)
 */
export function deleteAllLocalResumeData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_CURRENT);
  localStorage.removeItem(STORAGE_KEY_REVISIONS);
}
