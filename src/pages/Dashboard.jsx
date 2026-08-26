import { useState } from "react";
import { useApplicationsStore } from "../context/ApplicationsContext";
import { useDepartmentSummaries } from "../hooks/useRecruitmentData";
import { useAuth } from "../context/AuthContext";
import { exportAllApplicantsToCsv } from "../lib/exportCsv";
import DepartmentCard from "../components/DepartmentCard";
import EmptyState from "../components/EmptyState";

export default function Dashboard() {
  const { applications, loading, importMeta } = useApplicationsStore();
  const { isAdmin } = useAuth();
  const departments = useDepartmentSummaries();
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  async function handleExport() {
    setExporting(true);
    setExportSuccess(false);
    try {
      await exportAllApplicantsToCsv(applications);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      alert("Failed to export CSV: " + (err.message || err));
    } finally {
      setExporting(false);
    }
  }

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
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-brass">
            Applicant Archive
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Sahityika Recruitment Drive 2026
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

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg border border-line bg-paper-raised px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-ink transition-all hover:border-oxblood hover:text-oxblood active:scale-[0.99] shadow-xs disabled:opacity-50 cursor-pointer"
            title="Export all applicants, responses, ratings, and statuses to CSV"
          >
            <span>↓</span>
            <span>{exporting ? "Generating CSV…" : exportSuccess ? "✓ Exported" : "Export Archive CSV"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {departments.map((dept, i) => (
          <DepartmentCard key={dept.slug} department={dept} index={i} />
        ))}
      </div>
    </div>
  );
}
