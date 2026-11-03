export function Fortschritt({ prozent, titel }: { prozent: number; titel?: string }) {
  return (
    <div className="fortschritt" title={titel}>
      <div
        className="fortschritt-balken"
        role="progressbar"
        aria-valuenow={prozent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={titel ?? "Fortschritt"}
      >
        <div className="fortschritt-fuellung" style={{ width: `${prozent}%` }} />
      </div>
      <span className="fortschritt-zahl">{prozent} %</span>
    </div>
  );
}
