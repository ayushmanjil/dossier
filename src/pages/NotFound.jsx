import { Link } from "react-router-dom";
import DossierLogo from "../components/DossierLogo";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-28 text-center">
      <div className="mb-6 flex justify-center">
        <DossierLogo size={52} className="opacity-60" />
      </div>
      <p className="font-display text-6xl font-semibold text-ink-faint">404</p>
      <p className="mt-4 text-ink-soft">This page isn't in the archive.</p>
      <Link to="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-wide text-oxblood hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}
