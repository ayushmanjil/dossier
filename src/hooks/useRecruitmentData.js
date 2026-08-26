import { useMemo, useState, useEffect, useCallback } from "react";
import { useApplicationsStore } from "../context/ApplicationsContext";
import { DEPARTMENTS, UNKNOWN_DEPARTMENT, getDepartmentBySlug } from "../config/recruitmentConfig";
import {
  getAllEvaluations,
  getSelectedCandidateIds,
  toggleCandidateSelection,
} from "../lib/store";

function normalizeSlug(slug) {
  if (!slug) return slug;
  if (slug === "content-creative-writing" || slug === "editorial-documentation")
    return "editorial-documentation";
  if (slug === "creative-designing" || slug === "creative-design")
    return "creative-design";
  if (slug === "social-media-outreach" || slug === "media-outreach")
    return "media-outreach";
  if (slug === "executive-management") return "executive-management";
  return slug;
}

/** Dashboard-level: one card per department, counts computed live. */
export function useDepartmentSummaries() {
  const { applications } = useApplicationsStore();

  return useMemo(() => {
    const counts = new Map();
    for (const app of applications) {
      const canonicalSlug = normalizeSlug(app.department);
      counts.set(canonicalSlug, (counts.get(canonicalSlug) || 0) + 1);
    }

    const configured = DEPARTMENTS.map((dept) => ({
      slug: dept.slug,
      label: dept.label,
      count: counts.get(dept.slug) || 0,
      questionCount: dept.questions.length,
    }));

    const unassignedCount = counts.get(UNKNOWN_DEPARTMENT.slug) || 0;
    if (unassignedCount > 0) {
      configured.push({
        slug: UNKNOWN_DEPARTMENT.slug,
        label: UNKNOWN_DEPARTMENT.label,
        count: unassignedCount,
        questionCount: 0,
        isUnassigned: true,
      });
    }

    return configured;
  }, [applications]);
}

export function useApplicantsByDepartment(slug) {
  const { applications } = useApplicationsStore();
  const targetSlug = normalizeSlug(slug);
  return useMemo(
    () => applications.filter((a) => normalizeSlug(a.department) === targetSlug),
    [applications, targetSlug]
  );
}

export function useApplicant(applicantId) {
  const { applications } = useApplicationsStore();
  return useMemo(
    () => applications.find((a) => a.applicantId === applicantId) || null,
    [applications, applicantId]
  );
}

export function useDepartmentConfig(slug) {
  const targetSlug = normalizeSlug(slug);
  return useMemo(
    () =>
      targetSlug === UNKNOWN_DEPARTMENT.slug
        ? UNKNOWN_DEPARTMENT
        : getDepartmentBySlug(targetSlug),
    [targetSlug]
  );
}

/** Returns a live map of applicantId -> { avgRating, count, evaluations } */
export function useEvaluationsMap() {
  const [evalMap, setEvalMap] = useState(new Map());

  const refresh = useCallback(async () => {
    try {
      const list = await getAllEvaluations();
      const grouped = new Map();
      for (const ev of list || []) {
        if (!grouped.has(ev.applicantId)) grouped.set(ev.applicantId, []);
        grouped.get(ev.applicantId).push(ev);
      }

      const res = new Map();
      for (const [id, evals] of grouped.entries()) {
        const valid = evals.filter((e) => Number(e.rating) > 0);
        const count = valid.length;
        const avgRating =
          count > 0
            ? (valid.reduce((acc, e) => acc + Number(e.rating), 0) / count).toFixed(1)
            : null;
        res.set(id, {
          avgRating,
          roundedAvg: avgRating ? Math.round(Number(avgRating)) : 0,
          count,
          evaluations: evals,
        });
      }
      setEvalMap(res);
    } catch (err) {
      console.error("Failed to load evaluations map:", err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { evalMap, refresh };
}

/** Manages shortlisting / selecting candidates by Admins */
export function useSelectionManager() {
  const {
    selectedIds,
    selectedApplicants,
    selectedCount,
    isSelected,
    toggleSelect,
    loading,
    refresh,
  } = useApplicationsStore();

  return {
    selectedIds,
    selectedCount,
    isSelected,
    toggleSelect,
    selectedApplicants,
    loading,
    refresh,
  };
}
