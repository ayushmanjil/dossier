import { Link } from "react-router-dom";
import GlyphBar from "./GlyphBar";

export default function ApplicantCard({ applicant, evalData, isSelected }) {
  const { name, rollNumber, commonAnswers } = applicant;
  const initial = name?.trim()?.[0]?.toUpperCase() || "?";

  const count = evalData?.count || 0;
  const avgRating = evalData?.avgRating;
  const roundedAvg = evalData?.roundedAvg || 0;

  return (
    <Link
      to={`/applicant/${applicant.applicantId}`}
      className={`group relative flex items-center justify-between rounded-xl border bg-paper-raised p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted ${
        isSelected ? "border-forest/60 bg-forest/[0.03]" : "border-line/70 hover:border-oxblood/40"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border font-display text-base font-bold transition-colors ${
            isSelected
              ? "border-forest bg-forest/10 text-forest"
              : "border-line bg-paper text-ink-soft group-hover:border-oxblood/40 group-hover:text-oxblood"
          }`}
        >
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display text-base font-bold text-ink group-hover:text-oxblood transition-colors">
              {name}
            </p>
            {isSelected && (
              <span className="rounded bg-forest/15 px-1.5 py-0.2 font-mono text-[0.55rem] font-bold uppercase text-forest">
                Selected
              </span>
            )}
          </div>

          <p className="mt-0.5 truncate font-mono text-[0.68rem] text-ink-faint">
            {rollNumber || "No roll number"}
            {commonAnswers?.house ? ` · ${commonAnswers.house}` : ""}
            {commonAnswers?.degree ? ` · ${commonAnswers.degree}` : ""}
          </p>

          {/* Average Rating Bar & Score */}
          <div className="mt-2 flex items-center gap-2">
            {count > 0 ? (
              <>
                <GlyphBar value={roundedAvg} max={5} size="sm" />
                <span className="font-mono text-[0.68rem] font-bold text-ink">
                  {avgRating}{" "}
                  <span className="text-ink-faint text-[0.58rem]">
                    ({count} {count === 1 ? "review" : "reviews"})
                  </span>
                </span>
              </>
            ) : (
              <span className="font-mono text-[0.62rem] text-ink-faint/80 italic">
                No ratings yet
              </span>
            )}
          </div>
        </div>
      </div>

      <span className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-oxblood font-mono text-sm pl-2">
        →
      </span>
    </Link>
  );
}
