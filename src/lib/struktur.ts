// Pure helpers for the checklist structure (usable on server and client).

export const ITEM_TYPEN = [
  "checkliste",
  "janein",
  "text",
  "zahl",
  "m",
  "m3",
  "chf",
  "datum",
  "datumsbereich",
  "fachplaner",
] as const;
export type ItemTyp = (typeof ITEM_TYPEN)[number];

export const STATUS_WERTE = ["offen", "erledigt", "nicht_relevant"] as const;
export type Status = (typeof STATUS_WERTE)[number];

export const STATUS_LABEL: Record<Status, string> = {
  offen: "offen",
  erledigt: "erledigt",
  nicht_relevant: "nicht relevant",
};

export const OBJEKTARTEN = ["Neubau", "Anbau", "Umbau", "Sanierung"] as const;

/** Shape of an item in config/checkliste.json */
export interface ConfigItem {
  key: string;
  label: string;
  typ?: ItemTyp;
  gruppe?: boolean;
  nummeriert?: boolean;
  children?: ConfigItem[];
}

export interface ConfigAbschnitt {
  key: string;
  titel: string;
  phase: boolean;
  items: ConfigItem[];
}

export interface Knoten {
  key: string;
  label: string;
  typ: ItemTyp;
  gruppe: boolean;
  nummer: string | null;
  tiefe: number;
  children: Knoten[];
}

export interface Abschnitt {
  key: string;
  titel: string;
  phase: boolean;
  knoten: Knoten[];
}

export interface Fachplaner {
  firma: string;
  kontakt: string;
}

export interface Datumsbereich {
  von: string | null;
  bis: string | null;
}

export interface EintragDaten {
  status: Status;
  datum: string | null;
  notiz: string | null;
  wert: unknown;
}

export type Eintraege = Record<string, EintragDaten>;

export const LEERER_EINTRAG: EintragDaten = { status: "offen", datum: null, notiz: null, wert: null };

// ---------------------------------------------------------------------------
// Numbering: 1. → a. → i. → 1. → a. …

const ROEMISCH: [number, string][] = [
  [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"],
  [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
];

function roemisch(n: number): string {
  let s = "";
  for (const [wert, zeichen] of ROEMISCH) {
    while (n >= wert) {
      s += zeichen;
      n -= wert;
    }
  }
  return s;
}

function buchstabe(n: number): string {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(97 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function nummerFuer(position: number, tiefe: number): string {
  switch (tiefe % 3) {
    case 0:
      return `${position}.`;
    case 1:
      return `${buchstabe(position)}.`;
    default:
      return `${roemisch(position)}.`;
  }
}

function baueKnoten(items: ConfigItem[], tiefe: number): Knoten[] {
  let position = 0;
  return items.map((item) => {
    const nummeriert = item.nummeriert !== false;
    if (nummeriert) position++;
    return {
      key: item.key,
      label: item.label,
      typ: item.typ ?? "checkliste",
      gruppe: item.gruppe === true,
      nummer: nummeriert ? nummerFuer(position, tiefe) : null,
      tiefe,
      children: baueKnoten(item.children ?? [], tiefe + 1),
    };
  });
}

export function baueStruktur(abschnitte: ConfigAbschnitt[]): Abschnitt[] {
  return abschnitte.map((a) => ({
    key: a.key,
    titel: a.titel,
    phase: a.phase,
    knoten: baueKnoten(a.items, 0),
  }));
}

export function alleKnoten(knoten: Knoten[]): Knoten[] {
  return knoten.flatMap((k) => [k, ...alleKnoten(k.children)]);
}

export function phasenTitel(a: Abschnitt): string {
  return a.phase ? `Phase: ${a.titel}` : a.titel;
}

// ---------------------------------------------------------------------------
// Progress

export interface Fortschritt {
  erledigt: number;
  relevant: number;
  gesamt: number;
  prozent: number;
}

function zaehle(knoten: Knoten[], e: Eintraege, acc: Fortschritt) {
  for (const k of knoten) {
    // Group headings are not counted themselves, only their sub-items.
    if (!k.gruppe) {
      const status = e[k.key]?.status ?? "offen";
      acc.gesamt++;
      if (status !== "nicht_relevant") acc.relevant++;
      if (status === "erledigt") acc.erledigt++;
    }
    zaehle(k.children, e, acc);
  }
}

function mitProzent(f: Omit<Fortschritt, "prozent">): Fortschritt {
  let prozent: number;
  if (f.relevant > 0) prozent = Math.round((f.erledigt / f.relevant) * 100);
  else prozent = f.gesamt > 0 ? 100 : 0;
  return { ...f, prozent };
}

export function fortschritt(knoten: Knoten[], e: Eintraege): Fortschritt {
  const acc = { erledigt: 0, relevant: 0, gesamt: 0, prozent: 0 };
  zaehle(knoten, e, acc);
  return mitProzent(acc);
}

export function gesamtFortschritt(struktur: Abschnitt[], e: Eintraege): Fortschritt {
  const acc = { erledigt: 0, relevant: 0, gesamt: 0, prozent: 0 };
  for (const a of struktur) if (a.phase) zaehle(a.knoten, e, acc);
  return mitProzent(acc);
}

/** Derived status of a group heading. */
export function gruppenStatus(k: Knoten, e: Eintraege): Status {
  const f = fortschritt(k.children, e);
  if (f.gesamt === 0) return "offen";
  if (f.relevant === 0) return "nicht_relevant";
  return f.erledigt === f.relevant ? "erledigt" : "offen";
}

/** First phase that is not complete; "Abgeschlossen" if all are. */
export function aktuellePhase(struktur: Abschnitt[], e: Eintraege): string {
  for (const a of struktur) {
    if (a.phase && fortschritt(a.knoten, e).prozent < 100) return a.titel;
  }
  return "Abgeschlossen";
}
