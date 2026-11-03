import Link from "next/link";
import { KonfigFehler } from "@/components/KonfigFehler";
import { ProjektTabelle } from "@/components/ProjektTabelle";
import { holeStruktur } from "@/lib/checkliste";
import { ladeProjektListe } from "@/lib/projekte";

export const dynamic = "force-dynamic";

export default async function Startseite() {
  const s = holeStruktur();
  if (!s.ok) return <KonfigFehler meldung={s.fehler} />;

  const projekte = await ladeProjektListe(s.struktur);

  return (
    <>
      <div className="seitenkopf">
        <div>
          <h1>Projektraum atelier8A AG</h1>
          <p className="untertitel">
            {projekte.filter((p) => !p.archiviert).length} aktive Projekte
          </p>
        </div>
        <Link href="/projekte/neu" className="btn btn-primaer btn-gross">
          + Neues Projekt erfassen
        </Link>
      </div>
      <ProjektTabelle projekte={projekte} />
    </>
  );
}
