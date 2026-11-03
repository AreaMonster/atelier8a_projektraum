import Link from "next/link";
import { notFound } from "next/navigation";
import { KonfigFehler } from "@/components/KonfigFehler";
import { ProjektFormular } from "@/components/ProjektFormular";
import { holeStruktur } from "@/lib/checkliste";
import { formDatenAus, ladeProjekt } from "@/lib/projekte";

export const dynamic = "force-dynamic";

export default async function ProjektDuplizieren({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = holeStruktur();
  if (!s.ok) return <KonfigFehler meldung={s.fehler} />;
  const projekt = await ladeProjekt(id);
  if (!projekt) notFound();

  const kopie = formDatenAus(projekt, s.struktur);
  kopie.projektnummer = "";
  kopie.projektname = projekt.projektname ? `${projekt.projektname} (Kopie)` : "";

  return (
    <>
      <Link href={`/projekte/${id}`} className="zurueck">← Zurück zum Projekt</Link>
      <div className="seitenkopf">
        <div>
          <h1>Projekt duplizieren</h1>
          <p className="untertitel">
            Kopie von {projekt.projektnummer}. Stammdaten, Raumprogramm und Eckdaten werden übernommen,
            die Checklisten starten neu. Bitte eine neue Projektnummer vergeben.
          </p>
        </div>
      </div>
      <ProjektFormular
        modus="duplizieren"
        initial={kopie}
        eckdatenAbschnitte={s.struktur.filter((a) => !a.phase)}
        abbrechenHref={`/projekte/${id}`}
      />
    </>
  );
}
