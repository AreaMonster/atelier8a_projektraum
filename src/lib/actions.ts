"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { holeStruktur } from "./checkliste";
import { prisma } from "./db";
import { istIsoDatum } from "./format";
import { STATUS_WERTE, alleKnoten, type EintragDaten } from "./struktur";
import { pruefeProjekt, type Fehler, type ProjektFormDaten } from "./validierung";

export type SpeicherErgebnis = { ok: true; id: string } | { ok: false; fehler: Fehler; meldung: string };
export type AktionsErgebnis = { ok: true } | { ok: false; meldung: string };

const NUMMER_VERGEBEN = "Diese Projektnummer ist bereits vergeben.";

/** Creates a project (id omitted) or updates an existing one. Duplicating = creating with prefilled data. */
export async function projektSpeichern(daten: ProjektFormDaten, id?: string): Promise<SpeicherErgebnis> {
  const s = holeStruktur();
  if (!s.ok) return { ok: false, fehler: {}, meldung: s.fehler };

  const geprueft = pruefeProjekt(daten, s.struktur);
  const fehler = geprueft.ok ? {} : { ...geprueft.fehler };

  const nummer = typeof daten.projektnummer === "string" ? daten.projektnummer.trim() : "";
  if (nummer && !fehler.projektnummer) {
    const doppelt = await prisma.projekt.findUnique({ where: { projektnummer: nummer } });
    if (doppelt && doppelt.id !== id) fehler.projektnummer = NUMMER_VERGEBEN;
  }

  if (!geprueft.ok || Object.keys(fehler).length > 0) {
    return { ok: false, fehler, meldung: "Bitte die markierten Felder prüfen." };
  }
  const { projekt, raeume, eckdaten } = geprueft.werte;

  try {
    const gespeichert = await prisma.$transaction(async (tx) => {
      const p = id
        ? await tx.projekt.update({ where: { id }, data: projekt })
        : await tx.projekt.create({ data: projekt });

      await tx.raum.deleteMany({ where: { projektId: p.id } });
      if (raeume.length > 0) {
        await tx.raum.createMany({ data: raeume.map((r) => ({ ...r, projektId: p.id })) });
      }

      for (const { key, wert } of eckdaten) {
        const json = wert === null ? null : JSON.stringify(wert);
        await tx.eintrag.upsert({
          where: { projektId_itemKey: { projektId: p.id, itemKey: key } },
          update: { wert: json },
          create: { projektId: p.id, itemKey: key, wert: json },
        });
      }
      return p;
    });

    revalidatePath("/");
    revalidatePath(`/projekte/${gespeichert.id}`);
    return { ok: true, id: gespeichert.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, fehler: { projektnummer: NUMMER_VERGEBEN }, meldung: "Bitte die markierten Felder prüfen." };
    }
    console.error(e);
    return { ok: false, fehler: {}, meldung: "Das Projekt konnte nicht gespeichert werden." };
  }
}

/** Saves status, date, note and value of one checklist item. */
export async function eintragSpeichern(
  projektId: string,
  itemKey: string,
  daten: EintragDaten,
): Promise<AktionsErgebnis> {
  const s = holeStruktur();
  if (!s.ok) return { ok: false, meldung: s.fehler };

  const bekannt = s.struktur.some((a) => alleKnoten(a.knoten).some((k) => k.key === itemKey));
  if (!bekannt) return { ok: false, meldung: "Unbekannter Checklistenpunkt." };
  if (!(STATUS_WERTE as readonly string[]).includes(daten.status)) return { ok: false, meldung: "Ungültiger Status." };
  if (daten.datum && !istIsoDatum(daten.datum)) return { ok: false, meldung: "Ungültiges Datum." };

  const wert = daten.wert === null || daten.wert === undefined ? null : JSON.stringify(daten.wert);
  if ((wert?.length ?? 0) > 5000 || (daten.notiz?.length ?? 0) > 5000) {
    return { ok: false, meldung: "Der Eintrag ist zu lang." };
  }

  const felder = {
    status: daten.status,
    datum: daten.datum || null,
    notiz: daten.notiz?.trim() || null,
    wert,
  };

  try {
    await prisma.$transaction([
      prisma.eintrag.upsert({
        where: { projektId_itemKey: { projektId, itemKey } },
        update: felder,
        create: { projektId, itemKey, ...felder },
      }),
      prisma.projekt.update({ where: { id: projektId }, data: { geaendertAm: new Date() } }),
    ]);
    // No revalidatePath here: it would re-render the open detail page on every autosave.
    // All pages are dynamic, so the project list is fresh on the next visit anyway.
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, meldung: "Speichern fehlgeschlagen." };
  }
}

export async function projektArchivieren(id: string, archiviert: boolean): Promise<AktionsErgebnis> {
  try {
    await prisma.projekt.update({ where: { id }, data: { archiviert } });
    revalidatePath("/");
    revalidatePath(`/projekte/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, meldung: "Das Projekt konnte nicht aktualisiert werden." };
  }
}

/** Permanently deletes a project. Only allowed for archived projects. */
export async function projektLoeschen(id: string): Promise<AktionsErgebnis> {
  const p = await prisma.projekt.findUnique({ where: { id } });
  if (!p) return { ok: false, meldung: "Projekt nicht gefunden." };
  if (!p.archiviert) return { ok: false, meldung: "Nur archivierte Projekte können gelöscht werden." };
  await prisma.projekt.delete({ where: { id } });
  revalidatePath("/");
  return { ok: true };
}
