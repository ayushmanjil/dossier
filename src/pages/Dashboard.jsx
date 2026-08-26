import { useApplicationsStore } from "../context/ApplicationsContext";
import { useDepartmentSummaries } from "../hooks/useRecruitmentData";
import DepartmentCard from "../components/DepartmentCard";
import EmptyState from "../components/EmptyState";

export default function Dashboard() {
  const { applications, loading, importMeta } = useApplicationsStore();
  const departments = useDepartmentSummaries();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
        Opening the archive…
      </div>
    );
  }

  if (applications.length === 0) {
    return <EmptyState />;
  }

  const total = applications.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="mb-10">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-brass">
          Recruitment Cycle
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          The Applicant Archive
        </h1>
        <p className="mt-3 text-base text-ink-soft max-w-3xl">
          {total} {total === 1 ? "application has" : "applications have"} been sorted across{" "}
          {departments.filter((d) => !d.isUnassigned).length} departments. Select a department to evaluate candidate dossiers.
        </p>
        {importMeta?.importedAt && (
          <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-wide text-ink-faint">
            Last imported{" "}
            {typeof importMeta.importedAt === "string"
              ? new Date(importMeta.importedAt).toLocaleString()
              : "recently"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {departments.map((dept, i) => (
          <DepartmentCard key={dept.slug} department={dept} index={i} />
        ))}
      </div>
    </div>
  );
}
