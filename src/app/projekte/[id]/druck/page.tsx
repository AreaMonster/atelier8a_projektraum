import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { DruckKnopf } from "@/components/DruckKnopf";
import { KonfigFehler } from "@/components/KonfigFehler";
import { EckdatenListe, Stammdaten } from "@/components/ProjektDaten";
import { holeStruktur } from "@/lib/checkliste";
import { formatDatum, formatDatumZeit, wertAlsText } from "@/lib/format";
import { eintraegeAus, ladeProjekt } from "@/lib/projekte";
import {
  STATUS_LABEL,
  aktuellePhase,
  fortschritt,
  gesamtFortschritt,
  gruppenStatus,
  phasenTitel,
  type Eintraege,
  type Knoten,
  type Status,
} from "@/lib/struktur";

export const dynamic = "force-dynamic";

const SYMBOL: Record<Status, string> = { offen: "☐", erledigt: "☑", nicht_relevant: "–" };

export default async function Druckansicht({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = holeStruktur();
  if (!s.ok) return <KonfigFehler meldung={s.fehler} />;
  const p = await ladeProjekt(id);
  if (!p) notFound();

  const e = eintraegeAus(p.eintraege);
  const gesamt = gesamtFortschritt(s.struktur, e);

  return (
    <div className="druck">
      <div className="druck-werkzeug nicht-drucken">
        <Link href={`/projekte/${id}`} className="zurueck" style={{ margin: 0 }}>← Zurück zum Projekt</Link>
        <DruckKnopf />
      </div>

      <div className="druck-blatt">
        <header className="druck-kopf">
          <span className="marke">atelier8A AG</span>
          <span>Projektraum · Projektblatt</span>
          <span>Stand {formatDatumZeit(new Date())}</span>
        </header>

        <div className="leise">{p.projektnummer}</div>
        <h1>{p.projektname || p.projektnummer}</h1>
        <p className="leise" style={{ marginTop: 4 }}>
          Aktuelle Phase: {aktuellePhase(s.struktur, e)} · Gesamtfortschritt {gesamt.prozent} % ({gesamt.erledigt} von{" "}
          {gesamt.relevant} Punkten erledigt)
          {p.archiviert && " · archiviert"}
        </p>

        <section className="druck-abschnitt">
          <h2>Stammdaten</h2>
          <Stammdaten p={p} />
        </section>

        {s.struktur
          .filter((a) => !a.phase)
          .map((a) => (
            <section key={a.key} className="druck-abschnitt">
              <h2>{a.titel}</h2>
              <EckdatenListe knoten={a.knoten} eintraege={e} />
            </section>
          ))}

        {s.struktur
          .filter((a) => a.phase)
          .map((a) => {
            const f = fortschritt(a.knoten, e);
            return (
              <section key={a.key} className="druck-abschnitt">
                <h2>
                  {phasenTitel(a)}
                  <span className="leise klein" style={{ fontWeight: 400, marginLeft: 12 }}>
                    {f.erledigt} von {f.relevant} erledigt · {f.prozent} %
                  </span>
                </h2>
                <table className="druck-tabelle">
                  <thead>
                    <tr>
                      <th>Punkt</th>
                      <th>Wert</th>
                      <th>Status</th>
                      <th>Datum</th>
                      <th>Notiz</th>
                    </tr>
                  </thead>
                  <tbody>
                    <DruckZeilen knoten={a.knoten} e={e} />
                  </tbody>
                </table>
              </section>
            );
          })}
      </div>
    </div>
  );
}

function DruckZeilen({ knoten, e }: { knoten: Knoten[]; e: Eintraege }) {
  return (
    <>
      {knoten.map((k) => {
        const eintrag = e[k.key];
        const status = k.gruppe ? gruppenStatus(k, e) : (eintrag?.status ?? "offen");
        return (
          <Fragment key={k.key}>
            <tr className={`${k.gruppe ? "druck-gruppe" : ""} status-${status}`}>
              <td style={{ paddingLeft: `${0.4 + k.tiefe * 1.6}em` }}>
                <span className="nr">{k.nummer}</span>
                <span className="druck-label">{k.label}</span>
              </td>
              <td>{k.gruppe ? "" : wertAlsText(k.typ, eintrag?.wert)}</td>
              <td className="druck-status">
                {SYMBOL[status]} {STATUS_LABEL[status]}
              </td>
              <td>{formatDatum(eintrag?.datum)}</td>
              <td className="druck-notiz">{eintrag?.notiz}</td>
            </tr>
            <DruckZeilen knoten={k.children} e={e} />
          </Fragment>
        );
      })}
    </>
  );
}

