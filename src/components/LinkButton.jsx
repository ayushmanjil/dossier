export default function LinkButton({ label, url, tone = "oxblood" }) {
  const toneClasses =
    tone === "forest"
      ? "border-forest/40 text-forest hover:bg-forest hover:text-paper-raised"
      : "border-oxblood/40 text-oxblood hover:bg-oxblood hover:text-paper-raised";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-200 ${toneClasses}`}
    >
      {label}
      <span className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
        ↗
      </span>
    </a>
  );
}
