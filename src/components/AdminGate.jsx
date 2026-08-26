import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminGate({ children }) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs uppercase tracking-widest text-ink-faint">
        Checking admin permissions…
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="font-display text-2xl text-ink">Sign-in Required</p>
        <p className="mt-2 text-sm text-ink-soft">
          You must be signed in as an administrator to access this area.
        </p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-oxblood px-4 py-2 font-mono text-xs uppercase text-paper-raised">
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="inline-block rounded-full bg-oxblood/10 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-oxblood">
          Access Restricted
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
          Administrator Privilege Required
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your account ({currentUser.name}) has Interviewer access, which allows viewing candidate dossiers. Uploading data and managing accounts is reserved for Society Admins.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block font-mono text-xs uppercase tracking-wider text-oxblood hover:underline"
        >
          ← Return to Candidate Archive
        </Link>
      </div>
    );
  }

  return children;
}
