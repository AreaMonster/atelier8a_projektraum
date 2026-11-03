# Projektraum atelier8A AG

Internes Werkzeug zur Projektverfolgung: Projektliste, Stammdaten, Eckdaten Baureglement und Checklisten für die Phasen Projekt, Bauprojekt und Ausführung – inklusive Druckansicht / PDF.

Technik: Next.js (TypeScript), SQLite-Datenbank über Prisma. Die App läuft auf einem Rechner im Büronetz und wird von Laptops und Tablets im Browser geöffnet.

## Einrichtung (einmalig)

Voraussetzung: [Node.js](https://nodejs.org) ab Version 20 auf dem Server-Rechner.

```bash
npm install
cp .env.example .env
npm run setup
npm run build
```

`npm run setup` legt die Datenbank `prisma/projektraum.db` an und fügt drei Beispielprojekte ein (nur wenn die Datenbank noch leer ist).

## Starten

```bash
npm run start
```

Die App ist danach unter `http://<Name-oder-IP-des-Servers>:3000` erreichbar, auf dem Server selbst unter http://localhost:3000.

- Unter Windows muss die Firewall eingehende Verbindungen auf Port 3000 erlauben (beim ersten Start fragt Windows in der Regel nach).
- Damit die App nach einem Neustart des Servers automatisch läuft, kann `npm run start` z. B. über die Windows-Aufgabenplanung beim Systemstart ausgeführt werden.
- Zum Entwickeln: `npm run dev` (lädt Änderungen am Code sofort neu).

## Bedienung

- **Startseite**: alle Projekte, sortiert nach Projektnummer. Ein Klick auf eine Spaltenüberschrift sortiert um, das Suchfeld filtert über alle Spalten.
- **Neues Projekt erfassen**: Stammdaten, Raumprogramm und Eckdaten Baureglement. Die Projektnummer ist Pflicht und muss eindeutig sein.
- **Projektansicht**: aufklappbare Abschnitte pro Phase mit Fortschrittsbalken. Jeder Punkt hat den Status *offen*, *erledigt* oder *nicht relevant* sowie optional Datum und Notiz. Änderungen werden sofort automatisch gespeichert.
  - Wird bei einem ja/nein-Punkt «ja» oder bei einem Datumspunkt ein Datum erfasst, wird der Status automatisch auf *erledigt* gesetzt (kann zurückgesetzt werden).
  - Überschriften wie «Baugesuch» oder «Fachplaner» haben keinen eigenen Status – er ergibt sich aus den Unterpunkten.
  - Fortschritt = erledigte ÷ relevante Punkte (nicht relevante Punkte zählen nicht).
  - «Aktuelle Phase» ist die erste Phase, die noch nicht vollständig erledigt ist.
- **Bearbeiten**: Stammdaten, Raumprogramm und Eckdaten ändern.
- **Duplizieren**: übernimmt Stammdaten, Raumprogramm und Eckdaten in ein neues Projekt (neue Projektnummer nötig); die Checklisten starten neu.
- **Archivieren**: blendet das Projekt aus der Liste aus («Archivierte anzeigen» blendet es wieder ein). Erst archivierte Projekte können – nach Bestätigung – endgültig gelöscht werden.
- **Druckansicht / PDF**: Projektblatt mit allen Daten; im Druckdialog «Als PDF speichern» wählen.

Datumsangaben werden als TT.MM.JJJJ eingegeben (auch Kurzformen wie `4.11.26`), Zahlen mit Punkt oder Komma, Tausendertrennzeichen ' sind erlaubt.

## Checklisten anpassen

Die gesamte Struktur der Eckdaten und Phasen steht in **`config/checkliste.json`** und kann ohne Programmierung angepasst werden. Änderungen sind nach einem Neuladen der Seite sichtbar.

```json
{ "key": "af.ap_elektro", "label": "Elektropläne 1:50" }
```

- **label** – angezeigter Text, darf jederzeit geändert werden.
- **key** – eindeutige ID. Nie ändern oder wiederverwenden: daran hängen die gespeicherten Daten.
- **typ** – `checkliste` (Standard), `janein`, `text`, `zahl`, `m`, `m3`, `chf`, `datum`, `datumsbereich`, `fachplaner`.
- **children** – Unterpunkte. Die Nummerierung (1., a., i., 1.) wird automatisch aus der Reihenfolge berechnet.
- **gruppe: true** – reine Überschrift, Status ergibt sich aus den Unterpunkten.
- **nummeriert: false** – Punkt ohne Nummer (z. B. Budget).

Neue Punkte erscheinen in allen bestehenden Projekten als *offen*. Entfernte Punkte werden ausgeblendet, ihre Daten bleiben in der Datenbank erhalten. Ist die Datei fehlerhaft (z. B. ein Komma zu viel oder ein doppelter key), zeigt die App eine Fehlermeldung mit der betroffenen Stelle an.

## Erscheinungsbild

Das Design lehnt sich an atelier8a.ch an (Schrift Fira Sans Condensed, lokal eingebunden – kein Internetzugang nötig). Das Logo liegt unter **`public/logo.png`** (Kopfzeile und Druckansicht) und kann dort durch eine neuere oder höher aufgelöste Datei ersetzt werden. Fehlt die Datei, wird das Logo typografisch nachgebildet.

## Datensicherung

Alle Daten liegen in der Datei `prisma/projektraum.db`. Für eine Sicherung genügt es, diese Datei zu kopieren (am besten, während die App gestoppt ist).

> **Hinweis:** Den Projektordner nicht in einem synchronisierten OneDrive-Ordner betreiben – die Synchronisation kann die laufende Datenbank beschädigen. Sicherungskopien der `.db`-Datei dürfen hingegen in OneDrive abgelegt werden.

## Ordnerstruktur

```
config/checkliste.json     Struktur der Eckdaten und Phasen
prisma/schema.prisma       Datenmodell
prisma/seed.ts             Beispielprojekte
src/app/                   Seiten (Liste, Erfassen, Projekt, Bearbeiten, Duplizieren, Druck)
src/components/            Bedienelemente
src/lib/                   Logik: Konfiguration, Fortschritt, Formate, Validierung, Speichern
```
