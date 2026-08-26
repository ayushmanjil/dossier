import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { saveEvaluation, deleteEvaluation, getEvaluationsForApplicant } from "../lib/store";
import GlyphBar, { GLYPH_LABELS, CAPSULE_PALETTE } from "./GlyphBar";

export default function RightPaneEvaluations({ applicantId }) {
  const { currentUser, isAdmin } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for Interviewer
  const [rating, setRating] = useState(4);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showRateForm, setShowRateForm] = useState(false);

  // Expanded Accordion state
  const [expandedIds, setExpandedIds] = useState(new Set());

  const currentInterviewerId = currentUser?.id || currentUser?.username || "interviewer";
  const currentInterviewerName = currentUser?.name || currentUser?.username || "Interviewer";

  useEffect(() => {
    loadEvaluations();
  }, [applicantId]);

  async function loadEvaluations() {
    setLoading(true);
    try {
      const data = await getEvaluationsForApplicant(applicantId);
      // Filter only those who provided a rating > 0 or a comment
      const valid = (data || []).filter(
        (e) => Number(e.rating) > 0 || (e.comments && e.comments.trim().length > 0)
      );
      setEvaluations(valid);

      // Prepopulate current interviewer's evaluation if exists
      const myEval = (data || []).find((e) => e.interviewerId === currentInterviewerId);
      if (myEval) {
        setRating(myEval.rating || 4);
        setComments(myEval.comments || "");
      } else {
        setRating(4);
        setComments("");
      }
    } catch (err) {
      console.error("Error loading evaluations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg("");
    try {
      await saveEvaluation({
        applicantId,
        interviewerId: currentInterviewerId,
        interviewerName: currentInterviewerName,
        rating,
        comments,
      });
      setSuccessMsg("Rating saved");
      setShowRateForm(false);
      await loadEvaluations();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert("Failed to save evaluation: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRating() {
    if (!window.confirm("Are you sure you want to remove your assessment for this candidate?")) {
      return;
    }
    setSubmitting(true);
    try {
      await deleteEvaluation(applicantId, currentInterviewerId);
      setRating(4);
      setComments("");
      setShowRateForm(false);
      await loadEvaluations();
    } catch (err) {
      alert("Failed to delete rating: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const count = evaluations.length;
  const avgRating =
    count > 0
      ? (evaluations.reduce((acc, e) => acc + (Number(e.rating) || 0), 0) / count).toFixed(1)
      : null;
  const roundedAvg = avgRating ? Math.round(Number(avgRating)) : 0;
  const avgConfig = roundedAvg > 0 ? CAPSULE_PALETTE[roundedAvg - 1] : null;

  const hasMyEvaluation = evaluations.some((e) => e.interviewerId === currentInterviewerId);

  return (
    <div className="rounded-xl border border-line bg-paper-raised p-4 shadow-lifted">
      {/* Header & Prominent Average Rating Display */}
      <div className="border-b border-line/60 pb-3.5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-brass font-bold">
            Assessment Panel
          </p>
          <span className="font-mono text-[0.62rem] text-ink-faint">
            {count} {count === 1 ? "review" : "reviews"}
          </span>
        </div>

        <h3 className="font-display text-lg font-bold text-ink mt-0.5">
          Candidate Evaluation
        </h3>

        {/* Top Average Rating Box */}
        <div className="mt-3 rounded-lg bg-paper/80 p-3 border border-line/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-soft">
              Average Rating
            </span>
            {avgRating ? (
              <span className="font-mono text-xs font-bold text-ink flex items-center gap-1">
                <span className="text-sm font-display text-forest font-bold">{avgRating}</span>
                <span className="text-ink-faint text-[0.68rem]">/ 5</span>
                {avgConfig && (
                  <span
                    style={{ backgroundColor: avgConfig.color }}
                    className={`ml-1 rounded px-1.5 py-0.2 font-mono text-[0.55rem] font-bold ${
                      avgConfig.textDark ? "text-ink" : "text-white"
                    }`}
                  >
                    {avgConfig.label}
                  </span>
                )}
              </span>
            ) : (
              <span className="font-mono text-[0.65rem] text-ink-faint italic">
                Not rated yet
              </span>
            )}
          </div>

          {/* Average Capsule Bar */}
          <div className="flex justify-center pt-1">
            <GlyphBar value={roundedAvg} max={5} size="md" />
          </div>
        </div>
      </div>

      {/* Interviewer Rating Action / Form */}
      {!isAdmin && (
        <div className="mt-3.5 border-b border-line/60 pb-3.5">
          {!showRateForm ? (
            <button
              type="button"
              onClick={() => setShowRateForm(true)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-left font-mono text-xs text-ink-soft hover:border-oxblood hover:text-oxblood transition-colors flex items-center justify-between group"
            >
              <span>{hasMyEvaluation ? "✎ Edit Your Assessment" : "+ Rate This Candidate"}</span>
              <span className="font-mono text-[0.65rem] text-brass uppercase font-bold">
                {hasMyEvaluation ? "Rated" : "Rate"}
              </span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-lg bg-paper/70 p-3 border border-line/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-soft">
                  Your Score:
                </span>
                <span className="font-mono text-xs font-bold text-ink">
                  {rating}/5
                </span>
              </div>

              {/* Interactive Capsule Bar */}
              <div className="py-0.5 flex justify-center">
                <GlyphBar
                  value={rating}
                  max={5}
                  interactive={true}
                  onChange={(val) => setRating(val)}
                  size="md"
                />
              </div>

              <div>
                <label className="block font-mono text-[0.58rem] uppercase tracking-wider text-ink-faint mb-1">
                  Feedback Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add evaluation notes..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full rounded border border-line bg-paper px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none leading-relaxed"
                />
              </div>

              {successMsg && (
                <p className="font-mono text-[0.62rem] text-forest font-medium">
                  ✓ {successMsg}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded bg-oxblood px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-paper-raised hover:bg-oxblood-deep disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save Rating"}
                </button>

                {hasMyEvaluation && (
                  <button
                    type="button"
                    onClick={handleDeleteRating}
                    disabled={submitting}
                    title="Delete your evaluation"
                    className="rounded border border-oxblood/40 bg-oxblood/10 px-2 py-1.5 font-mono text-[0.62rem] uppercase text-oxblood hover:bg-oxblood hover:text-white transition-colors"
                  >
                    Delete
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowRateForm(false)}
                  className="rounded border border-line px-2 py-1.5 font-mono text-[0.62rem] uppercase text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Admin Notice */}
      {isAdmin && (
        <div className="mt-2.5 mb-1 rounded bg-paper/50 px-2.5 py-1 border border-line/40 text-[0.62rem] font-mono text-ink-faint">
          Admin View · Panel evaluations
        </div>
      )}

      {/* List of Interviewers who evaluated */}
      <div className="mt-3.5 space-y-2">
        <p className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-faint">
          Panel Evaluations ({evaluations.length})
        </p>

        {loading ? (
          <p className="py-4 text-center font-mono text-xs text-ink-faint">
            Loading…
          </p>
        ) : evaluations.length === 0 ? (
          <div className="py-4 text-center text-xs text-ink-soft font-sans">
            No evaluations submitted yet.
          </div>
        ) : (
          evaluations.map((ev, idx) => {
            const isExpanded = expandedIds.has(ev.interviewerId || idx);
            const isYou = ev.interviewerId === currentInterviewerId;

            return (
              <div
                key={ev.interviewerId || idx}
                className="rounded-lg border border-line bg-paper overflow-hidden transition-all hover:border-line/90"
              >
                {/* Clickable Header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(ev.interviewerId || idx)}
                  className="w-full flex items-center justify-between p-2.5 text-left transition-colors hover:bg-paper-raised/60"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-xs font-semibold text-ink">
                        {ev.interviewerName}
                      </span>
                      {isYou && (
                        <span className="rounded bg-oxblood/10 px-1 py-0.2 font-mono text-[0.52rem] uppercase text-oxblood font-bold">
                          You
                        </span>
                      )}
                    </div>

                    {ev.comments && (
                      <p className="mt-0.5 font-mono text-[0.55rem] text-ink-faint">
                        {isExpanded ? "▲ Hide note" : "▼ Click for note"}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <GlyphBar value={Number(ev.rating) || 0} max={5} size="sm" />
                    <span className="font-mono text-xs font-bold text-ink">
                      {ev.rating}
                    </span>
                  </div>
                </button>

                {/* Expanded Feedback Note */}
                {isExpanded && ev.comments && (
                  <div className="border-t border-line/50 bg-paper-raised/80 p-2.5 text-xs">
                    <p className="italic text-ink/90 font-sans leading-relaxed text-[0.75rem]">
                      "{ev.comments}"
                    </p>
                    {ev.updatedAt && (
                      <p className="mt-1 text-right font-mono text-[0.52rem] text-ink-faint">
                        {new Date(ev.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
