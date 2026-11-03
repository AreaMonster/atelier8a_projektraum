import Link from "next/link";
import { notFound } from "next/navigation";
import { KonfigFehler } from "@/components/KonfigFehler";
import { ProjektAktionen } from "@/components/ProjektAktionen";
import { ProjektArbeitsbereich } from "@/components/ProjektArbeitsbereich";
import { EckdatenListe, Stammdaten } from "@/components/ProjektDaten";
import { holeStruktur } from "@/lib/checkliste";
import { bauherrschaftName, eintraegeAus, ladeProjekt } from "@/lib/projekte";

export const dynamic = "force-dynamic";

export default async function ProjektDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = holeStruktur();
  if (!s.ok) return <KonfigFehler meldung={s.fehler} />;
  const p = await ladeProjekt(id);
  if (!p) notFound();

  const eintraege = eintraegeAus(p.eintraege);
  const untertitel = [p.objektart, p.objektadresse, bauherrschaftName(p) && `Bauherrschaft: ${bauherrschaftName(p)}`]
    .filter(Boolean)
    .join(" · ");

  const vorspann = (
    <>
      <details className="karte">
        <summary>
          <h2>Stammdaten</h2>
        </summary>
        <div className="karte-inhalt">
          <Stammdaten p={p} />
        </div>
      </details>
      {s.struktur
        .filter((a) => !a.phase)
        .map((a) => (
          <details key={a.key} className="karte">
            <summary>
              <h2>{a.titel}</h2>
            </summary>
            <div className="karte-inhalt">
              <EckdatenListe knoten={a.knoten} eintraege={eintraege} />
              <p className="klein leise" style={{ marginBottom: 0 }}>
                Änderungen über <Link href={`/projekte/${id}/bearbeiten`}>Bearbeiten</Link>.
              </p>
            </div>
          </details>
        ))}
    </>
  );

  return (
    <>
      <Link href="/" className="zurueck">← Alle Projekte</Link>

      {p.archiviert && (
        <div className="hinweis-balken">
          <span>Dieses Projekt ist archiviert und erscheint nicht in der Projektliste.</span>
        </div>
      )}

      <div className="seitenkopf">
        <div>
          <div className="leise">{p.projektnummer}</div>
          <h1>{p.projektname || p.projektnummer}</h1>
          {untertitel && <p className="untertitel">{untertitel}</p>}
        </div>
        <ProjektAktionen id={p.id} projektnummer={p.projektnummer} archiviert={p.archiviert} />
      </div>

      <ProjektArbeitsbereich
        projektId={p.id}
        struktur={s.struktur}
        eintraegeInitial={eintraege}
        vorspann={vorspann}
      />
    </>
  );
}
