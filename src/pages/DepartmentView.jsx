import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useApplicantsByDepartment,
  useDepartmentConfig,
  useEvaluationsMap,
  useSelectionManager,
} from "../hooks/useRecruitmentData";
import { useApplicationsStore } from "../context/ApplicationsContext";
import ApplicantCard from "../components/ApplicantCard";

const SORT_OPTIONS = [
  { key: "name-asc", label: "Name (A–Z)" },
  { key: "name-desc", label: "Name (Z–A)" },
  { key: "roll-asc", label: "Roll Number" },
  { key: "rating-desc", label: "Highest Rated" },
  { key: "recent", label: "Most Recently Submitted" },
];

export default function DepartmentView() {
  const { slug } = useParams();
  const { loading } = useApplicationsStore();
  const deptConfig = useDepartmentConfig(slug);
  const applicants = useApplicantsByDepartment(slug);
  const { evalMap } = useEvaluationsMap();
  const { isSelected } = useSelectionManager();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [levelFilter, setLevelFilter] = useState("all");

  const levels = useMemo(() => {
    const set = new Set(applicants.map((a) => a.commonAnswers?.level).filter(Boolean));
    return Array.from(set).sort();
  }, [applicants]);

  const filtered = useMemo(() => {
    let list = applicants;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.rollNumber?.toLowerCase().includes(q) ||
          a.commonAnswers?.degree?.toLowerCase().includes(q) ||
          a.commonAnswers?.house?.toLowerCase().includes(q)
      );
    }

    if (levelFilter !== "all") {
      list = list.filter((a) => a.commonAnswers?.level === levelFilter);
    }

    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "roll-asc":
          return (a.rollNumber || "").localeCompare(b.rollNumber || "", undefined, {
            numeric: true,
          });
        case "rating-desc": {
          const rA = Number(evalMap.get(a.applicantId)?.avgRating) || 0;
          const rB = Number(evalMap.get(b.applicantId)?.avgRating) || 0;
          return rB - rA;
        }
        case "recent":
          return (b.timestamp || "").localeCompare(a.timestamp || "");
        case "name-asc":
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });

    return sorted;
  }, [applicants, query, levelFilter, sort, evalMap]);

  if (loading) return null;

  if (!deptConfig) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="font-display text-2xl text-ink">Unknown department</p>
        <Link
          to="/"
          className="mt-4 inline-block font-mono text-xs uppercase tracking-wide text-oxblood"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Top Breadcrumb & Department Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-line pb-6">
        <div>
          <Link
            to="/"
            className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-oxblood"
          >
            ← All Departments
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {deptConfig.label}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-paper-raised px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-ink border border-line shadow-xs">
            {applicants.length} {applicants.length === 1 ? "Applicant" : "Applicants"}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="my-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applicants…"
            className="w-full rounded-lg border border-line bg-paper-raised px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none shadow-xs"
          />
        </div>

        <div className="flex gap-3 shrink-0">
          {levels.length > 0 && (
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="rounded-lg border border-line bg-paper-raised px-3.5 py-2.5 font-mono text-xs uppercase tracking-wide text-ink-soft shadow-xs focus:outline-none"
            >
              <option value="all">All Academic Levels</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-line bg-paper-raised px-3.5 py-2.5 font-mono text-xs uppercase tracking-wide text-ink-soft shadow-xs focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                Sort: {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-Column Roster Grid (No Empty Margins) */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line bg-paper-raised p-16 text-center text-ink-soft">
          No applicants match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <ApplicantCard
              key={a.applicantId}
              applicant={a}
              evalData={evalMap.get(a.applicantId)}
              isSelected={isSelected(a.applicantId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
