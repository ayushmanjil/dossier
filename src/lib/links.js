/**
 * Detects one or more URLs inside a free-text form answer and separates the
 * surrounding prose from the links, so the UI can render clickable buttons
 * instead of a raw pasted URL.
 */

const URL_PATTERN = "\\bhttps?:\\/\\/[^\\s,)\\]}\"'<>]+";

export function extractLinks(text) {
  if (!text) return { prose: "", links: [] };
  const raw = String(text);
  const matches = raw.match(new RegExp(URL_PATTERN, "gi")) || [];
  const links = matches.map((url, i) => ({
    url: url.replace(/[.,;]+$/g, ""),
    label: guessLinkLabel(url, i, matches.length),
  }));
  const prose = raw.replace(new RegExp(URL_PATTERN, "gi"), "").trim();
  return { prose, links };
}

function guessLinkLabel(url, index, total) {
  const lower = url.toLowerCase();
  let base = "Open Link";
  if (lower.includes("drive.google.com")) base = "Open File";
  else if (lower.includes("docs.google.com/document")) base = "Open Document";
  else if (lower.includes("behance.net")) base = "View on Behance";
  else if (lower.includes("dribbble.com")) base = "View on Dribbble";
  else if (lower.includes("github.com")) base = "View on GitHub";
  else if (lower.includes("linkedin.com")) base = "View LinkedIn";
  else if (lower.includes("instagram.com")) base = "View Instagram";
  else if (lower.includes("youtube.com") || lower.includes("youtu.be")) base = "Watch Video";
  else if (lower.match(/\.(pdf)(\?|$)/)) base = "Open PDF";
  return total > 1 ? `${base} ${index + 1}` : base;
}

export function isLikelyUrlField(text) {
  if (!text) return false;
  return new RegExp(URL_PATTERN, "i").test(String(text));
}
