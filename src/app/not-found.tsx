import Link from "next/link";

export default function NichtGefunden() {
  return (
    <div className="leerzustand">
      <h1>Seite nicht gefunden</h1>
      <p>Das Projekt existiert nicht oder wurde gelöscht.</p>
      <Link href="/" className="btn">Zur Projektliste</Link>
    </div>
  );
}
