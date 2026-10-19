/**
 * Resume Storage, Autosave, Revision History & Portability
 * Conforms to Production Spec Sections 5.3, 5.4, and 13
 * Scoped per user ID to guarantee strict data isolation for new and existing users.
 */

import { ResumeData, ResumeRevision } from "@/types/resume";
import { createEmptyResume, migrateResumeSchema } from "./schema";

const STORAGE_KEY_CURRENT = "resumentor_resume_current";
const STORAGE_KEY_REVISIONS = "resumentor_resume_revisions";
const MAX_REVISIONS = 10;

export function getResumeStorageKey(userId?: string): string {
  return userId ? `resumentor_resume_${userId}_current` : STORAGE_KEY_CURRENT;
}

export function getRevisionsStorageKey(userId?: string): string {
  return userId ? `resumentor_resume_${userId}_revisions` : STORAGE_KEY_REVISIONS;
}

/**
 * Loads the active resume from local storage scoped to the authenticated user.
 * If the user is new (no saved record for their ID), returns a fresh empty resume initialized with their name & email.
 */
export function loadLocalResume(
  userId?: string,
  defaultUser?: { name?: string; email?: string }
): ResumeData {
  if (typeof window === "undefined") return createEmptyResume(defaultUser);
  try {
    const key = getResumeStorageKey(userId);
    const raw = localStorage.getItem(key);

    if (!raw) {
      // For a new user with an explicit userId, strictly return clean empty state
      // (Never leak a previous user's un-scoped legacy data)
      return createEmptyResume(defaultUser);
    }

    const parsed = JSON.parse(raw);
    const migrated = migrateResumeSchema(parsed);

    // If the saved resume was empty of contact details but we know the user's name/email, backfill them
    // (Ensure guest placeholders like 'Guest Explorer' are not backfilled into actual candidate fields)
    const isGuestPlaceholder =
      defaultUser?.name?.toLowerCase() === "guest explorer" ||
      defaultUser?.email?.toLowerCase() === "guest@resumentor.app";

    if (!isGuestPlaceholder) {
      if (!migrated.contact.fullName && defaultUser?.name) {
        migrated.contact.fullName = defaultUser.name;
      }
      if (!migrated.contact.email && defaultUser?.email) {
        migrated.contact.email = defaultUser.email;
      }
    }

    return migrated;
  } catch (err: unknown) {
    console.error("Failed to load local resume:", err);
    return createEmptyResume(defaultUser);
  }
}

/**
 * Saves current resume to local storage scoped to the authenticated user and updates revisions
 */
export function saveLocalResume(data: ResumeData, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      ...data,
      meta: {
        ...data.meta,
        updatedAt: new Date().toISOString(),
      },
    };
    const currentKey = getResumeStorageKey(userId);
    const revisionsKey = getRevisionsStorageKey(userId);

    localStorage.setItem(currentKey, JSON.stringify(payload));

    // Append to user-scoped revisions (max 10)
    const rawRevisions = localStorage.getItem(revisionsKey);
    let revisions: ResumeRevision[] = rawRevisions ? JSON.parse(rawRevisions) : [];
    revisions.unshift({
      timestamp: payload.meta.updatedAt,
      data: payload,
    });
    if (revisions.length > MAX_REVISIONS) {
      revisions = revisions.slice(0, MAX_REVISIONS);
    }
    localStorage.setItem(revisionsKey, JSON.stringify(revisions));
  } catch (err: unknown) {
    console.error("Failed to save local resume:", err);
  }
}

/**
 * Loads the 10 most recent timestamped revisions for the given user
 */
export function loadRevisionHistory(userId?: string): ResumeRevision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getRevisionsStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Restores a specific revision for the given user
 */
export function restoreRevision(revision: ResumeRevision, userId?: string): ResumeData {
  const migrated = migrateResumeSchema(revision.data);
  saveLocalResume(migrated, userId);
  return migrated;
}

import { saveTextFile, SaveFileResult } from "@/shared/platform";

/**
 * Exports the raw resume as a portable .json data file (Section 5.4)
 * Cross-platform compatible for Android Native (Filesystem + Share) and Web (Blob download).
 */
export async function exportResumeDataFile(data: ResumeData): Promise<SaveFileResult> {
  const jsonStr = JSON.stringify(data, null, 2);
  const safeName = (data.contact.fullName || "resume").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${safeName}_data.json`;

  return saveTextFile(jsonStr, filename, "application/json");
}

/**
 * Imports and validates a raw resume JSON file (Section 5.4)
 */
export async function importResumeDataFile(file: File, userId?: string): Promise<ResumeData> {
  if (!file.name.endsWith(".json") && file.type !== "application/json") {
    throw new Error("File must be a valid .json resume data file.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File exceeds maximum allowable size (5MB).");
  }

  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Malformed JSON file: Unable to parse contents.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid resume format: Root must be an object.");
  }

  const migrated = migrateResumeSchema(parsed);
  saveLocalResume(migrated, userId);
  return migrated;
}

/**
 * One-click "Delete all my data" (Section 13)
 */
export function deleteAllLocalResumeData(userId?: string): void {
  if (typeof window === "undefined") return;
  if (userId) {
    localStorage.removeItem(getResumeStorageKey(userId));
    localStorage.removeItem(getRevisionsStorageKey(userId));
  }
  localStorage.removeItem(STORAGE_KEY_CURRENT);
  localStorage.removeItem(STORAGE_KEY_REVISIONS);
}
