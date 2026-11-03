import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Projektraum atelier8A AG",
  description: "Interne Projektübersicht der atelier8A AG",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH">
      <body>
        <header className="kopfzeile nicht-drucken">
          <div className="kopfzeile-innen">
            <Link href="/" className="marke">atelier8A AG</Link>
            <span className="marke-zusatz">Projektraum</span>
          </div>
        </header>
        <main className="inhalt">{children}</main>
      </body>
    </html>
  );
}
