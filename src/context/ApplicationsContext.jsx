import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { importCsv } from "../lib/csvImporter";
import {
  replaceAllApplications,
  getAllApplications,
  getLastImportMeta,
  clearAllApplications,
  getSelectedCandidateIds,
  toggleCandidateSelection,
} from "../lib/store";

const ApplicationsContext = createContext(null);

export function ApplicationsProvider({ children }) {
  const [applications, setApplications] = useState([]);
  const [importMeta, setImportMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [lastImportSummary, setLastImportSummary] = useState(null);

  // Global Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [apps, meta, selIds] = await Promise.all([
        getAllApplications(),
        getLastImportMeta(),
        getSelectedCandidateIds(),
      ]);
      setApplications(apps || []);
      setImportMeta(meta || null);
      setSelectedIds(new Set(selIds || []));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadCsv = useCallback(async (file) => {
    setImporting(true);
    try {
      const text = await file.text();
      const { applications: parsedApplications, summary } = importCsv(text);
      if (summary.fatal) {
        setLastImportSummary(summary);
        return { ok: false, summary };
      }
      await replaceAllApplications(parsedApplications, summary);
      setApplications(parsedApplications);
      setLastImportSummary(summary);
      await refresh();
      return { ok: true, summary };
    } catch (err) {
      const summary = { fatal: `Could not read this file: ${err.message || err}` };
      setLastImportSummary(summary);
      return { ok: false, summary };
    } finally {
      setImporting(false);
    }
  }, [refresh]);

  const clearData = useCallback(async () => {
    await clearAllApplications();
    setApplications([]);
    setImportMeta(null);
    setLastImportSummary(null);
    setSelectedIds(new Set());
    await refresh();
  }, [refresh]);

  const toggleSelect = useCallback(
    async (applicantId) => {
      const isCurrentlySelected = selectedIds.has(applicantId);
      const nextState = !isCurrentlySelected;
      await toggleCandidateSelection(applicantId, nextState);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (nextState) next.add(applicantId);
        else next.delete(applicantId);
        return next;
      });
    },
    [selectedIds]
  );

  const selectedApplicants = useMemo(() => {
    return applications.filter((a) => selectedIds.has(a.applicantId));
  }, [applications, selectedIds]);

  const value = useMemo(
    () => ({
      applications,
      importMeta,
      loading,
      importing,
      lastImportSummary,
      uploadCsv,
      clearData,
      refresh,
      // Selections
      selectedIds,
      selectedApplicants,
      selectedCount: selectedApplicants.length,
      isSelected: (id) => selectedIds.has(id),
      toggleSelect,
    }),
    [
      applications,
      importMeta,
      loading,
      importing,
      lastImportSummary,
      uploadCsv,
      clearData,
      refresh,
      selectedIds,
      selectedApplicants,
      toggleSelect,
    ]
  );

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
}

export function useApplicationsStore() {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) throw new Error("useApplicationsStore must be used within ApplicationsProvider");
  return ctx;
}
