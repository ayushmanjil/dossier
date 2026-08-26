export const CAPSULE_PALETTE = [
  { color: "#DC264E", label: "POOR", subtext: "1 - Poor", textDark: false },
  { color: "#F36B47", label: "FAIR", subtext: "2 - Fair", textDark: false },
  { color: "#FAB800", label: "AVERAGE", subtext: "3 - Average", textDark: true },
  { color: "#159B79", label: "GOOD", subtext: "4 - Good", textDark: false },
  { color: "#27B55F", label: "EXCELLENT", subtext: "5 - Excellent", textDark: false },
];

export const GLYPH_LABELS = CAPSULE_PALETTE.map((p) => p.subtext);

export default function GlyphBar({
  value = 0,
  max = 5,
  interactive = false,
  onChange,
  size = "md", // "sm" | "md" | "lg"
  showTooltip = false,
}) {
  const currentConfig = CAPSULE_PALETTE[(value || 1) - 1] || CAPSULE_PALETTE[0];

  // Sizing
  const heightClass =
    size === "sm"
      ? "h-2.5"
      : size === "lg"
      ? "h-7"
      : "h-4.5";

  const barWidth = size === "sm" ? "w-28" : size === "lg" ? "w-full max-w-[340px]" : "w-44";

  return (
    <div className="flex flex-col items-center">
      {/* Optional Speech Bubble Score Tooltip (like image) */}
      {(interactive || showTooltip) && value > 0 && (
        <div className="relative mb-2 flex flex-col items-center animate-in fade-in zoom-in-90 duration-150">
          <div
            style={{ backgroundColor: currentConfig.color }}
            className={`rounded-lg px-2.5 py-1 text-center shadow-md ${
              currentConfig.textDark ? "text-ink" : "text-white"
            }`}
          >
            <p className="text-[0.52rem] font-mono font-semibold uppercase tracking-wider opacity-85 leading-tight">
              Score:
            </p>
            <p className="font-display text-[0.75rem] font-bold tracking-tight leading-none mt-0.5">
              {currentConfig.label} ({value}/5)
            </p>
          </div>
          {/* Arrow Pointer */}
          <div
            style={{ borderTopColor: currentConfig.color }}
            className="h-0 w-0 border-x-4 border-t-4 border-x-transparent"
          />
        </div>
      )}

      {/* Pill Capsule Bar */}
      <div
        className={`relative ${barWidth} ${heightClass} rounded-full border-2 border-line/80 bg-paper-deep/40 shadow-xs overflow-hidden flex items-stretch p-0`}
      >
        {CAPSULE_PALETTE.map((item, idx) => {
          const score = idx + 1;
          const isFilled = value >= score;

          if (interactive) {
            return (
              <button
                type="button"
                key={score}
                onClick={() => onChange && onChange(score)}
                title={item.subtext}
                style={{
                  backgroundColor: isFilled ? item.color : "transparent",
                }}
                className={`flex-1 transition-all duration-150 cursor-pointer ${
                  isFilled ? "opacity-100" : "bg-paper-raised/70 opacity-40 hover:opacity-75"
                } border-r border-black/10 last:border-r-0 hover:brightness-105 active:scale-95`}
              >
                <span className="sr-only">{item.subtext}</span>
              </button>
            );
          }

          return (
            <div
              key={score}
              style={{
                backgroundColor: isFilled ? item.color : "transparent",
              }}
              className={`flex-1 transition-all duration-200 ${
                isFilled ? "opacity-100" : "bg-paper-raised/60 opacity-30"
              } border-r border-black/10 last:border-r-0`}
              title={`Rating: ${value} / ${max} (${item.label})`}
            />
          );
        })}
      </div>
    </div>
  );
}
