"use client";

import { useState } from "react";
import { EINHEIT, formatDatum, parseZahl, zahlFuerEingabe } from "@/lib/format";
import {
  LEERER_EINTRAG,
  STATUS_LABEL,
  STATUS_WERTE,
  fortschritt,
  gruppenStatus,
  type Datumsbereich,
  type EintragDaten,
  type Eintraege,
  type Fachplaner,
  type Knoten,
  type Status,
} from "@/lib/struktur";
import { DatumFeld, EinheitEingabe, JaNeinAuswahl } from "./Felder";

interface ItemProps {
  knoten: Knoten;
  eintraege: Eintraege;
  fehler: Record<string, string>;
  onAendern: (key: string, daten: EintragDaten) => void;
}

export function ChecklistenListe({ knoten, ebene, ...rest }: Omit<ItemProps, "knoten"> & { knoten: Knoten[]; ebene: number }) {
  if (knoten.length === 0) return null;
  return (
    <ul className={`item-liste ebene-${ebene}`}>
      {knoten.map((k) => (
        <ChecklistenItem key={k.key} knoten={k} {...rest} />
      ))}
    </ul>
  );
}

function ChecklistenItem({ knoten: k, eintraege, fehler, onAendern }: ItemProps) {
  const [detailsOffen, setDetailsOffen] = useState(false);
  const kinder = (
    <ChecklistenListe knoten={k.children} ebene={k.tiefe + 1} eintraege={eintraege} fehler={fehler} onAendern={onAendern} />
  );

  if (k.gruppe) {
    const status = gruppenStatus(k, eintraege);
    const f = fortschritt(k.children, eintraege);
    return (
      <li className={`item item-gruppe status-${status}`}>
        <div className="item-zeile">
          <div className="item-titel">
            {k.nummer && <span className="nr">{k.nummer}</span>}
            <span className="item-label">{k.label}</span>
          </div>
          <span className={`gruppen-status ${status}`}>
            {status === "nicht_relevant" ? "nicht relevant" : `${f.erledigt} von ${f.relevant} erledigt`}
          </span>
        </div>
        {kinder}
      </li>
    );
  }

  const e = eintraege[k.key] ?? LEERER_EINTRAG;
  const setze = (patch: Partial<EintragDaten>) => onAendern(k.key, { ...e, ...patch });
  const setzeWert = (wert: unknown, erledigtVorschlagen = false) =>
    setze({ wert, ...(erledigtVorschlagen && e.status === "offen" ? { status: "erledigt" as Status } : {}) });
  const hatDetails = !!(e.datum || e.notiz);

  return (
    <li className={`item status-${e.status}`}>
      <div className="item-zeile">
        <div className="item-titel">
          {k.nummer && <span className="nr">{k.nummer}</span>}
          <span className="item-label">{k.label}</span>
        </div>
        <div className="item-steuerung">
          <WertEingabe knoten={k} wert={e.wert} onWert={setzeWert} />
          <StatusAuswahl wert={e.status} onChange={(status) => setze({ status })} label={k.label} />
          <button
            type="button"
            className="btn btn-text klein details-knopf"
            aria-expanded={detailsOffen}
            onClick={() => setDetailsOffen((o) => !o)}
            title={k.typ === "datum" ? "Notiz" : "Datum und Notiz"}
          >
            {k.typ === "datum" ? "Notiz" : "Datum/Notiz"} {detailsOffen ? "▴" : "▾"}
            {hatDetails && !detailsOffen && <span style={{ color: "var(--akzent)" }}>•</span>}
          </button>
        </div>
      </div>

      {!detailsOffen && hatDetails && (
        <div className="item-notiz-vorschau">
          {e.datum && k.typ !== "datum" && formatDatum(e.datum)}
          {e.datum && k.typ !== "datum" && e.notiz && " · "}
          {e.notiz}
        </div>
      )}

      {detailsOffen && (
        <div className="item-details">
          {k.typ !== "datum" && (
            <div className="feld">
              <span className="feld-label">Datum</span>
              <DatumFeld wert={e.datum} label={`Datum ${k.label}`} onChange={(datum) => setze({ datum })} />
            </div>
          )}
          <div className="feld" style={k.typ === "datum" ? { gridColumn: "1 / -1" } : undefined}>
            <label htmlFor={`notiz-${k.key}`}>Notiz</label>
            <NotizFeld id={`notiz-${k.key}`} wert={e.notiz} onSpeichern={(notiz) => setze({ notiz })} />
          </div>
        </div>
      )}

      {fehler[k.key] && <div className="item-fehler" role="alert">{fehler[k.key]}</div>}
      {kinder}
    </li>
  );
}

function StatusAuswahl({ wert, onChange, label }: { wert: Status; onChange: (s: Status) => void; label: string }) {
  return (
    <span className="seg status" role="group" aria-label={`Status ${label}`}>
      {STATUS_WERTE.map((s) => (
        <button
          key={s}
          type="button"
          data-wert={s}
          aria-pressed={wert === s}
          onClick={() => wert !== s && onChange(s)}
        >
          {STATUS_LABEL[s]}
        </button>
      ))}
    </span>
  );
}

function NotizFeld({ id, wert, onSpeichern }: { id: string; wert: string | null; onSpeichern: (n: string | null) => void }) {
  const [text, setText] = useState(wert ?? "");
  return (
    <textarea
      id={id}
      rows={2}
      placeholder="Notiz hinzufügen …"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const neu = text.trim() || null;
        if (neu !== (wert ?? null)) onSpeichern(neu);
      }}
    />
  );
}

function WertEingabe({
  knoten,
  wert,
  onWert,
}: {
  knoten: Knoten;
  wert: unknown;
  onWert: (w: unknown, erledigtVorschlagen?: boolean) => void;
}) {
  switch (knoten.typ) {
    case "janein":
      return (
        <JaNeinAuswahl
          wert={typeof wert === "boolean" ? wert : null}
          label={knoten.label}
          onChange={(w) => onWert(w, w === true)}
        />
      );
    case "text":
      return <TextWert wert={typeof wert === "string" ? wert : ""} label={knoten.label} onWert={onWert} />;
    case "zahl":
    case "m":
    case "m3":
    case "chf":
      return <ZahlWert knoten={knoten} wert={typeof wert === "number" ? wert : null} onWert={onWert} />;
    case "datum":
      return (
        <DatumFeld
          wert={typeof wert === "string" ? wert : null}
          label={knoten.label}
          onChange={(iso) => onWert(iso, !!iso)}
        />
      );
    case "datumsbereich": {
      const b = (wert as Datumsbereich | null) ?? { von: null, bis: null };
      const setze = (neu: Datumsbereich) => onWert(neu.von || neu.bis ? neu : null);
      return (
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <DatumFeld wert={b.von} label="von" onChange={(von) => setze({ ...b, von })} />
          <span className="leise">–</span>
          <DatumFeld wert={b.bis} label="bis" onChange={(bis) => setze({ ...b, bis })} />
        </span>
      );
    }
    case "fachplaner":
      return <FachplanerWert wert={(wert as Fachplaner | null) ?? null} onWert={onWert} />;
    default:
      return null;
  }
}

function TextWert({ wert, label, onWert }: { wert: string; label: string; onWert: (w: unknown) => void }) {
  const [text, setText] = useState(wert);
  return (
    <input
      type="text"
      className="wert-feld breit"
      aria-label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => text.trim() !== wert && onWert(text.trim() || null)}
    />
  );
}

function ZahlWert({ knoten, wert, onWert }: { knoten: Knoten; wert: number | null; onWert: (w: unknown) => void }) {
  const [text, setText] = useState(zahlFuerEingabe(wert));
  const [ungueltig, setUngueltig] = useState(false);
  return (
    <span className="wert-feld">
      <EinheitEingabe
        einheit={EINHEIT[knoten.typ]}
        vorne={knoten.typ === "chf"}
        aria-label={knoten.label}
        aria-invalid={ungueltig || undefined}
        title={ungueltig ? "Bitte eine gültige Zahl eingeben." : undefined}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = parseZahl(text);
          if (n === undefined || (n !== null && n < 0)) {
            setUngueltig(true);
            return;
          }
          setUngueltig(false);
          setText(zahlFuerEingabe(n));
          if (n !== wert) onWert(n);
        }}
      />
      {ungueltig && <span className="feld-fehler" style={{ display: "block" }}>Ungültige Zahl.</span>}
    </span>
  );
}

function FachplanerWert({ wert, onWert }: { wert: Fachplaner | null; onWert: (w: unknown) => void }) {
  const [fp, setFp] = useState<Fachplaner>(wert ?? { firma: "", kontakt: "" });
  function speichern() {
    const firma = fp.firma.trim();
    const kontakt = fp.kontakt.trim();
    if (firma === (wert?.firma ?? "") && kontakt === (wert?.kontakt ?? "")) return;
    onWert(firma || kontakt ? { firma, kontakt } : null);
  }
  return (
    <span className="fachplaner-felder">
      <input
        type="text"
        placeholder="Name / Firma"
        aria-label="Name / Firma"
        value={fp.firma}
        onChange={(e) => setFp({ ...fp, firma: e.target.value })}
        onBlur={speichern}
      />
      <input
        type="text"
        placeholder="Kontakt"
        aria-label="Kontakt"
        value={fp.kontakt}
        onChange={(e) => setFp({ ...fp, kontakt: e.target.value })}
        onBlur={speichern}
      />
    </span>
  );
}
