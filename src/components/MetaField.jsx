export default function MetaField({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
