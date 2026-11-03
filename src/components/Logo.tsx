import fs from "node:fs";
import path from "node:path";

/** Uses public/logo.png when present, otherwise a typographic version of the atelier 8A logo. */
export function Logo() {
  const hatBild = fs.existsSync(path.join(process.cwd(), "public", "logo.png"));
  if (hatBild) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/logo.png" alt="atelier 8A – Architektur & Bauleitung" />;
  }
  return (
    <>
      <span className="logo-box" aria-hidden="true">
        <span className="logo-oben">atelier</span>
        <span className="logo-unten">8A</span>
      </span>
      <span className="logo-text">
        <span className="logo-zeile1">Architektur &amp; Bauleitung</span>
        <span className="logo-zeile2">Fritschi | Kostezer | Wirz</span>
      </span>
      <span className="visually-hidden">atelier 8A – Architektur &amp; Bauleitung</span>
    </>
  );
}
