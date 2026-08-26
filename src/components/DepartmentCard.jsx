import { Link } from "react-router-dom";

const SPINE_ACCENTS = ["bg-oxblood", "bg-forest", "bg-brass", "bg-oxblood-deep", "bg-forest-deep"];

export default function DepartmentCard({ department, index }) {
  const accent = department.isUnassigned ? "bg-ink-faint" : SPINE_ACCENTS[index % SPINE_ACCENTS.length];
  const content = (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-md border border-line/70 bg-paper-raised shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted">
      <div className={`h-2 w-full ${accent}`} />
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-faint">
            {department.isUnassigned ? "Needs Configuration" : `${department.questionCount} Questions`}
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold leading-snug text-ink">
            {department.label}
          </h3>
        </div>
        <div className="mt-8 flex items-end justify-between">
          <div>
            <span className="font-display text-4xl font-semibold text-ink">{department.count}</span>
            <span className="ml-2 font-mono text-xs uppercase tracking-wide text-ink-soft">
              {department.count === 1 ? "Application" : "Applications"}
            </span>
          </div>
          <span className="font-mono text-xs text-ink-faint opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Open →
          </span>
        </div>
      </div>
    </div>
  );

  if (department.count === 0) {
    return <div className="cursor-default opacity-60">{content}</div>;
  }

  return (
    <Link to={`/department/${department.slug}`} className="block h-full">
      {content}
    </Link>
  );
}
