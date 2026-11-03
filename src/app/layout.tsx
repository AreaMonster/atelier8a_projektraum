import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource/fira-sans-condensed/300.css";
import "@fontsource/fira-sans-condensed/400.css";
import "@fontsource/fira-sans-condensed/500.css";
import { Logo } from "@/components/Logo";
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
            <Link href="/" className="logo" aria-label="Projektraum – zur Projektliste">
              <Logo />
            </Link>
            <nav className="navigation" aria-label="Hauptnavigation">
              <Link href="/">Projekte</Link>
              <Link href="/projekte/neu">Neues Projekt</Link>
            </nav>
          </div>
        </header>
        <main className="inhalt">{children}</main>
      </body>
    </html>
  );
}
