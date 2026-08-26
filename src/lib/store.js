import {
  collection,
  doc,
  getDocs,
  writeBatch,
  query,
  orderBy,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

/**
 * PERSISTENCE LAYER
 * ---------------------------------------------------------------------------
 * The rest of the app never talks to Firestore or localStorage directly —
 * it calls these functions. That keeps the CSV-driven recruitment module
 * swappable: today it's "upload CSV -> normalize -> store", but nothing
 * upstream (dashboard, department view, applicant view) needs to know or
 * care where the normalized data actually lives.
 *
 * Firestore layout (when configured):
 *   applications/{applicantId}        one doc per applicant, flattened
 *   meta/lastImport                   { summary, importedAt }
 *   evaluations/{applicantId}_{interviewerId}   <- FUTURE, see saveEvaluation()
 *
 * When Firebase isn't configured yet, everything falls back to
 * localStorage under the same shape, so the module is fully demo-able
 * before it's wired into the real project.
 */

const LS_APPLICATIONS_KEY = "sahityika_recruitment_applications_v1";
const LS_META_KEY = "sahityika_recruitment_meta_v1";
const LS_EVALUATIONS_KEY = "sahityika_recruitment_evaluations_v1";

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export async function replaceAllApplications(applications, summary) {
  if (isFirebaseConfigured) {
    // Clear existing docs, then write the new set in batches of 400.
    const existing = await getDocs(collection(db, "applications"));
    const deleteBatches = chunk(existing.docs, 400);
    for (const batchDocs of deleteBatches) {
      const b = writeBatch(db);
      batchDocs.forEach((d) => b.delete(d.ref));
      await b.commit();
    }

    const writeBatches = chunk(applications, 400);
    for (const group of writeBatches) {
      const b = writeBatch(db);
      group.forEach((application) => {
        b.set(doc(db, "applications", application.applicantId), application);
      });
      await b.commit();
    }

    await setDoc(doc(db, "meta", "lastImport"), {
      summary: serializeSummary(summary),
      importedAt: serverTimestamp(),
      count: applications.length,
    });
  } else {
    localStorage.setItem(LS_APPLICATIONS_KEY, JSON.stringify(applications));
    localStorage.setItem(
      LS_META_KEY,
      JSON.stringify({ summary: serializeSummary(summary), importedAt: new Date().toISOString(), count: applications.length })
    );
  }
}

export async function getAllApplications() {
  if (isFirebaseConfigured) {
    const snap = await getDocs(query(collection(db, "applications"), orderBy("name")));
    return snap.docs.map((d) => d.data());
  }
  const raw = localStorage.getItem(LS_APPLICATIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getLastImportMeta() {
  if (isFirebaseConfigured) {
    const snap = await getDocs(collection(db, "meta"));
    const found = snap.docs.find((d) => d.id === "lastImport");
    return found ? found.data() : null;
  }
  const raw = localStorage.getItem(LS_META_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearAllApplications() {
  if (isFirebaseConfigured) {
    await replaceAllApplications([], { importedCount: 0, departmentCounts: {} });
  } else {
    localStorage.removeItem(LS_APPLICATIONS_KEY);
    localStorage.removeItem(LS_META_KEY);
  }
}

// ---------------------------------------------------------------------------
// FUTURE: Interviewer evaluations
// ---------------------------------------------------------------------------
// Not wired into the UI yet (per spec: V2). Included now so the data model
// and applicant IDs are already shaped to support it without a rewrite.
// An evaluation is keyed by (applicantId, interviewerId) so each interviewer
// can have exactly one rating per applicant, editable, with the applicant's
// average computable client-side from all evaluation docs for that id.

const LS_SELECTED_KEY = "sahityika_selected_candidates_v1";

export async function saveEvaluation({ applicantId, interviewerId, interviewerName, rating, comments }) {
  const record = {
    applicantId,
    interviewerId,
    interviewerName: interviewerName || interviewerId || "Interviewer",
    rating: Number(rating) || 0,
    comments: (comments || "").trim(),
    updatedAt: new Date().toISOString(),
  };
  if (isFirebaseConfigured) {
    await setDoc(doc(db, "evaluations", `${applicantId}_${interviewerId}`), record);
  } else {
    const raw = localStorage.getItem(LS_EVALUATIONS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[`${applicantId}_${interviewerId}`] = record;
    localStorage.setItem(LS_EVALUATIONS_KEY, JSON.stringify(all));
  }
}

export async function deleteEvaluation(applicantId, interviewerId) {
  if (isFirebaseConfigured) {
    await deleteDoc(doc(db, "evaluations", `${applicantId}_${interviewerId}`));
  } else {
    const raw = localStorage.getItem(LS_EVALUATIONS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    delete all[`${applicantId}_${interviewerId}`];
    localStorage.setItem(LS_EVALUATIONS_KEY, JSON.stringify(all));
  }
}

export async function getEvaluationsForApplicant(applicantId) {
  if (isFirebaseConfigured) {
    const snap = await getDocs(collection(db, "evaluations"));
    return snap.docs.map((d) => d.data()).filter((e) => e.applicantId === applicantId);
  }
  const raw = localStorage.getItem(LS_EVALUATIONS_KEY);
  const all = raw ? JSON.parse(raw) : {};
  return Object.values(all).filter((e) => e.applicantId === applicantId);
}

export async function getAllEvaluations() {
  if (isFirebaseConfigured) {
    const snap = await getDocs(collection(db, "evaluations"));
    return snap.docs.map((d) => d.data());
  }
  const raw = localStorage.getItem(LS_EVALUATIONS_KEY);
  const all = raw ? JSON.parse(raw) : {};
  return Object.values(all);
}

// ---------------------------------------------------------------------------
// Candidate Selection / Shortlisting
// ---------------------------------------------------------------------------
export async function getSelectedCandidateIds() {
  if (isFirebaseConfigured) {
    const snap = await getDocs(collection(db, "selected_candidates"));
    return snap.docs.map((d) => d.id);
  }
  const raw = localStorage.getItem(LS_SELECTED_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleCandidateSelection(applicantId, isSelected) {
  if (isFirebaseConfigured) {
    if (isSelected) {
      await setDoc(doc(db, "selected_candidates", applicantId), {
        selectedAt: new Date().toISOString(),
      });
    } else {
      await deleteDoc(doc(db, "selected_candidates", applicantId));
    }
    return;
  }
  const raw = localStorage.getItem(LS_SELECTED_KEY);
  let list = raw ? JSON.parse(raw) : [];
  if (isSelected) {
    if (!list.includes(applicantId)) list.push(applicantId);
  } else {
    list = list.filter((id) => id !== applicantId);
  }
  localStorage.setItem(LS_SELECTED_KEY, JSON.stringify(list));
}

// ---------------------------------------------------------------------------
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function serializeSummary(summary) {
  // Firestore rejects `undefined` and Set objects; keep this JSON-safe.
  return JSON.parse(JSON.stringify(summary || {}));
}
