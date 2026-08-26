import { Link } from "react-router-dom";
import { useSelectionManager, useEvaluationsMap } from "../hooks/useRecruitmentData";
import { DEPARTMENTS, UNKNOWN_DEPARTMENT } from "../config/recruitmentConfig";
import GlyphBar from "../components/GlyphBar";
import { useAuth } from "../context/AuthContext";

export default function SelectedCandidates() {
  const { selectedApplicants, toggleSelect, selectedCount, loading } = useSelectionManager();
  const { evalMap } = useEvaluationsMap();
  const { isAdmin } = useAuth();

  // Group selected applicants by department slug
  const departmentGroups = DEPARTMENTS.map((dept) => {
    const apps = selectedApplicants.filter(
      (a) =>
        a.department === dept.slug ||
        (dept.match || []).some(
          (m) =>
            m.toLowerCase() === (a.department || "").toLowerCase() ||
            m.toLowerCase() === (a.departmentLabel || "").toLowerCase()
        )
    );
    return {
      ...dept,
      applicants: apps,
    };
  });

  const unassignedApps = selectedApplicants.filter(
    (a) => !departmentGroups.some((g) => g.applicants.some((app) => app.applicantId === a.applicantId))
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-24 text-center font-mono text-xs uppercase tracking-widest text-ink-faint">
        Loading selected candidates…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-brass">
            Recruitment Selection
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Selected Candidates
          </h1>
          <p className="mt-1.5 text-xs text-ink-soft">
            Shortlisted candidates organized department-wise for the final roster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-forest/15 px-3.5 py-1 font-mono text-xs font-bold text-forest border border-forest/30">
            {selectedCount} {selectedCount === 1 ? "Selected" : "Selected"}
          </span>
        </div>
      </div>

      {/* Empty State */}
      {selectedCount === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-line bg-paper-raised p-12 text-center shadow-card">
          <p className="font-display text-lg font-semibold text-ink">
            No candidates shortlisted yet
          </p>
          <p className="mt-2 max-w-md mx-auto text-xs text-ink-soft">
            Admins can mark candidates as selected by clicking the <strong>"+ Select"</strong> button on any applicant's dossier or department roster card.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-md bg-oxblood px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper-raised hover:bg-oxblood-deep transition-colors"
          >
            ← View Department Rosters
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {departmentGroups.map((dept) => {
            const list = dept.applicants;
            if (list.length === 0) return null;

            return (
              <div key={dept.slug} className="rounded-xl border border-line bg-paper-raised p-6 shadow-lifted">
                <div className="flex items-baseline justify-between border-b border-line/60 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-forest" />
                    <h2 className="font-display text-xl font-bold text-ink">
                      {dept.label}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-ink-faint">
                    {list.length} {list.length === 1 ? "candidate" : "candidates"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {list.map((applicant) => {
                    const evalData = evalMap.get(applicant.applicantId);
                    const avg = evalData?.avgRating;
                    const count = evalData?.count || 0;
                    const rounded = evalData?.roundedAvg || 0;

                    return (
                      <div
                        key={applicant.applicantId}
                        className="flex items-center justify-between rounded-lg border border-line bg-paper p-3.5 shadow-card hover:border-oxblood/40 transition-colors"
                      >
                        <Link
                          to={`/applicant/${applicant.applicantId}`}
                          className="min-w-0 flex-1 flex items-center gap-3"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-forest/40 bg-forest/10 font-display text-sm font-bold text-forest">
                            {applicant.name?.trim()?.[0]?.toUpperCase() || "?"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-sm font-bold text-ink">
                              {applicant.name}
                            </p>
                            <p className="truncate font-mono text-[0.62rem] text-ink-faint">
                              {applicant.rollNumber || "No roll"}
                              {applicant.commonAnswers?.house ? ` · ${applicant.commonAnswers.house}` : ""}
                            </p>

                            {/* Rating Indicator */}
                            <div className="mt-1 flex items-center gap-1.5">
                              {count > 0 ? (
                                <>
                                  <GlyphBar value={rounded} max={5} size="sm" />
                                  <span className="font-mono text-[0.62rem] font-bold text-ink">
                                    {avg}/5
                                  </span>
                                </>
                              ) : (
                                <span className="font-mono text-[0.58rem] text-ink-faint italic">
                                  Unrated
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>

                        {/* Admin Action: Remove from Selection */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleSelect(applicant.applicantId)}
                            title="Remove from selected"
                            className="ml-2 rounded border border-line px-2 py-1 font-mono text-[0.55rem] uppercase text-ink-faint hover:border-oxblood hover:text-oxblood transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Unassigned Section if any */}
          {unassignedApps.length > 0 && (
            <div className="rounded-xl border border-brass/50 bg-paper-raised p-6 shadow-lifted">
              <h2 className="font-display text-xl font-bold text-ink mb-4 border-b border-line/60 pb-3">
                Other Department Selections
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {unassignedApps.map((applicant) => (
                  <div
                    key={applicant.applicantId}
                    className="flex items-center justify-between rounded-lg border border-line bg-paper p-3"
                  >
                    <Link to={`/applicant/${applicant.applicantId}`} className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-bold text-ink">{applicant.name}</p>
                      <p className="font-mono text-[0.62rem] text-ink-faint">{applicant.departmentRawValue}</p>
                    </Link>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => toggleSelect(applicant.applicantId)}
                        className="rounded border border-line px-2 py-1 font-mono text-[0.55rem] uppercase text-ink-faint hover:text-oxblood"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
