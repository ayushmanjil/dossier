import { useCallback, useRef, useState } from "react";

export default function UploadDropzone({ onFile, disabled }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
        onFile(null, "That doesn't look like a .csv file. Export your sheet as CSV and try again.");
        return;
      }
      onFile(file, null);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-8 py-16 text-center transition-colors duration-200 ${
        dragging ? "border-oxblood bg-oxblood/5" : "border-line bg-paper-raised hover:border-brass"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-paper font-display text-2xl text-ink-faint">
        ↑
      </div>
      <p className="font-display text-lg font-semibold text-ink">
        Drop the cleaned application CSV here
      </p>
      <p className="mt-2 text-sm text-ink-soft">or click to browse — .csv exported from Google Sheets</p>
    </div>
  );
}
