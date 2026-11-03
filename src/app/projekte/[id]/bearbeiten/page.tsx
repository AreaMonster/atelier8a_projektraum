import Link from "next/link";
import { notFound } from "next/navigation";
import { KonfigFehler } from "@/components/KonfigFehler";
import { ProjektFormular } from "@/components/ProjektFormular";
import { holeStruktur } from "@/lib/checkliste";
import { formDatenAus, ladeProjekt } from "@/lib/projekte";

export const dynamic = "force-dynamic";

export default async function ProjektBearbeiten({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = holeStruktur();
  if (!s.ok) return <KonfigFehler meldung={s.fehler} />;
  const projekt = await ladeProjekt(id);
  if (!projekt) notFound();

  return (
    <>
      <Link href={`/projekte/${id}`} className="zurueck">← Zurück zum Projekt</Link>
      <div className="seitenkopf">
        <div>
          <h1>Projekt bearbeiten</h1>
          <p className="untertitel">{projekt.projektnummer} · {projekt.projektname}</p>
        </div>
      </div>
      <ProjektFormular
        modus="bearbeiten"
        projektId={id}
        initial={formDatenAus(projekt, s.struktur)}
        eckdatenAbschnitte={s.struktur.filter((a) => !a.phase)}
        abbrechenHref={`/projekte/${id}`}
      />
    </>
  );
}
