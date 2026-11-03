import Link from "next/link";
import { KonfigFehler } from "@/components/KonfigFehler";
import { ProjektFormular } from "@/components/ProjektFormular";
import { holeStruktur } from "@/lib/checkliste";
import { leereFormDaten } from "@/lib/projekte";

export const dynamic = "force-dynamic";

export default function NeuesProjekt() {
  const s = holeStruktur();
  if (!s.ok) return <KonfigFehler meldung={s.fehler} />;

  return (
    <>
      <Link href="/" className="zurueck">← Alle Projekte</Link>
      <div className="seitenkopf">
        <div>
          <h1>Neues Projekt erfassen</h1>
          <p className="untertitel">Die Checklisten der Phasen werden in der Projektansicht geführt.</p>
        </div>
      </div>
      <ProjektFormular
        modus="neu"
        initial={leereFormDaten()}
        eckdatenAbschnitte={s.struktur.filter((a) => !a.phase)}
        abbrechenHref="/"
      />
    </>
  );
}
