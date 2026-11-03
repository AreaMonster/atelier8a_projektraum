// Swiss formatting and parsing helpers (de-CH): 1'250'000.50, DD.MM.YYYY.

import type { Datumsbereich, Fachplaner, ItemTyp } from "./struktur";

function gruppiere(ganzzahl: string): string {
  const negativ = ganzzahl.startsWith("-");
  const ziffern = negativ ? ganzzahl.slice(1) : ganzzahl;
  const gruppiert = ziffern.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return negativ ? `-${gruppiert}` : gruppiert;
}

/** Formats with min..max decimals and apostrophe thousands separator. */
export function formatZahl(n: number, minDez = 0, maxDez = 2): string {
  let s = n.toFixed(maxDez);
  if (maxDez > minDez) {
    const [, dez = ""] = s.split(".");
    let gekuerzt = dez;
    while (gekuerzt.length > minDez && gekuerzt.endsWith("0")) gekuerzt = gekuerzt.slice(0, -1);
    s = s.split(".")[0] + (gekuerzt ? `.${gekuerzt}` : "");
  }
  const [ganz, dez] = s.split(".");
  return gruppiere(ganz) + (dez ? `.${dez}` : "");
}

/** CHF 1'250'000.– or CHF 1'250'000.50 */
export function formatCHF(n: number): string {
  const gerundet = Math.round(n * 100) / 100;
  if (Number.isInteger(gerundet)) return `CHF ${gruppiere(String(gerundet))}.–`;
  return `CHF ${formatZahl(gerundet, 2, 2)}`;
}

export const EINHEIT: Partial<Record<ItemTyp, string>> = { m: "m", m3: "m³", chf: "CHF" };

export function formatMitEinheit(typ: ItemTyp, n: number): string {
  switch (typ) {
    case "chf":
      return formatCHF(n);
    case "m":
      return `${formatZahl(n, 2, 2)} m`;
    case "m3":
      return `${formatZahl(n, 0, 2)} m³`;
    default:
      return formatZahl(n, 0, 2);
  }
}

export function formatFlaeche(n: number): string {
  return `${formatZahl(n, 0, 2)} m²`;
}

/** Number as shown in an input field (keeps precision, adds apostrophes). */
export function zahlFuerEingabe(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "";
  const [ganz, dez] = String(n).split(".");
  return gruppiere(ganz) + (dez ? `.${dez}` : "");
}

/** Parses "1'250'000", "12,5", "12.50 m". Returns null for empty, undefined for invalid. */
export function parseZahl(eingabe: string): number | null | undefined {
  const s = eingabe
    .replace(/['’\s]/g, "")
    .replace(/^CHF/i, "")
    .replace(/(m³|m²|m|\.–)$/i, "")
    .replace(",", ".");
  if (s === "") return null;
  if (!/^-?\d+(\.\d+)?$/.test(s)) return undefined;
  return Number(s);
}

// ---------------------------------------------------------------------------
// Dates: stored as ISO "YYYY-MM-DD", shown as "DD.MM.YYYY".

export function formatDatum(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

export function formatDatumZeit(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function istIsoDatum(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Parses "3.11.2026", "03.11.26". Returns null for empty, undefined for invalid. */
export function parseDatum(eingabe: string): string | null | undefined {
  const s = eingabe.trim();
  if (s === "") return null;
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(s);
  if (!m) return undefined;
  const jahr = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const iso = `${jahr}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return istIsoDatum(iso) ? iso : undefined;
}

export function formatDatumsbereich(von: string | null, bis: string | null): string {
  if (von && bis) return `${formatDatum(von)} – ${formatDatum(bis)}`;
  if (von) return `ab ${formatDatum(von)}`;
  if (bis) return `bis ${formatDatum(bis)}`;
  return "";
}

/** Human-readable text of a stored item value. */
export function wertAlsText(typ: ItemTyp, wert: unknown): string {
  if (wert === null || wert === undefined || wert === "") return "";
  switch (typ) {
    case "janein":
      return wert === true ? "ja" : wert === false ? "nein" : "";
    case "zahl":
    case "m":
    case "m3":
    case "chf":
      return typeof wert === "number" ? formatMitEinheit(typ, wert) : "";
    case "datum":
      return typeof wert === "string" ? formatDatum(wert) : "";
    case "datumsbereich": {
      const b = wert as Datumsbereich;
      return formatDatumsbereich(b.von, b.bis);
    }
    case "fachplaner": {
      const f = wert as Fachplaner;
      return [f.firma, f.kontakt].filter(Boolean).join(" · ");
    }
    default:
      return typeof wert === "string" ? wert : "";
  }
}
