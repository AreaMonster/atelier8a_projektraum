// Read-only display of Stammdaten, Raumprogramm and Eckdaten (server-rendered, also used in print view).

import type { Raum } from "@prisma/client";
import { formatFlaeche, wertAlsText } from "@/lib/format";
import type { ProjektMitDaten } from "@/lib/projekte";
import type { Eintraege, Knoten } from "@/lib/struktur";

function Feld({ titel, wert }: { titel: string; wert: string }) {
  return (
    <div className="daten-feld">
      <dt>{titel}</dt>
      <dd>{wert || <span className="daten-leer">–</span>}</dd>
    </div>
  );
}

export function Stammdaten({ p }: { p: ProjektMitDaten }) {
  return (
    <>
      <dl className="daten-raster" style={{ margin: 0 }}>
        <Feld titel="Projektnummer" wert={p.projektnummer} />
        <Feld titel="Projektname" wert={p.projektname} />
        <Feld titel="Parzellen Nr." wert={p.parzellenNr} />
        <Feld titel="Objektart" wert={p.objektart} />
        <Feld titel="Objektadresse" wert={p.objektadresse} />
      </dl>
      <h3 className="untertitel-klein">Bauherrschaft</h3>
      <dl className="daten-raster" style={{ margin: 0 }}>
        <Feld titel="Name, Vorname" wert={[p.bhName, p.bhVorname].filter(Boolean).join(", ")} />
        <Feld titel="Adresse" wert={p.bhAdresse} />
        <Feld titel="Telefon" wert={p.bhTelefon} />
        <Feld titel="Mail" wert={p.bhMail} />
      </dl>
      <h3 className="untertitel-klein">Raumprogramm</h3>
      <Raumprogramm raeume={p.raeume} />
    </>
  );
}

export function Raumprogramm({ raeume }: { raeume: Raum[] }) {
  if (raeume.length === 0) return <p className="leise" style={{ margin: 0 }}>Kein Raumprogramm erfasst.</p>;
  const total = raeume.reduce((s, r) => s + (r.flaecheM2 ?? 0), 0);
  return (
    <table className="raum-tabelle">
      <thead>
        <tr>
          <th>Raum</th>
          <th className="zahl">Fläche</th>
        </tr>
      </thead>
      <tbody>
        {raeume.map((r) => (
          <tr key={r.id}>
            <td>{r.bezeichnung}</td>
            <td className="zahl">{r.flaecheM2 !== null ? formatFlaeche(r.flaecheM2) : "–"}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>Total</td>
          <td className="zahl">{formatFlaeche(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

export function EckdatenListe({ knoten, eintraege }: { knoten: Knoten[]; eintraege: Eintraege }) {
  return (
    <ul className="eck-liste">
      {knoten.map((k) => (
        <EckZeile key={k.key} k={k} eintraege={eintraege} />
      ))}
    </ul>
  );
}

function EckZeile({ k, eintraege }: { k: Knoten; eintraege: Eintraege }) {
  const text = wertAlsText(k.typ, eintraege[k.key]?.wert);
  return (
    <>
      <li className="eck-zeile">
        <span style={{ display: "flex", alignItems: "baseline", paddingLeft: `${k.tiefe * 2.2}em` }}>
          {k.nummer && <span className="nr">{k.nummer}</span>}
          <span>{k.label}</span>
        </span>
        <span className="eck-wert">{text || <span className="daten-leer">–</span>}</span>
      </li>
      {k.children.map((c) => (
        <EckZeile key={c.key} k={c} eintraege={eintraege} />
      ))}
    </>
  );
}
