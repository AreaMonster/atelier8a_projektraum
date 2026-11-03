"use client";

export function DruckKnopf() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span className="klein leise">Im Druckdialog «Als PDF speichern» wählen, um ein PDF zu erstellen.</span>
      <button type="button" className="btn btn-primaer" onClick={() => window.print()}>
        Drucken / PDF
      </button>
    </div>
  );
}
