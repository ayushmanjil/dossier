/**
 * Normalization helpers so that minor formatting drift in Google Sheets
 * exports (curly quotes, extra spaces, trailing punctuation, BOM characters)
 * doesn't break column matching against recruitmentConfig.js.
 */

export function normalizeHeader(str) {
  if (str == null) return "";
  return String(str)
    .replace(/\uFEFF/g, "") // strip BOM
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes -> straight
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes -> straight
    .replace(/\u2013|\u2014/g, "-") // en/em dash -> hyphen
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[?.:!]+$/g, ""); // trailing punctuation is often inconsistent
}

export function normalizeValue(str) {
  if (str == null) return "";
  return String(str).replace(/\uFEFF/g, "").trim();
}

export function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
