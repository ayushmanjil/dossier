import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApplicationsStore } from "../context/ApplicationsContext";
import { useDepartmentSummaries } from "../hooks/useRecruitmentData";
import { useAuth } from "../context/AuthContext";
import UploadDropzone from "../components/UploadDropzone";
import AdminGate from "../components/AdminGate";

function SummaryList({ title, items, tone = "ink-soft" }) {
  if (!items || items.length === 0) return null;
  const toneClass = tone === "oxblood" ? "text-oxblood" : "text-ink-soft";
  return (
    <div className="mt-4">
      <p className={`font-mono text-[0.65rem] uppercase tracking-[0.14em] ${toneClass}`}>{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-ink-soft">
        {items.map((item, i) => (
          <li key={i}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function UploadAdmin() {
  const { uploadCsv, clearData, importing, applications, importMeta } = useApplicationsStore();
  const { verifyAdminPassword } = useAuth();
  const departmentSummaries = useDepartmentSummaries();
  const [fileError, setFileError] = useState(null);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  // Wipe Modal State
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipePassword, setWipePassword] = useState("");
  const [wipeShowPass, setWipeShowPass] = useState(false);
  const [wipeError, setWipeError] = useState("");
  const [wiping, setWiping] = useState(false);
  const [wipeSuccess, setWipeSuccess] = useState(false);

  async function handleFile(file, err) {
    setResult(null);
    setWipeSuccess(false);
    if (err) {
      setFileError(err);
      return;
    }
    setFileError(null);
    const { ok, summary } = await uploadCsv(file);
    setResult({ ok, summary });
  }

  async function handleWipeSubmit(e) {
    e.preventDefault();
    setWipeError("");
    setWiping(true);
    try {
      const isValid = await verifyAdminPassword(wipePassword);
      if (!isValid) {
        setWipeError("Incorrect administrator password.");
        setWiping(false);
        return;
      }

      await clearData();
      setShowWipeModal(false);
      setWipePassword("");
      setWipeSuccess(true);
      setResult(null);
    } catch (err) {
      setWipeError(err.message || "Failed to wipe data.");
    } finally {
      setWiping(false);
    }
  }

  const summary = result?.summary;
  const totalCount = applications.length;

  return (
    <AdminGate>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-line pb-8">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-brass">
              Admin Console
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Application Data & CSV Hub
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Manage the master candidate dataset, view department-wise statistics, upload new CSVs, or wipe the archive.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/interviewers"
              className="rounded-md border border-line bg-paper-raised px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide text-ink-soft hover:border-oxblood hover:text-oxblood transition-colors"
            >
              Interviewers →
            </Link>
          </div>
        </div>

        {/* Live Department Overview Cards */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              Current Archive Breakdown
            </h2>
            <span className="font-mono text-xs uppercase tracking-wider text-brass font-medium">
              Total Applications: {totalCount}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {departmentSummaries.map((dept) => (
              <div
                key={dept.slug}
                className="rounded-lg border border-line bg-paper-raised p-4 shadow-lifted"
              >
                <p className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint line-clamp-1">
                  {dept.label}
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-ink">
                  {dept.count}
                </p>
                <p className="text-[0.65rem] font-mono text-ink-soft mt-0.5">
                  {dept.count === 1 ? "applicant" : "applicants"}
                </p>
              </div>
            ))}
          </div>

          {importMeta?.importedAt && (
            <p className="mt-3 text-right font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">
              Last import: {typeof importMeta.importedAt === "string" ? new Date(importMeta.importedAt).toLocaleString() : "Recently"}
            </p>
          )}
        </div>

        {/* Wipe Success Alert */}
        {wipeSuccess && (
          <div className="mt-8 rounded-md border border-forest/40 bg-forest/10 px-5 py-4 text-sm text-forest">
            <strong>Archive Wiped Clean:</strong> All application dossiers have been removed. The website is now a blank slate ready for a new CSV upload.
          </div>
        )}

        {/* Upload Section */}
        <div className="mt-12 rounded-lg border border-line bg-paper-raised p-8 shadow-lifted">
          <h2 className="font-display text-xl font-semibold text-ink">
            Upload / Replace CSV
          </h2>
          <p className="mt-1.5 text-xs text-ink-soft">
            Upload a Google Form responses CSV export. This will update all applicant dossiers across the four departments.
          </p>

          <div className="mt-6">
            <UploadDropzone onFile={handleFile} disabled={importing} />
          </div>

          {importing && (
            <p className="mt-4 text-center font-mono text-xs uppercase tracking-wide text-ink-faint">
              Parsing and organizing applications…
            </p>
          )}

          {fileError && (
            <div className="mt-6 rounded-md border border-oxblood/40 bg-oxblood/5 px-5 py-4 text-sm text-oxblood">
              {fileError}
            </div>
          )}

          {summary?.fatal && (
            <div className="mt-6 rounded-md border border-oxblood/40 bg-oxblood/5 px-5 py-4 text-sm text-oxblood">
              <p className="font-semibold">Import could not proceed</p>
              <p className="mt-1">{summary.fatal}</p>
            </div>
          )}

          {result?.ok && summary && (
            <div className="mt-6 rounded-md border border-forest/40 bg-forest/5 px-5 py-5">
              <p className="font-display text-lg font-semibold text-forest">
                Imported {summary.importedCount} application{summary.importedCount === 1 ? "" : "s"} across{" "}
                {Object.keys(summary.departmentCounts || {}).length} departments.
              </p>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs uppercase tracking-wide text-ink-soft">
                {Object.entries(summary.departmentCounts || {}).map(([label, count]) => (
                  <span key={label}>
                    {label}: {count}
                  </span>
                ))}
              </div>

              {summary.skippedCount > 0 && (
                <SummaryList
                  title={`${summary.skippedCount} row(s) skipped`}
                  items={summary.rowErrors?.map((e) => `Row ${e.rowNumber}: ${e.reason}`)}
                />
              )}

              {summary.unknownDepartmentValues?.length > 0 && (
                <SummaryList
                  title="Unrecognized department values (filed under 'Unrecognized Department')"
                  items={summary.unknownDepartmentValues}
                />
              )}

              {summary.pendingColumns?.length > 0 && (
                <SummaryList
                  title="Recognized but unassigned columns"
                  items={summary.pendingColumns}
                />
              )}

              <button
                onClick={() => navigate("/")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-paper-raised transition-colors hover:bg-forest-deep"
              >
                View Dashboard →
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone: Wipe Archive */}
        <div className="mt-12 rounded-lg border border-oxblood/30 bg-oxblood/5 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-oxblood">
                Danger Zone: Wipe Archive
              </h3>
              <p className="mt-1 text-xs text-ink-soft max-w-lg">
                Permanently deletes all candidate dossiers and returns the website to an empty state. Requires administrator password confirmation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowWipeModal(true);
                setWipeError("");
                setWipePassword("");
              }}
              className="shrink-0 rounded-md border border-oxblood bg-oxblood px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper-raised transition-colors hover:bg-oxblood-deep"
            >
              Wipe All Data
            </button>
          </div>
        </div>

        {/* Password Verification Modal for Wipe */}
        {showWipeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
            <div className="w-full max-w-md rounded-xl border border-line bg-paper-raised p-7 shadow-lifted animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-display text-lg font-semibold text-oxblood">
                  Confirm Archive Wipe
                </h3>
                <button
                  onClick={() => setShowWipeModal(false)}
                  className="text-ink-faint hover:text-ink font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="mt-4 text-xs text-ink-soft leading-relaxed">
                This action will <strong>permanently erase all {totalCount} applications</strong> from the database. To confirm, please enter your Admin password:
              </p>

              <form onSubmit={handleWipeSubmit} className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft">
                      Admin Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setWipeShowPass(!wipeShowPass)}
                      className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint hover:text-oxblood"
                    >
                      {wipeShowPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={wipeShowPass ? "text" : "password"}
                    required
                    autoFocus
                    placeholder="Enter admin password"
                    value={wipePassword}
                    onChange={(e) => setWipePassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none"
                  />
                </div>

                {wipeError && (
                  <div className="rounded border border-oxblood/30 bg-oxblood-soft/20 px-3 py-2 text-xs text-oxblood">
                    {wipeError}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWipeModal(false)}
                    className="rounded-md border border-line px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink-soft hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={wiping || !wipePassword}
                    className="rounded-md bg-oxblood px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper-raised hover:bg-oxblood-deep disabled:opacity-50"
                  >
                    {wiping ? "Wiping Data…" : "Permanently Wipe"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminGate>
  );
}
