"use client";

import { useRef, useState, type ReactNode } from "react";
import { eintragSpeichern } from "@/lib/actions";
import {
  aktuellePhase,
  fortschritt,
  gesamtFortschritt,
  phasenTitel,
  type Abschnitt,
  type EintragDaten,
  type Eintraege,
} from "@/lib/struktur";
import { ChecklistenListe } from "./ChecklistenItem";
import { Fortschritt } from "./Fortschritt";

/** Overall progress + collapsible phase checklists with autosave. */
export function ProjektArbeitsbereich({
  projektId,
  struktur,
  eintraegeInitial,
  vorspann,
}: {
  projektId: string;
  struktur: Abschnitt[];
  eintraegeInitial: Eintraege;
  vorspann: ReactNode;
}) {
  const [eintraege, setEintraege] = useState<Eintraege>(eintraegeInitial);
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [ausstehend, setAusstehend] = useState(0);
  const [startPhase] = useState(() => aktuellePhase(struktur, eintraegeInitial));
  const version = useRef<Record<string, number>>({});

  async function aendern(key: string, daten: EintragDaten) {
    setEintraege((e) => ({ ...e, [key]: daten }));
    const v = (version.current[key] ?? 0) + 1;
    version.current[key] = v;
    setAusstehend((n) => n + 1);
    const r = await eintragSpeichern(projektId, key, daten);
    setAusstehend((n) => n - 1);
    if (version.current[key] !== v) return; // a newer change for this item is on its way
    setFehler((f) => {
      const { [key]: _, ...rest } = f;
      return r.ok ? rest : { ...rest, [key]: `${r.meldung} Bitte erneut versuchen.` };
    });
  }

  const gesamt = gesamtFortschritt(struktur, eintraege);
  const phasen = struktur.filter((a) => a.phase);
  const anzahlFehler = Object.keys(fehler).length;

  return (
    <>
      <div className="karte gesamt">
        <div>
          <div className="gesamt-label">Gesamtfortschritt</div>
          <Fortschritt prozent={gesamt.prozent} titel="Gesamtfortschritt" />
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="gesamt-label">Aktuelle Phase</div>
          <div>{aktuellePhase(struktur, eintraege)}</div>
        </div>
        <div className="klein leise">
          {gesamt.erledigt} von {gesamt.relevant} relevanten Punkten erledigt
          {gesamt.gesamt > gesamt.relevant && ` · ${gesamt.gesamt - gesamt.relevant} nicht relevant`}
        </div>
        <div className="klein leise" style={{ textAlign: "right" }} aria-live="polite">
          {anzahlFehler > 0 ? (
            <span style={{ color: "var(--fehler)" }}>Nicht alle Änderungen gespeichert</span>
          ) : ausstehend > 0 ? (
            "Speichert …"
          ) : (
            "Änderungen werden automatisch gespeichert"
          )}
        </div>
      </div>

      {vorspann}

      {phasen.map((a) => {
        const f = fortschritt(a.knoten, eintraege);
        return (
          <details key={a.key} className="karte" open={a.titel === startPhase}>
            <summary>
              <h2>{phasenTitel(a)}</h2>
              <span className="klein leise">
                {f.erledigt} von {f.relevant} erledigt
              </span>
              <Fortschritt prozent={f.prozent} titel={`Fortschritt ${phasenTitel(a)}`} />
            </summary>
            <div className="karte-inhalt">
              <ChecklistenListe
                knoten={a.knoten}
                ebene={0}
                eintraege={eintraege}
                fehler={fehler}
                onAendern={aendern}
              />
            </div>
          </details>
        );
      })}
    </>
  );
}
