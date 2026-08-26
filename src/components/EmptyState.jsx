import { Link } from "react-router-dom";

export default function EmptyState() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-28 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-paper-raised font-display text-2xl text-ink-faint">
        ⌘
      </div>
      <h2 className="font-display text-2xl font-semibold text-ink">No applications on file yet</h2>
      <p className="mt-3 text-ink-soft">
        This archive fills itself in the moment a cleaned application CSV is uploaded. Export
        your Google Sheet, then bring it in.
      </p>
      <Link
        to="/admin/upload"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-oxblood px-6 py-3 font-mono text-xs uppercase tracking-[0.14em] text-paper-raised transition-colors hover:bg-oxblood-deep"
      >
        Import CSV ↗
      </Link>
    </div>
  );
}
