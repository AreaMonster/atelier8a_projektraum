-- CreateTable
CREATE TABLE "Projekt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projektnummer" TEXT NOT NULL,
    "projektname" TEXT NOT NULL DEFAULT '',
    "bhName" TEXT NOT NULL DEFAULT '',
    "bhVorname" TEXT NOT NULL DEFAULT '',
    "bhAdresse" TEXT NOT NULL DEFAULT '',
    "bhTelefon" TEXT NOT NULL DEFAULT '',
    "bhMail" TEXT NOT NULL DEFAULT '',
    "parzellenNr" TEXT NOT NULL DEFAULT '',
    "objektadresse" TEXT NOT NULL DEFAULT '',
    "objektart" TEXT NOT NULL DEFAULT '',
    "archiviert" BOOLEAN NOT NULL DEFAULT false,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "geaendertAm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Raum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projektId" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "flaecheM2" REAL,
    "sortierung" INTEGER NOT NULL,
    CONSTRAINT "Raum_projektId_fkey" FOREIGN KEY ("projektId") REFERENCES "Projekt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Eintrag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projektId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offen',
    "datum" TEXT,
    "notiz" TEXT,
    "wert" TEXT,
    CONSTRAINT "Eintrag_projektId_fkey" FOREIGN KEY ("projektId") REFERENCES "Projekt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Projekt_projektnummer_key" ON "Projekt"("projektnummer");

-- CreateIndex
CREATE UNIQUE INDEX "Eintrag_projektId_itemKey_key" ON "Eintrag"("projektId", "itemKey");
