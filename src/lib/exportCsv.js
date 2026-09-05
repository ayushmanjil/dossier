import Papa from "papaparse";
import { getAllEvaluations, getSelectedCandidateIds } from "./store";
import { DEPARTMENTS } from "../config/recruitmentConfig";

/**
 * Exports all applicant dossiers, evaluations, selection statuses,
 * and responses to a comprehensive, UTF-8 formatted CSV file.
 */
export async function exportAllApplicantsToCsv(applications) {
  if (!applications || applications.length === 0) {
    throw new Error("No applicant records found to export.");
  }

  // 1. Fetch live evaluations & selection status
  const [allEvaluations, selectedIds] = await Promise.all([
    getAllEvaluations().catch(() => []),
    getSelectedCandidateIds().catch(() => []),
  ]);

  const selectedSet = new Set(selectedIds || []);

  // 2. Group evaluations by applicantId
  const evalsByApplicant = {};
  (allEvaluations || []).forEach((ev) => {
    if (!evalsByApplicant[ev.applicantId]) {
      evalsByApplicant[ev.applicantId] = [];
    }
    evalsByApplicant[ev.applicantId].push(ev);
  });

  // 3. Build a list of all department questions for consistent headers
  const allDeptQuestions = [];
  const seenKeys = new Set();
  DEPARTMENTS.forEach((dept) => {
    (dept.questions || []).forEach((q) => {
      if (!seenKeys.has(q.key)) {
        seenKeys.add(q.key);
        allDeptQuestions.push({
          key: q.key,
          label: q.label,
          prompt: q.prompt,
        });
      }
    });
  });

  // 4. Build comprehensive row for every applicant
  const rows = applications.map((app) => {
    const isSelected = selectedSet.has(app.applicantId);
    const evals = evalsByApplicant[app.applicantId] || [];

    // Compute evaluation stats
    const count = evals.length;
    const avgRating =
      count > 0
        ? (evals.reduce((sum, e) => sum + (Number(e.rating) || 0), 0) / count).toFixed(2)
        : "Unrated";

    const detailedFeedback = evals
      .map(
        (e) =>
          `[${e.interviewerName || "Interviewer"} (${e.rating}/5)${
            e.comments ? `: "${e.comments.replace(/"/g, '""')}"` : ""
          }]`
      )
      .join(" | ");

    // Extract links
    const resumeLink =
      (app.links || []).find((l) => l.type === "resume")?.url || "";
    const otherLinks = (app.links || [])
      .filter((l) => l.type !== "resume")
      .map((l) => l.url)
      .join(" ; ");

    const row = {
      "Applicant ID": app.applicantId || "",
      "Selection Status": isSelected ? "SELECTED" : "PENDING",
      "Full Name": app.name || "",
      "Roll Number": app.rollNumber || "",
      "Department": app.departmentLabel || app.department || "",
      "Average Rating (out of 5)": avgRating,
      "Total Interviewer Reviews": count,
      "Interviewer Ratings & Notes": detailedFeedback,
      "Submitted Timestamp": app.timestamp
        ? new Date(app.timestamp).toLocaleString()
        : "",
      "Gender": app.commonAnswers?.gender || "",
      "Degree": app.commonAnswers?.degree || "",
      "Level / Year": app.commonAnswers?.level || "",
      "Applicable Category": app.commonAnswers?.applicable || "",
      "Home State / UT": app.commonAnswers?.homeState || "",
      "House": app.commonAnswers?.house || "",
      "Existing Member": app.commonAnswers?.sahityikaMember || "",
      "Resume Link": resumeLink,
      "Portfolio Link(s)": otherLinks,
    };

    // Department-specific questions mapping
    const answersMap = {};
    (app.departmentAnswers || []).forEach((ans) => {
      answersMap[ans.key] = ans.rawAnswer || ans.prose || ans.value || "";
    });

    allDeptQuestions.forEach((q) => {
      const colHeader = q.prompt ? `[${q.label}] ${q.prompt}` : q.label;
      row[colHeader] = answersMap[q.key] || "";
    });

    return row;
  });

  // 5. Convert to CSV string with PapaParse
  const csvString = Papa.unparse(rows, {
    quotes: true,
    header: true,
  });

  // 6. Trigger download with UTF-8 BOM for Microsoft Excel / Google Sheets
  const blob = new Blob(["\uFEFF" + csvString], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `dossier_all_applicants_${dateStr}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: rows.length, filename };
}
