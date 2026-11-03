// Form data shape and validation for creating / editing a project (German messages).

import { istIsoDatum, parseZahl } from "./format";
import {
  OBJEKTARTEN,
  alleKnoten,
  type Abschnitt,
  type Datumsbereich,
  type Fachplaner,
  type ItemTyp,
} from "./struktur";

export type FormWert = string | boolean | Datumsbereich | Fachplaner | null;

export interface RaumEingabe {
  bezeichnung: string;
  flaeche: string;
}

export interface ProjektFormDaten {
  projektnummer: string;
  projektname: string;
  bhName: string;
  bhVorname: string;
  bhAdresse: string;
  bhTelefon: string;
  bhMail: string;
  parzellenNr: string;
  objektadresse: string;
  objektart: string;
  raeume: RaumEingabe[];
  /** Values of the non-phase sections (Eckdaten Baureglement), keyed by item key. */
  eckdaten: Record<string, FormWert>;
}

export type Fehler = Record<string, string>;

export interface GeprueftesProjekt {
  projekt: Omit<ProjektFormDaten, "raeume" | "eckdaten">;
  raeume: { bezeichnung: string; flaecheM2: number | null; sortierung: number }[];
  eckdaten: { key: string; wert: unknown }[];
}

const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function eckdatenKnoten(struktur: Abschnitt[]) {
  return struktur.filter((a) => !a.phase).flatMap((a) => alleKnoten(a.knoten));
}

/** Converts a form value to the stored value for the given item type. */
export function wertFuerTyp(typ: ItemTyp, roh: FormWert): { wert: unknown } | { fehler: string } {
  switch (typ) {
    case "text": {
      const s = typeof roh === "string" ? roh.trim() : "";
      return { wert: s || null };
    }
    case "zahl":
    case "m":
    case "m3":
    case "chf": {
      const n = parseZahl(typeof roh === "string" ? roh : "");
      if (n === undefined) return { fehler: "Bitte eine gültige Zahl eingeben." };
      if (n !== null && n < 0) return { fehler: "Bitte keinen negativen Wert eingeben." };
      return { wert: n };
    }
    case "datum": {
      if (!roh) return { wert: null };
      if (typeof roh !== "string" || !istIsoDatum(roh)) return { fehler: "Bitte ein gültiges Datum eingeben (TT.MM.JJJJ)." };
      return { wert: roh };
    }
    case "datumsbereich": {
      const b = (roh ?? {}) as Partial<Datumsbereich>;
      const von = b.von || null;
      const bis = b.bis || null;
      if ((von && !istIsoDatum(von)) || (bis && !istIsoDatum(bis))) {
        return { fehler: "Bitte ein gültiges Datum eingeben (TT.MM.JJJJ)." };
      }
      if (von && bis && bis < von) return { fehler: "Das Enddatum liegt vor dem Startdatum." };
      return { wert: von || bis ? { von, bis } : null };
    }
    case "fachplaner": {
      const f = (roh ?? {}) as Partial<Fachplaner>;
      const firma = (f.firma ?? "").trim();
      const kontakt = (f.kontakt ?? "").trim();
      return { wert: firma || kontakt ? { firma, kontakt } : null };
    }
    case "janein":
      return { wert: typeof roh === "boolean" ? roh : null };
    default:
      return { wert: null };
  }
}

export function pruefeProjekt(
  daten: ProjektFormDaten,
  struktur: Abschnitt[],
): { ok: true; werte: GeprueftesProjekt } | { ok: false; fehler: Fehler } {
  const fehler: Fehler = {};
  const t = (s: unknown) => (typeof s === "string" ? s.trim() : "");

  const projekt = {
    projektnummer: t(daten.projektnummer),
    projektname: t(daten.projektname),
    bhName: t(daten.bhName),
    bhVorname: t(daten.bhVorname),
    bhAdresse: t(daten.bhAdresse),
    bhTelefon: t(daten.bhTelefon),
    bhMail: t(daten.bhMail),
    parzellenNr: t(daten.parzellenNr),
    objektadresse: t(daten.objektadresse),
    objektart: t(daten.objektart),
  };

  if (!projekt.projektnummer) fehler.projektnummer = "Bitte eine Projektnummer eingeben.";
  else if (projekt.projektnummer.length > 40) fehler.projektnummer = "Die Projektnummer ist zu lang (max. 40 Zeichen).";
  if (projekt.bhMail && !MAIL.test(projekt.bhMail)) fehler.bhMail = "Bitte eine gültige E-Mail-Adresse eingeben.";
  if (projekt.objektart && !(OBJEKTARTEN as readonly string[]).includes(projekt.objektart)) {
    fehler.objektart = "Bitte eine gültige Objektart wählen.";
  }

  const raeume: GeprueftesProjekt["raeume"] = [];
  (daten.raeume ?? []).forEach((r, i) => {
    const bezeichnung = t(r.bezeichnung);
    const flaecheText = t(r.flaeche);
    if (!bezeichnung && !flaecheText) return;
    if (!bezeichnung) fehler[`raeume.${i}.bezeichnung`] = "Bitte eine Bezeichnung eingeben.";
    const flaeche = parseZahl(flaecheText);
    if (flaeche === undefined || (flaeche !== null && flaeche < 0)) {
      fehler[`raeume.${i}.flaeche`] = "Bitte eine gültige Fläche eingeben.";
    }
    raeume.push({ bezeichnung, flaecheM2: flaeche ?? null, sortierung: raeume.length });
  });

  const eckdaten: GeprueftesProjekt["eckdaten"] = [];
  for (const k of eckdatenKnoten(struktur)) {
    const r = wertFuerTyp(k.typ, daten.eckdaten?.[k.key] ?? null);
    if ("fehler" in r) fehler[`eckdaten.${k.key}`] = r.fehler;
    else eckdaten.push({ key: k.key, wert: r.wert });
  }

  if (Object.keys(fehler).length > 0) return { ok: false, fehler };
  return { ok: true, werte: { projekt, raeume, eckdaten } };
}
