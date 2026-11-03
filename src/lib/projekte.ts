import "server-only";
import type { Eintrag, Projekt, Raum } from "@prisma/client";
import { prisma } from "./db";
import { zahlFuerEingabe } from "./format";
import {
  aktuellePhase,
  gesamtFortschritt,
  type Abschnitt,
  type Eintraege,
  type Status,
} from "./struktur";
import { eckdatenKnoten, type FormWert, type ProjektFormDaten } from "./validierung";

export type ProjektMitDaten = Projekt & { raeume: Raum[]; eintraege: Eintrag[] };

function parseWert(json: string | null): unknown {
  if (json === null) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function eintraegeAus(rows: Eintrag[]): Eintraege {
  const e: Eintraege = {};
  for (const r of rows) {
    e[r.itemKey] = {
      status: r.status as Status,
      datum: r.datum,
      notiz: r.notiz,
      wert: parseWert(r.wert),
    };
  }
  return e;
}

export async function ladeProjekt(id: string): Promise<ProjektMitDaten | null> {
  return prisma.projekt.findUnique({
    where: { id },
    include: { raeume: { orderBy: { sortierung: "asc" } }, eintraege: true },
  });
}

export interface ProjektZeile {
  id: string;
  projektnummer: string;
  projektname: string;
  bauherrschaft: string;
  objektadresse: string;
  objektart: string;
  phase: string;
  fortschritt: number;
  archiviert: boolean;
}

export function bauherrschaftName(p: Pick<Projekt, "bhName" | "bhVorname">): string {
  return [p.bhName, p.bhVorname].filter(Boolean).join(" ");
}

export async function ladeProjektListe(struktur: Abschnitt[]): Promise<ProjektZeile[]> {
  const projekte = await prisma.projekt.findMany({
    include: { eintraege: true },
    orderBy: { projektnummer: "asc" },
  });
  return projekte.map((p) => {
    const e = eintraegeAus(p.eintraege);
    return {
      id: p.id,
      projektnummer: p.projektnummer,
      projektname: p.projektname,
      bauherrschaft: bauherrschaftName(p),
      objektadresse: p.objektadresse,
      objektart: p.objektart,
      phase: aktuellePhase(struktur, e),
      fortschritt: gesamtFortschritt(struktur, e).prozent,
      archiviert: p.archiviert,
    };
  });
}

function formWertAus(wert: unknown): FormWert {
  if (wert === null || wert === undefined) return null;
  if (typeof wert === "number") return zahlFuerEingabe(wert);
  if (typeof wert === "string" || typeof wert === "boolean") return wert;
  if (typeof wert === "object") return wert as FormWert;
  return null;
}

export function leereFormDaten(): ProjektFormDaten {
  return {
    projektnummer: "",
    projektname: "",
    bhName: "",
    bhVorname: "",
    bhAdresse: "",
    bhTelefon: "",
    bhMail: "",
    parzellenNr: "",
    objektadresse: "",
    objektart: "",
    raeume: [],
    eckdaten: {},
  };
}

export function formDatenAus(p: ProjektMitDaten, struktur: Abschnitt[]): ProjektFormDaten {
  const e = eintraegeAus(p.eintraege);
  const eckdaten: Record<string, FormWert> = {};
  for (const k of eckdatenKnoten(struktur)) eckdaten[k.key] = formWertAus(e[k.key]?.wert);
  return {
    projektnummer: p.projektnummer,
    projektname: p.projektname,
    bhName: p.bhName,
    bhVorname: p.bhVorname,
    bhAdresse: p.bhAdresse,
    bhTelefon: p.bhTelefon,
    bhMail: p.bhMail,
    parzellenNr: p.parzellenNr,
    objektadresse: p.objektadresse,
    objektart: p.objektart,
    raeume: p.raeume.map((r) => ({ bezeichnung: r.bezeichnung, flaeche: zahlFuerEingabe(r.flaecheM2) })),
    eckdaten,
  };
}
