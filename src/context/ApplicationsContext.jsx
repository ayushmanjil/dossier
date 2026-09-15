import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { importCsv } from "../lib/csvImporter";
import {
  replaceAllApplications,
  getAllApplications,
  getLastImportMeta,
  clearAllApplications,
  getSelectedCandidateIds,
  toggleCandidateSelection,
  getShortlistedCandidateIds,
  toggleCandidateShortlist,
  getDepartmentTeams,
  saveDepartmentTeam,
} from "../lib/store";

const ApplicationsContext = createContext(null);

export function ApplicationsProvider({ children }) {
  const [applications, setApplications] = useState([]);
  const [importMeta, setImportMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [lastImportSummary, setLastImportSummary] = useState(null);

  // Global Selection State (final membership)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Shortlisted for Interview
  const [shortlistedIds, setShortlistedIds] = useState(new Set());

  // Candidate list filter: "all" | "shortlisted"
  const [candidateFilter, setCandidateFilter] = useState("all");

  // Department Teams
  const [departmentTeams, setDepartmentTeams] = useState({});

  const refreshTeams = useCallback(async () => {
    try {
      const teams = await getDepartmentTeams();
      setDepartmentTeams(teams || {});
    } catch (err) {
      console.error("Failed to load department teams:", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [apps, meta, selIds, shortIds, teams] = await Promise.all([
        getAllApplications(),
        getLastImportMeta(),
        getSelectedCandidateIds(),
        getShortlistedCandidateIds(),
        getDepartmentTeams(),
      ]);
      setApplications(apps || []);
      setImportMeta(meta || null);
      setSelectedIds(new Set(selIds || []));
      setShortlistedIds(new Set(shortIds || []));
      setDepartmentTeams(teams || {});
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
    setShortlistedIds(new Set());
    await refresh();
  }, [refresh]);

  // Toggle final membership selection
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

  // Toggle shortlist for interview
  const toggleShortlist = useCallback(
    async (applicantId) => {
      const isCurrentlyShortlisted = shortlistedIds.has(applicantId);
      const nextState = !isCurrentlyShortlisted;
      await toggleCandidateShortlist(applicantId, nextState);
      setShortlistedIds((prev) => {
        const next = new Set(prev);
        if (nextState) next.add(applicantId);
        else next.delete(applicantId);
        return next;
      });
    },
    [shortlistedIds]
  );

  // Save a department team
  const saveTeam = useCallback(async (deptSlug, teamData) => {
    const saved = await saveDepartmentTeam(deptSlug, teamData);
    setDepartmentTeams((prev) => ({ ...prev, [deptSlug]: saved }));
    return saved;
  }, []);

  const selectedApplicants = useMemo(() => {
    return applications.filter((a) => selectedIds.has(a.applicantId));
  }, [applications, selectedIds]);

  const shortlistedApplicants = useMemo(() => {
    return applications.filter((a) => shortlistedIds.has(a.applicantId));
  }, [applications, shortlistedIds]);

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
      // Final selection (membership)
      selectedIds,
      selectedApplicants,
      selectedCount: selectedApplicants.length,
      isSelected: (id) => selectedIds.has(id),
      toggleSelect,
      // Interview shortlist
      shortlistedIds,
      shortlistedApplicants,
      shortlistedCount: shortlistedApplicants.length,
      isShortlisted: (id) => shortlistedIds.has(id),
      toggleShortlist,
      // Candidate filter
      candidateFilter,
      setCandidateFilter,
      // Department teams
      departmentTeams,
      saveTeam,
      refreshTeams,
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
      shortlistedIds,
      shortlistedApplicants,
      toggleShortlist,
      candidateFilter,
      departmentTeams,
      saveTeam,
      refreshTeams,
    ]
  );

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
}

export function useApplicationsStore() {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) throw new Error("useApplicationsStore must be used within ApplicationsProvider");
  return ctx;
}
