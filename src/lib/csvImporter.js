import Papa from "papaparse";
import {
  COMMON_QUESTIONS,
  DEPARTMENTS,
  PENDING_QUESTIONS,
  UNKNOWN_DEPARTMENT,
} from "../config/recruitmentConfig.js";
import { normalizeHeader, normalizeValue, slugify } from "./normalize.js";
import { extractLinks } from "./links.js";

function buildHeaderIndex(headers) {
  // Map normalized base header (without _\d+ suffix) -> array of all original CSV headers
  const byNormalizedBase = new Map();
  const byNormalizedExact = new Map();

  for (const h of headers) {
    const exactNorm = normalizeHeader(h);
    // Remove PapaParse duplicate suffix like _1, _2, _3
    const baseHeader = h.replace(/_\d+$/, "");
    const baseNorm = normalizeHeader(baseHeader);

    if (exactNorm && !byNormalizedExact.has(exactNorm)) {
      byNormalizedExact.set(exactNorm, h);
    }
    if (baseNorm) {
      if (!byNormalizedBase.has(baseNorm)) {
        byNormalizedBase.set(baseNorm, []);
      }
      byNormalizedBase.get(baseNorm).push(h);
    }
  }

  return {
    // Returns the first matching header
    resolve(matchList) {
      for (const candidate of matchList) {
        const norm = normalizeHeader(candidate);
        if (byNormalizedExact.has(norm)) return byNormalizedExact.get(norm);
        if (byNormalizedBase.has(norm) && byNormalizedBase.get(norm).length) {
          return byNormalizedBase.get(norm)[0];
        }
      }
      return null;
    },
    // Returns all matching original headers for the match list (e.g. all duplicate columns)
    resolveAll(matchList) {
      const results = [];
      for (const candidate of matchList) {
        const norm = normalizeHeader(candidate);
        if (byNormalizedBase.has(norm)) {
          results.push(...byNormalizedBase.get(norm));
        } else if (byNormalizedExact.has(norm)) {
          results.push(byNormalizedExact.get(norm));
        }
      }
      return Array.from(new Set(results));
    },
  };
}

function resolveDepartment(rawValue) {
  const norm = normalizeHeader(rawValue);
  if (!norm) return null;

  // 1. Exact match against label and all configured match variants
  for (const dept of DEPARTMENTS) {
    const variants = [dept.label, ...dept.match].map(normalizeHeader);
    if (variants.includes(norm)) return dept;
  }

  // 2. Fallback: normalize by removing "department" / "dept" suffix/prefix and symbols
  const cleanNorm = norm.replace(/\b(department|dept)\b/gi, "").replace(/[^a-z0-9]/g, "");
  if (cleanNorm) {
    for (const dept of DEPARTMENTS) {
      const cleanLabel = normalizeHeader(dept.label).replace(/\b(department|dept)\b/gi, "").replace(/[^a-z0-9]/g, "");
      if (cleanLabel && (cleanNorm === cleanLabel || cleanNorm.includes(cleanLabel) || cleanLabel.includes(cleanNorm))) {
        return dept;
      }
      for (const m of dept.match) {
        const cleanMatch = normalizeHeader(m).replace(/\b(department|dept)\b/gi, "").replace(/[^a-z0-9]/g, "");
        if (cleanMatch && (cleanNorm === cleanMatch || cleanNorm.includes(cleanMatch) || cleanMatch.includes(cleanNorm))) {
          return dept;
        }
      }
    }
  }

  return null;
}

/**
 * Parses raw CSV text into { applications, summary }.
 * Never throws for row-level problems — those are collected into
 * summary.warnings / summary.errors so the caller can render them instead of
 * silently losing data.
 */
export function importCsv(csvText) {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => normalizeValue(h),
  });

  const summary = {
    totalRows: 0,
    importedCount: 0,
    skippedCount: 0,
    departmentCounts: {},
    unknownDepartmentValues: new Set(),
    missingRequiredColumns: [],
    unmappedColumns: [],
    rowErrors: [], // { rowNumber, reason }
    parseErrors: [],
  };

  if (parsed.errors && parsed.errors.length) {
    summary.parseErrors = parsed.errors
      .filter((e) => e.type !== "FieldMismatch") // tolerate ragged rows, Papa still parses them
      .map((e) => `Row ${e.row != null ? e.row + 2 : "?"}: ${e.message}`);
  }

  const headers = parsed.meta.fields || [];
  if (headers.length === 0) {
    return {
      applications: [],
      summary: {
        ...summary,
        fatal: "The file has no recognizable header row. Check that it was exported as a standard CSV.",
      },
    };
  }

  const headerIndex = buildHeaderIndex(headers);

  // --- Validate required common columns exist ---------------------------
  for (const q of COMMON_QUESTIONS) {
    if (!q.required) continue;
    const resolved = headerIndex.resolve(q.match);
    if (!resolved) summary.missingRequiredColumns.push(q.label);
  }
  if (summary.missingRequiredColumns.length) {
    return {
      applications: [],
      summary: {
        ...summary,
        fatal: `Missing required column(s): ${summary.missingRequiredColumns.join(", ")}. Upload cannot proceed until the CSV includes these.`,
      },
    };
  }

  // --- Figure out which raw headers are "claimed" by the config ---------
  const claimedHeaders = new Set();
  for (const q of COMMON_QUESTIONS) {
    const matchedHeaders = headerIndex.resolveAll(q.match);
    matchedHeaders.forEach((h) => claimedHeaders.add(h));
  }
  const deptFieldMatches = headerIndex.resolveAll(["Which department are you interested in?"]);
  deptFieldMatches.forEach((h) => claimedHeaders.add(h));

  for (const dept of DEPARTMENTS) {
    for (const q of dept.questions) {
      const matchedHeaders = headerIndex.resolveAll(q.match);
      matchedHeaders.forEach((h) => claimedHeaders.add(h));
    }
  }
  const pendingClaimed = new Set();
  for (const q of PENDING_QUESTIONS) {
    const matchedHeaders = headerIndex.resolveAll(q.match);
    matchedHeaders.forEach((h) => pendingClaimed.add(h));
  }

  summary.unmappedColumns = headers.filter(
    (h) => h.trim() && !claimedHeaders.has(h) && !pendingClaimed.has(h)
  );
  summary.pendingColumns = headers.filter((h) => pendingClaimed.has(h));

  // --- Row -> Application -------------------------------------------------
  const deptHeader = headerIndex.resolve(
    COMMON_QUESTIONS.find((q) => q.isDepartmentField).match
  );
  const nameHeader = headerIndex.resolve(
    COMMON_QUESTIONS.find((q) => q.key === "name").match
  );
  const rollHeader = headerIndex.resolve(
    COMMON_QUESTIONS.find((q) => q.key === "rollNumber").match
  );

  const applications = [];
  const seenIds = new Map();
  const rows = parsed.data;

  rows.forEach((row, i) => {
    const rowNumber = i + 2; // account for header row, 1-indexed for humans
    summary.totalRows += 1;

    const name = normalizeValue(row[nameHeader]);
    const rollNumber = normalizeValue(row[rollHeader]);
    const rawDept = normalizeValue(row[deptHeader]);

    if (!name && !rollNumber && !rawDept) {
      // Fully blank row (trailing sheet rows) — skip quietly, don't count as error
      summary.totalRows -= 1;
      return;
    }

    if (!name) {
      summary.rowErrors.push({ rowNumber, reason: "Missing applicant name — row skipped." });
      summary.skippedCount += 1;
      return;
    }

    const dept = resolveDepartment(rawDept) || null;
    if (!dept) {
      summary.unknownDepartmentValues.add(rawDept || "(blank)");
    }
    const effectiveDept = dept || UNKNOWN_DEPARTMENT;

    // --- Common answers ---
    const commonAnswers = {};
    for (const q of COMMON_QUESTIONS) {
      const candidates = headerIndex.resolveAll(q.match);
      let val = "";
      for (const h of candidates) {
        val = normalizeValue(row[h]);
        if (val) break;
      }
      commonAnswers[q.key] = val;
    }

    // --- Department-specific answers (only this applicant's department) --
    const departmentAnswers = [];
    const allLinks = [];
    for (const q of effectiveDept.questions || []) {
      const candidates = headerIndex.resolveAll(q.match);
      let rawAnswer = "";
      for (const h of candidates) {
        const candidateVal = normalizeValue(row[h]);
        if (candidateVal) {
          rawAnswer = candidateVal;
          break;
        }
      }

      const { prose, links } = extractLinks(rawAnswer);
      if (links.length) {
        links.forEach((l) => {
          const enrichedLink = { ...l, sourceQuestion: q.label };
          if (q.type === "resume") {
            enrichedLink.type = "resume";
          }
          allLinks.push(enrichedLink);
        });
      }
      departmentAnswers.push({
        key: q.key,
        label: q.label,
        question: q.prompt || q.match[0] || q.label,
        type: q.type,
        rawAnswer: rawAnswer || "",
        prose: prose || rawAnswer || "",
        links: links || [],
        optional: Boolean(q.optional),
      });
    }

    // --- Stable applicant ID ---
    const baseId = rollNumber ? slugify(rollNumber) : slugify(`${name}-${rowNumber}`);
    let applicantId = baseId || `applicant-${rowNumber}`;
    if (seenIds.has(applicantId)) {
      const n = seenIds.get(applicantId) + 1;
      seenIds.set(applicantId, n);
      applicantId = `${applicantId}-${n}`;
    } else {
      seenIds.set(applicantId, 0);
    }

    applications.push({
      applicantId,
      name,
      rollNumber,
      department: effectiveDept.slug,
      departmentLabel: effectiveDept.label,
      departmentRawValue: rawDept,
      timestamp: commonAnswers.timestamp || null,
      commonAnswers,
      departmentAnswers,
      links: allLinks,
      sourceRow: rowNumber,
    });

    summary.importedCount += 1;
    summary.departmentCounts[effectiveDept.label] =
      (summary.departmentCounts[effectiveDept.label] || 0) + 1;
  });

  summary.unknownDepartmentValues = Array.from(summary.unknownDepartmentValues);

  return { applications, summary };
}
