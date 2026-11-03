"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ProjektZeile } from "@/lib/projekte";
import { Fortschritt } from "./Fortschritt";

type Spalte = "projektnummer" | "projektname" | "bauherrschaft" | "objektadresse" | "objektart" | "phase" | "fortschritt";

const SPALTEN: { key: Spalte; titel: string }[] = [
  { key: "projektnummer", titel: "Projektnummer" },
  { key: "projektname", titel: "Projektname" },
  { key: "bauherrschaft", titel: "Bauherrschaft" },
  { key: "objektadresse", titel: "Objektadresse" },
  { key: "objektart", titel: "Objektart" },
  { key: "phase", titel: "Aktuelle Phase" },
  { key: "fortschritt", titel: "Fortschritt" },
];

const vergleich = new Intl.Collator("de-CH", { numeric: true, sensitivity: "base" });

export function ProjektTabelle({ projekte }: { projekte: ProjektZeile[] }) {
  const router = useRouter();
  const [suche, setSuche] = useState("");
  const [archivierteZeigen, setArchivierteZeigen] = useState(false);
  const [sortierung, setSortierung] = useState<{ spalte: Spalte; aufsteigend: boolean }>({
    spalte: "projektnummer",
    aufsteigend: true,
  });

  const zeilen = useMemo(() => {
    const begriffe = suche.toLowerCase().split(/\s+/).filter(Boolean);
    const gefiltert = projekte.filter((p) => {
      if (p.archiviert && !archivierteZeigen) return false;
      const text = [p.projektnummer, p.projektname, p.bauherrschaft, p.objektadresse, p.objektart, p.phase]
        .join(" ")
        .toLowerCase();
      return begriffe.every((b) => text.includes(b));
    });
    const { spalte, aufsteigend } = sortierung;
    return gefiltert.sort((a, b) => {
      const r =
        spalte === "fortschritt" ? a.fortschritt - b.fortschritt : vergleich.compare(a[spalte], b[spalte]);
      return aufsteigend ? r : -r;
    });
  }, [projekte, suche, archivierteZeigen, sortierung]);

  function sortiere(spalte: Spalte) {
    setSortierung((s) => ({ spalte, aufsteigend: s.spalte === spalte ? !s.aufsteigend : true }));
  }

  const anzahlArchiviert = projekte.filter((p) => p.archiviert).length;

  return (
    <>
      <div className="werkzeugleiste">
        <input
          type="search"
          className="suche"
          placeholder="Projekte durchsuchen (Nummer, Name, Bauherrschaft, Adresse …)"
          aria-label="Projekte durchsuchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
        {anzahlArchiviert > 0 && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={archivierteZeigen}
              onChange={(e) => setArchivierteZeigen(e.target.checked)}
            />
            Archivierte anzeigen ({anzahlArchiviert})
          </label>
        )}
      </div>

      <div className="tabellen-rahmen">
        {projekte.length === 0 ? (
          <div className="leerzustand">
            <p>Noch keine Projekte erfasst.</p>
            <Link href="/projekte/neu" className="btn btn-primaer">
              + Neues Projekt erfassen
            </Link>
          </div>
        ) : zeilen.length === 0 ? (
          <div className="leerzustand">
            {suche ? <>Keine Projekte gefunden für «{suche}».</> : <>Keine aktiven Projekte.</>}
          </div>
        ) : (
          <table className="tabelle">
            <thead>
              <tr>
                {SPALTEN.map((s) => {
                  const aktiv = sortierung.spalte === s.key;
                  return (
                    <th
                      key={s.key}
                      aria-sort={aktiv ? (sortierung.aufsteigend ? "ascending" : "descending") : undefined}
                    >
                      <button type="button" onClick={() => sortiere(s.key)} title="Sortieren">
                        {s.titel}
                        {aktiv ? (sortierung.aufsteigend ? " ↑" : " ↓") : ""}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {zeilen.map((p) => (
                <tr
                  key={p.id}
                  className={p.archiviert ? "zeile-archiviert" : undefined}
                  onClick={() => router.push(`/projekte/${p.id}`)}
                >
                  <td className="nummer">
                    <Link href={`/projekte/${p.id}`}>{p.projektnummer}</Link>
                  </td>
                  <td>
                    {p.projektname || <span className="leise">–</span>}
                    {p.archiviert && <span className="marker">archiviert</span>}
                  </td>
                  <td>{p.bauherrschaft || <span className="leise">–</span>}</td>
                  <td>{p.objektadresse || <span className="leise">–</span>}</td>
                  <td>{p.objektart || <span className="leise">–</span>}</td>
                  <td>{p.phase}</td>
                  <td>
                    <Fortschritt prozent={p.fortschritt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
