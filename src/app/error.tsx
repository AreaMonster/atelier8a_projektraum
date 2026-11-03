"use client";

export default function Fehler({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="leerzustand">
      <h1>Es ist ein Fehler aufgetreten</h1>
      <p>Die Seite konnte nicht geladen werden. Bitte erneut versuchen.</p>
      <button type="button" className="btn" onClick={reset}>Erneut versuchen</button>
    </div>
  );
}
