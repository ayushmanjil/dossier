import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function formatDate(val) {
  if (!val) return null;
  try {
    const d = typeof val?.toDate === "function"
      ? val.toDate()
      : val?.seconds != null
      ? new Date(val.seconds * 1000)
      : new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString();
  } catch {
    return null;
  }
}

export default function ManageInterviewers() {
  const { createInterviewer, getInterviewers, deleteInterviewer, updateInterviewerPassword } = useAuth();
  const [interviewers, setInterviewers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingPasswordId, setEditingPasswordId] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");

  useEffect(() => {
    loadList();
  }, []);

  async function loadList() {
    setLoadingList(true);
    try {
      const list = await getInterviewers();
      setInterviewers(list || []);
    } catch (err) {
      console.error("Failed to load interviewers:", err);
    } finally {
      setLoadingList(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await createInterviewer({ name, username, password });
      setSuccess(`Interviewer "${name}" (@${username.replace(/^@/, '')}) created successfully.`);
      setName("");
      setUsername("");
      setPassword("");
      await loadList();
    } catch (err) {
      setError(err.message || "Failed to create interviewer.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, uName) {
    if (!window.confirm(`Are you sure you want to remove interviewer account "${uName}"?`)) {
      return;
    }
    try {
      await deleteInterviewer(id);
      await loadList();
    } catch (err) {
      alert("Failed to delete interviewer: " + err.message);
    }
  }

  async function handleResetPassword(id) {
    if (!newPasswordVal.trim()) return;
    try {
      await updateInterviewerPassword(id, newPasswordVal);
      alert("Password updated successfully.");
      setEditingPasswordId(null);
      setNewPasswordVal("");
    } catch (err) {
      alert("Failed to update password: " + err.message);
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Back Link */}
      <Link
        to="/"
        className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-oxblood"
      >
        ← Candidate Archive
      </Link>

      {/* Header */}
      <div className="mt-4 mb-10">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-brass">
          Admin Console
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Manage Interviewers
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Create interviewer accounts with their name, username, and password. Interviewers can log in to view candidate dossiers across all departments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Create Form */}
        <div className="lg:col-span-5">
          <div className="rounded-lg border border-line bg-paper-raised p-6 shadow-lifted">
            <h2 className="font-display text-lg font-semibold text-ink">
              Add Interviewer
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              Enter details for the new panel member.
            </p>

            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div>
                <label className="block font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint hover:text-oxblood"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded border border-oxblood/30 bg-oxblood-soft/20 px-3 py-2 text-xs text-oxblood">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded border border-forest/30 bg-forest-soft/20 px-3 py-2 text-xs text-forest">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-oxblood px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-paper-raised transition-colors hover:bg-oxblood-deep disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create Interviewer"}
              </button>
            </form>
          </div>
        </div>

        {/* Existing List */}
        <div className="lg:col-span-7">
          <div className="rounded-lg border border-line bg-paper-raised shadow-lifted overflow-hidden">
            <div className="border-b border-line px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Active Interviewers
                </h2>
                <p className="text-xs text-ink-soft">
                  {interviewers.length} {interviewers.length === 1 ? "account" : "accounts"} registered
                </p>
              </div>
            </div>

            {loadingList ? (
              <div className="py-12 text-center font-mono text-xs uppercase tracking-widest text-ink-faint">
                Loading accounts…
              </div>
            ) : interviewers.length === 0 ? (
              <div className="py-12 px-6 text-center text-sm text-ink-soft">
                No interviewers added yet. Use the form to create interviewer credentials.
              </div>
            ) : (
              <div className="divide-y divide-line">
                {interviewers.map((u) => (
                  <div key={u.id} className="p-6 hover:bg-paper/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-medium text-ink">
                            {u.name}
                          </span>
                          <span className="rounded bg-forest/10 px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-forest font-semibold">
                            Interviewer
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 font-mono text-xs text-ink-soft">
                          <span>Username: <strong className="text-ink font-semibold">{u.username}</strong></span>
                          {formatDate(u.createdAt) && (
                            <span className="text-ink-faint">
                              · Added {formatDate(u.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingPasswordId(editingPasswordId === u.id ? null : u.id);
                            setNewPasswordVal("");
                          }}
                          className="font-mono text-xs text-ink-soft hover:text-oxblood underline"
                        >
                          {editingPasswordId === u.id ? "Cancel" : "Set Password"}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="font-mono text-xs text-oxblood hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Reset Password Form Inline */}
                    {editingPasswordId === u.id && (
                      <div className="mt-4 flex items-center gap-2 rounded-md border border-line bg-paper p-3">
                        <input
                          type="text"
                          placeholder="Enter new password"
                          value={newPasswordVal}
                          onChange={(e) => setNewPasswordVal(e.target.value)}
                          className="flex-1 rounded border border-line bg-paper-raised px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-oxblood font-mono"
                        />
                        <button
                          onClick={() => handleResetPassword(u.id)}
                          className="rounded bg-oxblood px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-paper-raised hover:bg-oxblood-deep"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
