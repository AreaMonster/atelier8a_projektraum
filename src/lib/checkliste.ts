import "server-only";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ITEM_TYPEN, baueStruktur, alleKnoten, type Abschnitt, type ConfigItem } from "./struktur";

const KONFIG_PFAD = path.join(process.cwd(), "config", "checkliste.json");

const itemSchema: z.ZodType<ConfigItem> = z.lazy(() =>
  z.object({
    key: z.string().min(1, "Jeder Punkt braucht einen «key»."),
    label: z.string().min(1, "Jeder Punkt braucht ein «label»."),
    typ: z.enum(ITEM_TYPEN, {
      errorMap: () => ({ message: `Unbekannter «typ». Erlaubt: ${ITEM_TYPEN.join(", ")}.` }),
    }).optional(),
    gruppe: z.boolean().optional(),
    nummeriert: z.boolean().optional(),
    children: z.array(itemSchema).optional(),
  }),
);

const konfigSchema = z.object({
  abschnitte: z.array(
    z.object({
      key: z.string().min(1),
      titel: z.string().min(1),
      phase: z.boolean().default(false),
      items: z.array(itemSchema),
    }),
  ),
});

export type StrukturErgebnis = { ok: true; struktur: Abschnitt[] } | { ok: false; fehler: string };

let cache: { mtime: number; ergebnis: StrukturErgebnis } | null = null;

function lade(): StrukturErgebnis {
  let roh: unknown;
  try {
    roh = JSON.parse(fs.readFileSync(KONFIG_PFAD, "utf8"));
  } catch (e) {
    const grund = e instanceof SyntaxError ? `ungültiges JSON (${e.message})` : "Datei nicht gefunden";
    return { ok: false, fehler: `config/checkliste.json konnte nicht gelesen werden: ${grund}.` };
  }

  const geprueft = konfigSchema.safeParse(roh);
  if (!geprueft.success) {
    const i = geprueft.error.issues[0];
    return { ok: false, fehler: `Fehler in config/checkliste.json bei «${i.path.join(" › ")}»: ${i.message}` };
  }

  const struktur = baueStruktur(geprueft.data.abschnitte);
  const gesehen = new Set<string>();
  for (const a of struktur) {
    for (const k of [{ key: a.key }, ...alleKnoten(a.knoten)]) {
      if (gesehen.has(k.key)) {
        return { ok: false, fehler: `Fehler in config/checkliste.json: der key «${k.key}» kommt mehrfach vor.` };
      }
      gesehen.add(k.key);
    }
  }
  return { ok: true, struktur };
}

/** Loads the checklist structure; re-reads the file when it changes on disk. */
export function holeStruktur(): StrukturErgebnis {
  let mtime = 0;
  try {
    mtime = fs.statSync(KONFIG_PFAD).mtimeMs;
  } catch {
    // handled by lade()
  }
  if (!cache || cache.mtime !== mtime) cache = { mtime, ergebnis: lade() };
  return cache.ergebnis;
}
