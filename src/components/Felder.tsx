"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { formatDatum, parseDatum } from "@/lib/format";

/** Text input with a unit shown inside the field (m, m³, CHF …). */
export function EinheitEingabe({
  einheit,
  vorne = false,
  ...props
}: { einheit?: string; vorne?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  if (!einheit) return <input type="text" inputMode="decimal" {...props} />;
  return (
    <span className={`mit-einheit${vorne ? " vorne" : ""}`}>
      <input type="text" inputMode="decimal" {...props} />
      <span className="einheit">{einheit}</span>
    </span>
  );
}

function KalenderSymbol() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
    </svg>
  );
}

/**
 * Date input that always shows DD.MM.YYYY regardless of browser language.
 * Value is an ISO date (YYYY-MM-DD) or null. A native picker opens via the calendar button.
 */
export function DatumFeld({
  wert,
  onChange,
  id,
  label,
}: {
  wert: string | null;
  onChange: (iso: string | null) => void;
  id?: string;
  label?: string;
}) {
  const [text, setText] = useState(formatDatum(wert));
  const [ungueltig, setUngueltig] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(formatDatum(wert));
    setUngueltig(false);
  }, [wert]);

  function uebernehmen() {
    const iso = parseDatum(text);
    if (iso === undefined) {
      setUngueltig(true);
      return;
    }
    setUngueltig(false);
    if (iso !== (wert ?? null)) onChange(iso);
    else setText(formatDatum(iso));
  }

  function kalenderOeffnen() {
    try {
      picker.current?.showPicker();
    } catch {
      picker.current?.focus();
    }
  }

  return (
    <span>
      <span className="datum-feld">
        <input
          type="text"
          id={id}
          aria-label={label}
          placeholder="TT.MM.JJJJ"
          value={text}
          aria-invalid={ungueltig || undefined}
          onChange={(e) => setText(e.target.value)}
          onBlur={uebernehmen}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              uebernehmen();
            }
          }}
        />
        <button type="button" className="btn datum-knopf" onClick={kalenderOeffnen} title="Kalender öffnen" aria-label="Kalender öffnen">
          <KalenderSymbol />
        </button>
        <input
          ref={picker}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={wert ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      </span>
      {ungueltig && <span className="feld-fehler" style={{ display: "block" }}>Ungültiges Datum (TT.MM.JJJJ).</span>}
    </span>
  );
}

/** ja / nein toggle; clicking the active option again clears it. */
export function JaNeinAuswahl({
  wert,
  onChange,
  label,
}: {
  wert: boolean | null;
  onChange: (w: boolean | null) => void;
  label?: string;
}) {
  return (
    <span className="seg" role="group" aria-label={label}>
      <button type="button" aria-pressed={wert === true} onClick={() => onChange(wert === true ? null : true)}>
        ja
      </button>
      <button type="button" aria-pressed={wert === false} onClick={() => onChange(wert === false ? null : false)}>
        nein
      </button>
    </span>
  );
}
