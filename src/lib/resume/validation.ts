/**
 * Normalization & Validation helpers complying with Production Spec Section 5.2
 */

export function normalizeText(text?: string | null): string {
  if (!text) return "";
  // Strip control characters, collapse multiple spaces, trim edges, preserve non-Latin scripts
  return text
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function normalizeUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  const clean = rawUrl.trim();
  if (!clean) return "";
  const lower = clean.toLowerCase();
  if (
    lower === "none" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "n/a" ||
    lower === "na" ||
    lower === "no" ||
    lower === "https://none" ||
    lower === "http://none" ||
    lower === "https://" ||
    lower === "http://"
  ) {
    return "";
  }
  if (!/^https?:\/\//i.test(clean)) {
    return `https://${clean}`;
  }
  return clean;
}

export function isValidHttpUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = normalizeUrl(url);
  if (!clean) return false;
  try {
    const parsed = new URL(clean);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function splitBullets(rawText?: string | null): string[] {
  if (!rawText) return [];
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-\*]+/, "").trim())
    .filter((line) => line.length > 0);
}

export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  // Accepts international and domestic numbers with spaces/hyphens
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function validateDates(
  startMonth: string,
  startYear: string,
  endMonth?: string,
  endYear?: string,
  isCurrent?: boolean
): { valid: boolean; error?: string } {
  if (!startYear) {
    return { valid: false, error: "Start year is required." };
  }
  if (isCurrent) {
    return { valid: true };
  }
  if (!endYear) {
    return { valid: false, error: "End year is required or toggle 'Present'." };
  }

  const startVal = parseInt(startYear, 10);
  const endVal = parseInt(endYear, 10);

  if (endVal < startVal) {
    return { valid: false, error: "End year cannot be before start year." };
  }

  return { valid: true };
}
