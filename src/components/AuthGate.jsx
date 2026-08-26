import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isFirebaseConfigured } from "../lib/firebase";
import DossierLogo from "./DossierLogo";

export default function AuthGate({ children }) {
  const { currentUser, loading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
        Opening archive…
      </div>
    );
  }

  if (currentUser) {
    return children;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-paper px-6 py-12 text-ink">
      <div className="mx-auto w-full max-w-sm">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <DossierLogo size={56} className="shadow-subtle rounded-md" />
          </div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-brass">
            Sahityika Literary Society
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            Recruitment Dossier
          </h1>
          <p className="mt-2 text-xs text-ink-soft">
            Please sign in with your society credentials to access applicant dossiers.
          </p>
        </div>

        {/* Demo Mode Notice */}
        {!isFirebaseConfigured && (
          <div className="mt-6 rounded-md border border-brass/40 bg-brass-soft/20 px-3.5 py-2.5 text-center text-xs text-ink-soft space-y-1">
            <p>
              <span className="font-semibold text-ink">Admin:</span>{" "}
              <code className="font-mono font-semibold text-oxblood">sahityika2021</code> /{" "}
              <code className="font-mono font-semibold text-oxblood">qwerty/sahityika</code>
            </p>
            <p>
              <span className="font-semibold text-ink">Interviewer:</span>{" "}
              <code className="font-mono font-semibold text-forest">interviewer</code> /{" "}
              <code className="font-mono font-semibold text-forest">interviewer123</code>
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-lg border border-line bg-paper-raised p-6 shadow-lifted">
          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft">
              Username
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or ayushmanjil"
              className="mt-1.5 w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none"
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
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none pr-10"
              />
            </div>
          </div>

          {error && (
            <div className="rounded border border-oxblood/30 bg-oxblood-soft/20 px-3 py-2 text-xs text-oxblood">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-oxblood px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-paper-raised transition-colors hover:bg-oxblood-deep disabled:opacity-50"
          >
            {submitting ? "Signing In…" : "Sign In to Archive"}
          </button>
        </form>
      </div>
    </div>
  );
}
