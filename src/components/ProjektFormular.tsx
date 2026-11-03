"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { projektSpeichern } from "@/lib/actions";
import { EINHEIT, formatFlaeche, parseZahl } from "@/lib/format";
import { OBJEKTARTEN, type Abschnitt, type Datumsbereich, type Fachplaner, type Knoten } from "@/lib/struktur";
import type { Fehler, FormWert, ProjektFormDaten } from "@/lib/validierung";
import { DatumFeld, EinheitEingabe, JaNeinAuswahl } from "./Felder";

type Modus = "neu" | "bearbeiten" | "duplizieren";

const KNOPF_TEXT: Record<Modus, string> = {
  neu: "Projekt erfassen",
  bearbeiten: "Änderungen speichern",
  duplizieren: "Kopie erstellen",
};

export function ProjektFormular({
  modus,
  initial,
  eckdatenAbschnitte,
  projektId,
  abbrechenHref,
}: {
  modus: Modus;
  initial: ProjektFormDaten;
  eckdatenAbschnitte: Abschnitt[];
  projektId?: string;
  abbrechenHref: string;
}) {
  const router = useRouter();
  const [daten, setDaten] = useState<ProjektFormDaten>(initial);
  const [fehler, setFehler] = useState<Fehler>({});
  const [meldung, setMeldung] = useState<string | null>(null);
  const [speichert, setSpeichert] = useState(false);

  function setze<K extends keyof ProjektFormDaten>(feld: K, wert: ProjektFormDaten[K]) {
    setDaten((d) => ({ ...d, [feld]: wert }));
  }

  function setzeEck(key: string, wert: FormWert) {
    setDaten((d) => ({ ...d, eckdaten: { ...d.eckdaten, [key]: wert } }));
  }

  function setzeRaum(i: number, feld: "bezeichnung" | "flaeche", wert: string) {
    setDaten((d) => ({ ...d, raeume: d.raeume.map((r, j) => (j === i ? { ...r, [feld]: wert } : r)) }));
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setSpeichert(true);
    setMeldung(null);
    const r = await projektSpeichern(daten, modus === "bearbeiten" ? projektId : undefined);
    if (r.ok) {
      router.push(`/projekte/${r.id}`);
      router.refresh();
      return;
    }
    setSpeichert(false);
    setFehler(r.fehler);
    setMeldung(r.meldung);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const textFeld = (
    feld: Exclude<keyof ProjektFormDaten, "raeume" | "eckdaten">,
    label: string,
    opts: { typ?: string; pflicht?: boolean; breit?: boolean; platzhalter?: string; mehrzeilig?: boolean } = {},
  ) => (
    <div className={`feld${opts.breit ? " breit" : ""}`}>
      <label htmlFor={feld}>
        {label}
        {opts.pflicht && <span className="pflicht"> *</span>}
      </label>
      {opts.mehrzeilig ? (
        <textarea
          id={feld}
          rows={2}
          value={daten[feld]}
          placeholder={opts.platzhalter}
          onChange={(e) => setze(feld, e.target.value)}
        />
      ) : (
        <input
          id={feld}
          type={opts.typ ?? "text"}
          value={daten[feld]}
          placeholder={opts.platzhalter}
          aria-invalid={fehler[feld] ? true : undefined}
          onChange={(e) => setze(feld, e.target.value)}
        />
      )}
      {fehler[feld] && <div className="feld-fehler">{fehler[feld]}</div>}
    </div>
  );

  const flaechenSumme = daten.raeume.reduce((s, r) => s + (parseZahl(r.flaeche) ?? 0), 0);

  return (
    <form className="formular" onSubmit={absenden} noValidate>
      {meldung && <div className="formular-fehler" role="alert">{meldung}</div>}

      <fieldset>
        <legend>Stammdaten</legend>
        <div className="feld-raster">
          {textFeld("projektnummer", "Projektnummer", { pflicht: true, platzhalter: "z. B. 2026-014" })}
          {textFeld("projektname", "Projektname")}
          {textFeld("parzellenNr", "Parzellen Nr.")}
          <div className="feld">
            <label htmlFor="objektart">Objektart</label>
            <select
              id="objektart"
              value={daten.objektart}
              aria-invalid={fehler.objektart ? true : undefined}
              onChange={(e) => setze("objektart", e.target.value)}
            >
              <option value="">– bitte wählen –</option>
              {OBJEKTARTEN.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {fehler.objektart && <div className="feld-fehler">{fehler.objektart}</div>}
          </div>
          {textFeld("objektadresse", "Objektadresse", { breit: true, platzhalter: "Strasse Nr., PLZ Ort" })}
        </div>

        <h3 className="untertitel-klein">Bauherrschaft</h3>
        <div className="feld-raster">
          {textFeld("bhName", "Name")}
          {textFeld("bhVorname", "Vorname")}
          {textFeld("bhAdresse", "Adresse", { breit: true, mehrzeilig: true })}
          {textFeld("bhTelefon", "Telefon", { typ: "tel" })}
          {textFeld("bhMail", "Mail", { typ: "email" })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Raumprogramm</legend>
        <div>
          {daten.raeume.length === 0 && <p className="leise">Noch keine Räume erfasst.</p>}
          {daten.raeume.map((r, i) => (
            <div className="raum-zeile" key={i}>
              <div>
                <input
                  type="text"
                  aria-label={`Bezeichnung Raum ${i + 1}`}
                  placeholder="Bezeichnung, z. B. Wohnen/Essen"
                  value={r.bezeichnung}
                  aria-invalid={fehler[`raeume.${i}.bezeichnung`] ? true : undefined}
                  onChange={(e) => setzeRaum(i, "bezeichnung", e.target.value)}
                />
                {fehler[`raeume.${i}.bezeichnung`] && (
                  <div className="feld-fehler">{fehler[`raeume.${i}.bezeichnung`]}</div>
                )}
              </div>
              <div>
                <EinheitEingabe
                  einheit="m²"
                  aria-label={`Fläche Raum ${i + 1}`}
                  value={r.flaeche}
                  aria-invalid={fehler[`raeume.${i}.flaeche`] ? true : undefined}
                  onChange={(e) => setzeRaum(i, "flaeche", e.target.value)}
                />
                {fehler[`raeume.${i}.flaeche`] && <div className="feld-fehler">{fehler[`raeume.${i}.flaeche`]}</div>}
              </div>
              <button
                type="button"
                className="btn btn-text"
                title="Raum entfernen"
                aria-label={`Raum ${i + 1} entfernen`}
                onClick={() => setze("raeume", daten.raeume.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="raum-summe">
            <button
              type="button"
              className="btn"
              onClick={() => setze("raeume", [...daten.raeume, { bezeichnung: "", flaeche: "" }])}
            >
              + Raum hinzufügen
            </button>
            {daten.raeume.length > 0 && (
              <span>
                <span className="leise">Total </span>
                {formatFlaeche(flaechenSumme)}
              </span>
            )}
          </div>
        </div>
      </fieldset>

      {eckdatenAbschnitte.map((a) => (
        <fieldset key={a.key}>
          <legend>{a.titel}</legend>
          <div>
            {a.knoten.map((k) => (
              <EckFelder key={k.key} knoten={k} werte={daten.eckdaten} fehler={fehler} onChange={setzeEck} />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="formular-aktionen">
        <Link href={abbrechenHref} className="btn">Abbrechen</Link>
        <button type="submit" className="btn btn-primaer" disabled={speichert}>
          {speichert ? "Speichert …" : KNOPF_TEXT[modus]}
        </button>
      </div>
    </form>
  );
}

function EckFelder({
  knoten,
  werte,
  fehler,
  onChange,
}: {
  knoten: Knoten;
  werte: Record<string, FormWert>;
  fehler: Fehler;
  onChange: (key: string, w: FormWert) => void;
}) {
  const id = `eck-${knoten.key}`;
  const wert = werte[knoten.key] ?? null;
  const f = fehler[`eckdaten.${knoten.key}`];

  return (
    <>
      <div className="eck-feld">
        <label htmlFor={id} className="eck-label" style={{ paddingLeft: `${knoten.tiefe * 2.2}em` }}>
          {knoten.nummer && <span className="nr">{knoten.nummer}</span>}
          <span>{knoten.label}</span>
        </label>
        <div>
          <EckEingabe id={id} knoten={knoten} wert={wert} ungueltig={!!f} onChange={(w) => onChange(knoten.key, w)} />
        </div>
        {f && <div className="feld-fehler">{f}</div>}
      </div>
      {knoten.children.map((c) => (
        <EckFelder key={c.key} knoten={c} werte={werte} fehler={fehler} onChange={onChange} />
      ))}
    </>
  );
}

function EckEingabe({
  id,
  knoten,
  wert,
  ungueltig,
  onChange,
}: {
  id: string;
  knoten: Knoten;
  wert: FormWert;
  ungueltig: boolean;
  onChange: (w: FormWert) => void;
}) {
  switch (knoten.typ) {
    case "zahl":
    case "m":
    case "m3":
    case "chf":
      return (
        <EinheitEingabe
          id={id}
          einheit={EINHEIT[knoten.typ]}
          vorne={knoten.typ === "chf"}
          value={typeof wert === "string" ? wert : ""}
          aria-invalid={ungueltig || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "datum":
      return <DatumFeld id={id} wert={typeof wert === "string" ? wert : null} onChange={onChange} />;
    case "datumsbereich": {
      const b = (wert as Datumsbereich | null) ?? { von: null, bis: null };
      return (
        <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <DatumFeld id={id} label="von" wert={b.von} onChange={(von) => onChange({ ...b, von })} />
          <span className="leise">bis</span>
          <DatumFeld label="bis" wert={b.bis} onChange={(bis) => onChange({ ...b, bis })} />
        </span>
      );
    }
    case "janein":
      return <JaNeinAuswahl wert={typeof wert === "boolean" ? wert : null} onChange={onChange} label={knoten.label} />;
    case "fachplaner": {
      const fp = (wert as Fachplaner | null) ?? { firma: "", kontakt: "" };
      return (
        <span className="fachplaner-felder">
          <input id={id} type="text" placeholder="Name / Firma" value={fp.firma} onChange={(e) => onChange({ ...fp, firma: e.target.value })} />
          <input type="text" placeholder="Kontakt" value={fp.kontakt} onChange={(e) => onChange({ ...fp, kontakt: e.target.value })} />
        </span>
      );
    }
    case "checkliste":
      return null;
    default:
      return (
        <input
          id={id}
          type="text"
          value={typeof wert === "string" ? wert : ""}
          aria-invalid={ungueltig || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
