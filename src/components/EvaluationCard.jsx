import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { saveEvaluation, getEvaluationsForApplicant } from "../lib/store";

export default function EvaluationCard({ applicantId }) {
  const { currentUser } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const currentInterviewerId = currentUser?.id || currentUser?.username || "admin";
  const currentInterviewerName = currentUser?.name || currentUser?.username || "Interviewer";

  useEffect(() => {
    loadEvaluations();
  }, [applicantId]);

  async function loadEvaluations() {
    setLoading(true);
    try {
      const data = await getEvaluationsForApplicant(applicantId);
      setEvaluations(data || []);

      // Prepopulate current user's existing rating if any
      const myEval = (data || []).find((e) => e.interviewerId === currentInterviewerId);
      if (myEval) {
        setRating(myEval.rating || 5);
        setComments(myEval.comments || "");
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
      setSuccessMsg("Assessment saved successfully.");
      await loadEvaluations();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert("Failed to save evaluation: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const count = evaluations.length;
  const avgRating = count > 0 ? (evaluations.reduce((acc, e) => acc + (Number(e.rating) || 0), 0) / count).toFixed(1) : null;

  return (
    <div className="rounded-xl border border-line bg-paper-raised p-6 shadow-lifted">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">
            Interview Panel Assessment
          </p>
          <h3 className="font-display text-xl font-bold text-ink mt-0.5">
            Interviewer Ratings & Notes
          </h3>
        </div>

        {avgRating ? (
          <div className="flex items-center gap-2 rounded-full bg-brass/10 px-3 py-1 font-mono text-xs text-brass border border-brass/20">
            <span className="text-sm">★</span>
            <span className="font-bold">{avgRating} / 5.0</span>
            <span className="text-ink-faint text-[0.65rem]">({count} {count === 1 ? "review" : "reviews"})</span>
          </div>
        ) : (
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-faint">
            Not yet rated
          </span>
        )}
      </div>

      {/* Grid: Rating Form (Left) & All Reviews (Right) */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Rating Submission Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 rounded-lg bg-paper/60 p-4 border border-line/50 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft">
                Your Rating ({currentInterviewerName})
              </label>
              <span className="font-mono text-xs font-bold text-brass">
                {rating} / 5
              </span>
            </div>

            {/* Star Selector Buttons */}
            <div className="mt-2 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`h-9 flex-1 rounded border text-sm font-semibold transition-all ${
                    rating >= star
                      ? "border-brass bg-brass text-paper-raised shadow-xs"
                      : "border-line bg-paper text-ink-soft hover:border-brass/50"
                  }`}
                >
                  ★ {star}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft mb-1.5">
              Interviewer Feedback / Evaluation Note
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Strong responses, good domain grasp, articulate communication…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none leading-relaxed"
            />
          </div>

          {successMsg && (
            <p className="font-mono text-[0.65rem] text-forest font-medium">
              ✓ {successMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-oxblood px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper-raised hover:bg-oxblood-deep transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Submit Assessment"}
          </button>
        </form>

        {/* List of Panel Assessments */}
        <div className="lg:col-span-7 space-y-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-faint mb-2">
            Panel Reviews ({evaluations.length})
          </p>

          {loading ? (
            <div className="py-8 text-center font-mono text-xs text-ink-faint">
              Loading assessments…
            </div>
          ) : evaluations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line p-6 text-center text-xs text-ink-soft">
              No interviewers have rated this candidate yet. Use the form on the left to submit your rating.
            </div>
          ) : (
            <div className="space-y-3">
              {evaluations.map((ev, idx) => (
                <div key={idx} className="rounded-lg border border-line bg-paper p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-semibold text-ink">
                        {ev.interviewerName}
                      </span>
                      {ev.interviewerId === currentInterviewerId && (
                        <span className="rounded bg-oxblood/10 px-1.5 py-0.2 font-mono text-[0.58rem] uppercase text-oxblood font-bold">
                          You
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-brass">
                      <span>{"★".repeat(Number(ev.rating) || 0)}</span>
                      <span>{"☆".repeat(5 - (Number(ev.rating) || 0))}</span>
                      <span className="ml-1 text-ink-soft text-[0.7rem]">({ev.rating}/5)</span>
                    </div>
                  </div>

                  {ev.comments && (
                    <p className="mt-2 text-xs text-ink/80 leading-relaxed font-sans bg-paper-raised p-2.5 rounded border border-line/40 italic">
                      "{ev.comments}"
                    </p>
                  )}

                  {ev.updatedAt && (
                    <p className="mt-2 text-right font-mono text-[0.58rem] text-ink-faint">
                      {new Date(ev.updatedAt).toLocaleDateString()} at {new Date(ev.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
