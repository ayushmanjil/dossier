import LinkButton from "./LinkButton";

function ParagraphText({ text, className = "" }) {
  const paragraphs = text.split(/\n{2,}|\r\n\r\n/).filter(Boolean);
  const finalParas = paragraphs.length ? paragraphs : [text];
  return (
    <div className={`prose-manuscript text-ink/90 leading-relaxed text-[0.93rem] ${className}`}>
      {finalParas.map((p, i) => (
        <p key={i} className="mb-3.5 last:mb-0">
          {p.split(/\n/).map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export default function AnswerBlock({ question, index, totalQuestions }) {
  const { label, question: realQuestion, prompt, type, prose, links, rawAnswer } = question;
  const hasProse = Boolean(prose && prose.trim().length > 0);
  const hasLinks = Boolean(links && links.length > 0);
  const hasRaw = Boolean(rawAnswer && rawAnswer.trim().length > 0);

  const isFeature = type === "feature";
  const isResume = type === "resume";
  const isUrlOnly = type === "url" && !hasProse;

  // The actual question text asked to candidate
  const questionTitle = realQuestion || prompt || (hasRaw && label !== rawAnswer ? label : label);
  const fullText = prose || rawAnswer || "";
  const wordCount = countWords(fullText);

  return (
    <div
      id={`question-${index}`}
      className="snap-scroll-item rounded-xl border border-line/80 bg-paper-raised p-6 shadow-lifted transition-all hover:border-line"
    >
      {/* Category / Question Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/50 pb-3.5">
        <div className="flex items-center gap-2.5">
          {index != null && (
            <span className="flex h-5 items-center justify-center rounded bg-brass/15 px-1.5 font-mono text-[0.62rem] font-semibold text-brass">
              Q{index + 1}
            </span>
          )}
          <span className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-faint">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isFeature && (
            <span className="rounded-full bg-brass-soft/30 px-2.5 py-0.5 font-mono text-[0.62rem] font-medium uppercase tracking-wider text-brass">
              Featured Essay
            </span>
          )}
          {wordCount > 30 && (
            <span className="font-mono text-[0.62rem] text-ink-faint">
              {wordCount} words
            </span>
          )}
        </div>
      </div>

      {/* Real Full Question Prompt */}
      <div className="mt-3.5 mb-4">
        <h3 className="font-display text-[1.05rem] font-semibold tracking-tight text-ink sm:text-[1.12rem] leading-snug">
          {questionTitle}
        </h3>
      </div>

      {/* Answer Content */}
      <div className="mt-2 rounded-lg bg-paper/60 p-4 border border-line/40">
        {isResume ? (
          <div className="flex flex-wrap gap-2 py-1">
            {hasLinks ? (
              links.map((l, i) => (
                <LinkButton key={i} label="Open Submitted Résumé" url={l.url} tone="forest" />
              ))
            ) : hasRaw ? (
              <p className="text-sm text-ink leading-relaxed font-sans">{rawAnswer}</p>
            ) : (
              <span className="text-sm italic text-ink-faint">No résumé link submitted.</span>
            )}
          </div>
        ) : isUrlOnly ? (
          <div className="flex flex-wrap gap-2.5 py-1">
            {hasLinks ? (
              links.map((l, i) => (
                <LinkButton key={i} label={l.label || "Open Link"} url={l.url} tone="oxblood" />
              ))
            ) : hasRaw ? (
              <p className="text-sm text-ink leading-relaxed font-sans">{rawAnswer}</p>
            ) : (
              <span className="text-sm italic text-ink-faint">No link provided.</span>
            )}
          </div>
        ) : (
          <>
            {hasProse && (
              <ParagraphText
                text={prose}
                className={isFeature ? "border-l-2 border-brass-soft pl-4 italic text-ink" : ""}
              />
            )}

            {hasLinks && (
              <div className={`flex flex-wrap gap-2.5 ${hasProse ? "mt-4 pt-3 border-t border-line/50" : ""}`}>
                {links.map((l, i) => (
                  <LinkButton key={i} label={l.label} url={l.url} />
                ))}
              </div>
            )}

            {!hasProse && !hasLinks && (
              rawAnswer ? (
                <p className="text-sm text-ink leading-relaxed font-sans">{rawAnswer}</p>
              ) : (
                <span className="text-sm italic text-ink-faint">No response provided.</span>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
