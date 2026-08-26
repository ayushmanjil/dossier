import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-28 text-center">
      <p className="font-display text-6xl font-semibold text-ink-faint">404</p>
      <p className="mt-4 text-ink-soft">This page isn't in the archive.</p>
      <Link to="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-wide text-oxblood">
        ← Back to dashboard
      </Link>
    </div>
  );
}
