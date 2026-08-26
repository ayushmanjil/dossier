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
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <DossierLogo size={48} />
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-faint">
            Opening Archive…
          </p>
        </div>
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
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-paper px-4 py-12 text-ink overflow-hidden selection:bg-brass-soft selection:text-ink">
      {/* Subtle Archival Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brass-soft/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-oxblood/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="relative rounded-2xl border border-line/80 bg-paper-raised/95 p-8 sm:p-10 shadow-lifted backdrop-blur-sm">
          
          {/* Header Brand Lockup */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-line/60 bg-paper p-2.5 shadow-sm">
              <DossierLogo size={48} />
            </div>
            
            <span className="inline-block rounded-full border border-brass/30 bg-brass/10 px-3 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-brass">
              Confidential Archive
            </span>

            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Dossier
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">
              Sign in with your authorized credentials to access candidate dossiers & evaluations.
            </p>
          </div>

          <div className="my-6 stitch-divider" />

          {/* Demo Mode Notice (Only shown when Firebase credentials are not yet set) */}
          {!isFirebaseConfigured && (
            <div className="mb-6 rounded-lg border border-brass/40 bg-brass-soft/20 p-3.5 text-center text-xs text-ink-soft space-y-1.5">
              <div className="font-mono text-[0.62rem] uppercase tracking-wider text-brass font-bold">
                Local Demo Mode
              </div>
              <p>
                <span className="font-semibold text-ink">Admin:</span>{" "}
                <code className="font-mono font-semibold text-oxblood">
                  {import.meta.env.VITE_ADMIN_USERNAME || "sahityika2021"}
                </code>{" "}
                /{" "}
                <code className="font-mono font-semibold text-oxblood">
                  {import.meta.env.VITE_ADMIN_PASSWORD || "qwerty/sahityika"}
                </code>
              </p>
              <p>
                <span className="font-semibold text-ink">Interviewer:</span>{" "}
                <code className="font-mono font-semibold text-forest">interviewer</code> /{" "}
                <code className="font-mono font-semibold text-forest">interviewer123</code>
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-ink-soft">
                Username or Email
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:ring-1 focus:ring-oxblood focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-ink-soft">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint hover:text-oxblood transition-colors cursor-pointer"
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
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:ring-1 focus:ring-oxblood focus:outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-oxblood/30 bg-oxblood/10 px-3.5 py-2.5 text-xs text-oxblood font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-oxblood py-3 font-mono text-xs uppercase tracking-[0.16em] text-paper-raised hover:bg-oxblood-deep active:scale-[0.99] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>Authenticating…</span>
              ) : (
                <>
                  <span>Sign In to Archive</span>
                  <span className="text-sm">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="mt-8 text-center">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-faint">
              Restricted Access · Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
