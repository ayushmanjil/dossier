import { Link, useParams } from "react-router-dom";
import { useApplicant, useDepartmentConfig, useApplicantsByDepartment, useSelectionManager } from "../hooks/useRecruitmentData";
import { useApplicationsStore } from "../context/ApplicationsContext";
import { useAuth } from "../context/AuthContext";
import AnswerBlock from "../components/AnswerBlock";
import LinkButton from "../components/LinkButton";
import RightPaneEvaluations from "../components/RightPaneEvaluations";

function formatTimestamp(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ApplicantView() {
  const { id } = useParams();
  const { loading } = useApplicationsStore();
  const { isAdmin } = useAuth();
  const { isSelected, toggleSelect } = useSelectionManager();
  const applicant = useApplicant(id);
  const deptConfig = useDepartmentConfig(applicant?.department);
  const deptApplicants = useApplicantsByDepartment(applicant?.department || "");

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center font-mono text-xs uppercase tracking-widest text-ink-faint">
        Opening candidate dossier…
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-display text-2xl text-ink">Applicant Not Found</p>
        <Link to="/" className="mt-4 inline-block font-mono text-xs uppercase tracking-wide text-oxblood hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const {
    name,
    rollNumber,
    department,
    departmentLabel,
    commonAnswers = {},
    departmentAnswers = [],
    links = [],
    timestamp,
  } = applicant;

  const submitted = formatTimestamp(timestamp);
  const selected = isSelected(applicant.applicantId);

  // Ensure every question belonging to this candidate's department is included in exact order
  const deptQuestions = deptConfig?.questions || [];
  const existingAnswersByKey = new Map((departmentAnswers || []).map((q) => [q.key, q]));
  const existingAnswersByPrompt = new Map(
    (departmentAnswers || [])
      .filter((q) => q.question)
      .map((q) => [q.question.trim().toLowerCase(), q])
  );

  const enrichedAnswers = deptQuestions.map((cfg) => {
    const existing =
      existingAnswersByKey.get(cfg.key) ||
      existingAnswersByPrompt.get((cfg.prompt || "").trim().toLowerCase()) ||
      null;

    let rawAnswer = existing?.rawAnswer ?? "";
    let prose = existing?.prose ?? "";
    let links = existing?.links ? [...existing.links] : [];

    // Fallback if resume link exists in applicant.links but not yet in question
    if (cfg.type === "resume" && (!links || links.length === 0) && !rawAnswer) {
      const foundResume = (applicant.links || []).find((l) => l.type === "resume");
      if (foundResume) {
        links = [foundResume];
        rawAnswer = foundResume.url;
      }
    }

    return {
      key: cfg.key,
      label: cfg.label || existing?.label || "Question",
      question: cfg.prompt || existing?.question || cfg.label,
      type: cfg.type || existing?.type || "long",
      rawAnswer,
      prose: prose || rawAnswer,
      links,
      optional: Boolean(cfg.optional),
    };
  });

  // Preserve any additional department questions that might exist
  const configuredKeys = new Set(deptQuestions.map((q) => q.key));
  (departmentAnswers || []).forEach((q) => {
    if (q.key && !configuredKeys.has(q.key)) {
      enrichedAnswers.push({
        key: q.key,
        label: q.label || "Question",
        question: q.question || q.label,
        type: q.type || "long",
        rawAnswer: q.rawAnswer || "",
        prose: q.prose || q.rawAnswer || "",
        links: q.links || [],
      });
    }
  });

  // Next / Previous applicant in this department
  const currentIndex = deptApplicants.findIndex((a) => a.applicantId === applicant.applicantId);
  const prevApplicant = currentIndex > 0 ? deptApplicants[currentIndex - 1] : null;
  const nextApplicant = currentIndex >= 0 && currentIndex < deptApplicants.length - 1 ? deptApplicants[currentIndex + 1] : null;

  const isMember = commonAnswers.sahityikaMember?.toLowerCase().includes("yes");

  return (
    <div className="h-full flex flex-col w-full max-w-[1680px] mx-auto px-4 sm:px-6 py-2 overflow-hidden">
      {/* Top Header: Department Breadcrumb + Candidate Navigator */}
      <div className="shrink-0 py-2 border-b border-line/70 flex items-center justify-between mb-3">
        <Link
          to={`/department/${department}`}
          className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-oxblood flex items-center gap-2 font-medium"
        >
          <span>←</span>
          <span>{departmentLabel || "Department Roster"}</span>
        </Link>

        {/* Responses Count */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="rounded-full bg-paper px-3 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-ink-soft border border-line">
            {enrichedAnswers.length} {enrichedAnswers.length === 1 ? "Response" : "Responses"}
          </span>
        </div>

        {/* Candidate Counter & Navigation */}
        <div className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft">
          {prevApplicant ? (
            <Link
              to={`/applicant/${prevApplicant.applicantId}`}
              className="rounded border border-line bg-paper-raised px-2.5 py-1 text-ink-soft hover:border-oxblood hover:text-oxblood transition-colors"
              title={`Previous: ${prevApplicant.name}`}
            >
              ← {prevApplicant.name.split(" ")[0]}
            </Link>
          ) : (
            <span className="rounded border border-line/40 px-2.5 py-1 text-ink-faint opacity-40 cursor-not-allowed">
              ← Prev
            </span>
          )}

          <span className="rounded bg-brass/10 px-2 py-0.5 font-mono text-[0.65rem] text-brass font-bold">
            {currentIndex + 1} / {deptApplicants.length}
          </span>

          {nextApplicant ? (
            <Link
              to={`/applicant/${nextApplicant.applicantId}`}
              className="rounded border border-line bg-paper-raised px-2.5 py-1 text-ink-soft hover:border-oxblood hover:text-oxblood transition-colors"
              title={`Next: ${nextApplicant.name}`}
            >
              {nextApplicant.name.split(" ")[0]} →
            </Link>
          ) : (
            <span className="rounded border border-line/40 px-2.5 py-1 text-ink-faint opacity-40 cursor-not-allowed">
              Next →
            </span>
          )}
        </div>
      </div>

      {/* 3-Pane Layout: Left (Info), Centre (Questions & Answers), Right (Evaluations) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch pb-2">
        {/* ======================================================== */}
        {/* LEFT PANE: Candidate Info (Fixed inside height, no scrollbar) */}
        {/* ======================================================== */}
        <aside className="lg:col-span-3 h-full overflow-y-auto no-scrollbar">
          <div className="rounded-xl border border-line bg-paper-raised p-4 shadow-lifted">
            {/* Header: Dept & Roll & Admin Select Button */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-oxblood/10 px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-oxblood font-bold">
                  {departmentLabel}
                </span>
                {rollNumber && (
                  <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[0.58rem] uppercase text-ink font-semibold border border-line">
                    {rollNumber}
                  </span>
                )}
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => toggleSelect(applicant.applicantId)}
                  title={selected ? "Remove from Selected Candidates" : "Mark as Selected Candidate"}
                  className={`rounded px-2 py-0.5 font-mono text-[0.58rem] uppercase font-bold tracking-wider transition-colors ${
                    selected
                      ? "bg-forest text-paper-raised"
                      : "border border-line bg-paper text-ink-soft hover:border-forest hover:text-forest"
                  }`}
                >
                  {selected ? "✓ Selected" : "+ Select"}
                </button>
              )}
            </div>

            <h1 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl leading-tight">
              {name}
            </h1>

            {submitted && (
              <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-wide text-ink-faint">
                Applied {submitted}
              </p>
            )}

            {/* Badges */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1 border-t border-line/50 pt-2.5">
              {commonAnswers.house && (
                <span className="rounded bg-forest/10 px-2 py-0.5 font-mono text-[0.58rem] font-medium text-forest border border-forest/20">
                  House {commonAnswers.house}
                </span>
              )}
              {commonAnswers.gender && (
                <span className="rounded bg-paper px-2 py-0.5 font-mono text-[0.58rem] text-ink-soft border border-line">
                  {commonAnswers.gender}
                </span>
              )}
              {commonAnswers.level && (
                <span className="rounded bg-brass/10 px-2 py-0.5 font-mono text-[0.58rem] text-brass font-medium border border-brass/20">
                  {commonAnswers.level}
                </span>
              )}
            </div>

            {/* Demographics List */}
            <div className="mt-2.5 space-y-1.5 rounded-lg bg-paper/60 p-2.5 border border-line/50 text-xs">
              <div className="flex items-baseline justify-between gap-1.5 border-b border-line/30 pb-1.5">
                <span className="font-mono text-[0.58rem] uppercase tracking-wider text-ink-faint">
                  Degree
                </span>
                <span className="font-medium text-ink text-right text-[0.72rem]">
                  {commonAnswers.degree || "—"}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-1.5 border-b border-line/30 pb-1.5">
                <span className="font-mono text-[0.58rem] uppercase tracking-wider text-ink-faint">
                  State
                </span>
                <span className="font-medium text-ink text-right">
                  {commonAnswers.homeState || "—"}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-1.5">
                <span className="font-mono text-[0.58rem] uppercase tracking-wider text-ink-faint">
                  Member
                </span>
                <span className={`font-semibold ${isMember ? "text-forest" : "text-ink-soft"}`}>
                  {isMember ? "✓ Yes" : "— No"}
                </span>
              </div>
            </div>

            {/* Program Track */}
            {commonAnswers.applicable && (
              <div className="mt-2 rounded-lg bg-paper/40 p-2 border border-line/40">
                <p className="font-mono text-[0.55rem] uppercase tracking-widest text-ink-faint mb-0.5">
                  Track
                </p>
                <p className="text-[0.7rem] text-ink-soft italic leading-snug">
                  {commonAnswers.applicable}
                </p>
              </div>
            )}

            {/* Attachments Embedded Inside Left Card */}
            {links.length > 0 && (
              <div className="mt-2.5 border-t border-line/60 pt-2.5">
                <p className="font-mono text-[0.58rem] uppercase tracking-wider text-brass font-bold mb-1.5">
                  Attachments ({links.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {links.map((l, i) => (
                    <LinkButton key={i} label={l.label || "Open Attachment"} url={l.url} tone="forest" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ======================================================== */}
        {/* CENTRE PANE: Snap-scroll question-by-question (Only this pane scrolls) */}
        {/* ======================================================== */}
        <main className="lg:col-span-6 h-full overflow-y-auto no-scrollbar snap-scroll-container pr-1">
          {/* Question Cards Stack */}
          {enrichedAnswers.length === 0 ? (
            <div className="rounded-xl border border-line bg-paper-raised p-10 text-center text-ink-soft text-sm shadow-lifted">
              No department-specific responses recorded for this applicant.
            </div>
          ) : (
            <div className="space-y-4 pb-12">
              {enrichedAnswers.map((q, idx) => (
                <AnswerBlock
                  key={q.key || idx}
                  question={q}
                  index={idx}
                  totalQuestions={enrichedAnswers.length}
                />
              ))}
            </div>
          )}
        </main>

        {/* ======================================================== */}
        {/* RIGHT PANE: Evaluations (Fixed inside height, no scrollbar) */}
        {/* ======================================================== */}
        <aside className="lg:col-span-3 h-full overflow-y-auto no-scrollbar">
          <RightPaneEvaluations applicantId={applicant.applicantId} />
        </aside>
      </div>
    </div>
  );
}
