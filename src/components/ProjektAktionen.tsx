"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { projektArchivieren, projektLoeschen } from "@/lib/actions";

interface Bestaetigung {
  titel: string;
  text: string;
  knopf: string;
  gefahr?: boolean;
  aktion: () => Promise<void>;
}

export function ProjektAktionen({ id, projektnummer, archiviert }: { id: string; projektnummer: string; archiviert: boolean }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [frage, setFrage] = useState<Bestaetigung | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  function fragen(b: Bestaetigung) {
    setFrage(b);
    setFehler(null);
    dialog.current?.showModal();
  }

  async function bestaetigen() {
    if (!frage) return;
    setLaeuft(true);
    try {
      await frage.aktion();
      dialog.current?.close();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Aktion fehlgeschlagen.");
    } finally {
      setLaeuft(false);
    }
  }

  async function archivStatus(neu: boolean) {
    const r = await projektArchivieren(id, neu);
    if (!r.ok) throw new Error(r.meldung);
    router.refresh();
  }

  return (
    <>
      <div className="knopfreihe">
        <Link href={`/projekte/${id}/bearbeiten`} className="btn">Bearbeiten</Link>
        <Link href={`/projekte/${id}/duplizieren`} className="btn">Duplizieren</Link>
        <Link href={`/projekte/${id}/druck`} className="btn">Druckansicht / PDF</Link>
        {archiviert ? (
          <>
            <button type="button" className="btn" onClick={() => archivStatus(false)}>Wiederherstellen</button>
            <button
              type="button"
              className="btn btn-gefahr"
              onClick={() =>
                fragen({
                  titel: "Projekt endgültig löschen?",
                  text: `Das Projekt ${projektnummer} wird mit allen Checklisten unwiderruflich gelöscht. Dieser Schritt kann nicht rückgängig gemacht werden.`,
                  knopf: "Endgültig löschen",
                  gefahr: true,
                  aktion: async () => {
                    const r = await projektLoeschen(id);
                    if (!r.ok) throw new Error(r.meldung);
                    router.push("/");
                    router.refresh();
                  },
                })
              }
            >
              Endgültig löschen
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() =>
              fragen({
                titel: "Projekt archivieren?",
                text: `Das Projekt ${projektnummer} wird aus der Projektliste ausgeblendet. Es bleibt erhalten und kann jederzeit wiederhergestellt werden.`,
                knopf: "Archivieren",
                aktion: () => archivStatus(true),
              })
            }
          >
            Archivieren
          </button>
        )}
      </div>

      <dialog ref={dialog} className="bestaetigung" onClose={() => setFrage(null)}>
        {frage && (
          <>
            <h2>{frage.titel}</h2>
            <p>{frage.text}</p>
            {fehler && <div className="formular-fehler">{fehler}</div>}
            <div className="knopfreihe" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={() => dialog.current?.close()}>Abbrechen</button>
              <button
                type="button"
                className={`btn ${frage.gefahr ? "btn-gefahr-voll" : "btn-primaer"}`}
                disabled={laeuft}
                onClick={bestaetigen}
              >
                {frage.knopf}
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
