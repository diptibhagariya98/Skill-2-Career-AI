import { ContactInfo } from "@/types/resume";
import { normalizeUrl } from "@/lib/resume/validation";

export function isCleanString(val?: string | null): boolean {
  if (!val) return false;
  const lower = val.trim().toLowerCase();
  return (
    lower.length > 0 &&
    lower !== "none" &&
    lower !== "null" &&
    lower !== "undefined" &&
    lower !== "n/a" &&
    lower !== "na" &&
    lower !== "https://none" &&
    lower !== "http://none"
  );
}

export function formatGrade(rawGrade?: string | null): string {
  if (!rawGrade) return "";
  const trimmed = rawGrade.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower.includes("/") || lower.includes("out of")) {
    return lower.startsWith("cgpa") || lower.startsWith("gpa") ? trimmed : `CGPA ${trimmed}`;
  }
  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    const scale = num <= 4 ? 4 : num <= 10 ? 10 : 100;
    return `CGPA ${trimmed} / ${scale}`;
  }
  return trimmed;
}

export interface ContactDisplayItem {
  id: string;
  text: string;
  url?: string;
}

export function getCleanContactItems(contact: ContactInfo): ContactDisplayItem[] {
  const items: ContactDisplayItem[] = [];

  if (isCleanString(contact.email)) {
    items.push({ id: "email", text: contact.email.trim(), url: `mailto:${contact.email.trim()}` });
  }

  if (isCleanString(contact.phone)) {
    items.push({ id: "phone", text: contact.phone.trim(), url: `tel:${contact.phone.trim()}` });
  }

  const locationParts = [contact.city, contact.state, contact.country]
    .map((p) => (p || "").trim())
    .filter(isCleanString);
  if (locationParts.length > 0) {
    items.push({ id: "location", text: locationParts.join(", ") });
  }

  if (isCleanString(contact.linkedin)) {
    const cleanUrl = normalizeUrl(contact.linkedin);
    if (cleanUrl) {
      items.push({ id: "linkedin", text: cleanUrl.replace(/^https?:\/\/(www\.)?/, ""), url: cleanUrl });
    }
  }

  if (isCleanString(contact.website)) {
    const cleanUrl = normalizeUrl(contact.website);
    if (cleanUrl) {
      items.push({ id: "website", text: cleanUrl.replace(/^https?:\/\/(www\.)?/, ""), url: cleanUrl });
    }
  }

  if (contact.links && contact.links.length > 0) {
    for (const link of contact.links) {
      if (isCleanString(link.url)) {
        const cleanUrl = normalizeUrl(link.url);
        if (cleanUrl) {
          items.push({
            id: link.id,
            text: isCleanString(link.label) ? link.label.trim() : cleanUrl.replace(/^https?:\/\/(www\.)?/, ""),
            url: cleanUrl,
          });
        }
      }
    }
  }

  return items;
}
