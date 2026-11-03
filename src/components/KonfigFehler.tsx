export function KonfigFehler({ meldung }: { meldung: string }) {
  return (
    <div className="konfig-fehler">
      <h2>Die Checklisten-Konfiguration ist fehlerhaft</h2>
      <p>
        <code>{meldung}</code>
      </p>
      <p className="leise">
        Bitte die Datei <code>config/checkliste.json</code> korrigieren und die Seite neu laden.
      </p>
    </div>
  );
}
