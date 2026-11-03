// Beispieldaten: 3 fiktive Projekte. Wird nur ausgeführt, wenn die Datenbank noch leer ist.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Status = "offen" | "erledigt" | "nicht_relevant";
type E = { key: string; status?: Status; datum?: string; notiz?: string; wert?: unknown };

const e = (key: string, status: Status = "erledigt", extra: Omit<E, "key" | "status"> = {}): E => ({ key, status, ...extra });
const w = (key: string, wert: unknown): E => ({ key, wert });

const projekte = [
  {
    projekt: {
      projektnummer: "2024-031",
      projektname: "Einfamilienhaus Rebberg",
      bhName: "Keller",
      bhVorname: "Thomas und Andrea",
      bhAdresse: "Dorfstrasse 12\n8706 Meilen",
      bhTelefon: "079 412 37 85",
      bhMail: "t.keller@example.com",
      parzellenNr: "4127",
      objektadresse: "Im Rebberg 7, 8706 Meilen",
      objektart: "Neubau",
    },
    raeume: [
      ["Wohnen/Essen/Küche", 54.5],
      ["Zimmer Eltern", 16],
      ["Zimmer Kind 1", 12.5],
      ["Zimmer Kind 2", 12.5],
      ["Büro", 10],
      ["Bad", 8.2],
      ["Dusche/WC", 4.6],
      ["Reduit", 3.5],
      ["Keller/Technik", 22],
    ] as [string, number][],
    eintraege: [
      w("eck.bauzone", "W2 – Wohnzone 2 Geschosse"),
      w("eck.vollgeschosse", 2),
      w("eck.grenzabstand_gross", 8),
      w("eck.grenzabstand_klein", 5),
      w("eck.gebaeudehoehe", 7.5),
      w("eck.gesamthoehe", 10.5),
      w("eck.max_laenge", 25),
      w("eck.mlz_ab", 16),
      w("eck.mlz_bemessung", "1/3 der Mehrlänge, max. 4.00 m"),
      w("eck.max_tiefe", 14),
      w("eck.budget", 1250000),
      w("eck.zeitrahmen", { von: "2024-09-01", bis: "2026-12-31" }),
      // Phase Projekt
      e("pr.dossier", "erledigt", { wert: true, datum: "2024-10-14" }),
      e("pr.az_bmz", "erledigt", { wert: "AZ 0.38 (zulässig 0.40)" }),
      e("pr.sia116", "erledigt", { wert: 1180 }),
      e("pr.sia416", "erledigt", { wert: 1045 }),
      e("pr.det_kosten", "erledigt", { wert: true }),
      e("pr.besprechung", "erledigt", { wert: "2024-11-05" }),
      // Phase Bauprojekt
      e("bp.architekturvertrag", "erledigt", { datum: "2024-11-20", notiz: "SIA 102, unterzeichnet" }),
      e("bp.dossier_ueberarbeitet", "erledigt", { wert: true }),
      e("bp.sr_ersatzbeitrag", "erledigt", { notiz: "Ersatzbeitrag gemäss Verfügung Amt für Militär und Bevölkerungsschutz" }),
      e("bp.sr_erstellung", "nicht_relevant"),
      e("bp.fp_energienachweis"),
      e("bp.fp_geologe", "erledigt", { notiz: "Baugrundgutachten liegt vor, Hanglage beachten" }),
      e("bp.fp_schadstoff", "nicht_relevant", { notiz: "Neubau auf unbebauter Parzelle" }),
      e("bp.bg_gn"),
      e("bp.bg_objektschutz", "nicht_relevant"),
      e("bp.bg_sr_ersatzgesuch"),
      e("bp.bg_energienachweis", "erledigt", { wert: true }),
      e("bp.bg_konstruktionsaufbauten"),
      e("bp.bg_schutzraumgesuch", "nicht_relevant"),
      e("bp.bg_bauingenieur", "nicht_relevant"),
      e("bp.bg_architektenplan_50", "nicht_relevant"),
      e("bp.bg_entsorgungskonzept"),
      e("bp.bg_situation"),
      e("bp.bg_situation_beglaubigt", "erledigt", { wert: true, datum: "2025-01-28" }),
      e("bp.bg_grundrisse"),
      e("bp.bg_fassaden"),
      e("bp.bg_kanalisation"),
      e("bp.bg_sickeranlage", "nicht_relevant"),
      e("bp.bg_retentionsanlage"),
      e("bp.bg_umgebungsplan"),
      e("bp.bg_material_farbkonzept"),
      e("bp.bg_baubeschrieb"),
      // Phase Ausführung
      e("af.bauingenieur", "erledigt", { wert: { firma: "Huber + Partner AG, Zürich", kontakt: "M. Huber, 044 271 18 40" } }),
      e("af.vordimensionierung", "erledigt", { wert: true }),
      e("af.bauphysiker", "erledigt", { wert: { firma: "Bauphysik Studer GmbH", kontakt: "info@example.com" } }),
      e("af.heizungsplaner", "offen", { wert: { firma: "Lüthi Haustechnik AG", kontakt: "" } }),
      e("af.baubeschrieb_bkp", "offen", { notiz: "Entwurf BKP 2–4 in Arbeit" }),
      e("af.besprechung_bh", "erledigt", { wert: "2025-09-16" }),
      e("af.ap_grundrisse"),
      e("af.ap_aushub"),
    ],
  },
  {
    projekt: {
      projektnummer: "2025-007",
      projektname: "Umbau Bauernhaus Hinterdorf",
      bhName: "Brunner",
      bhVorname: "Sandra",
      bhAdresse: "Hinterdorf 3\n8494 Bauma",
      bhTelefon: "052 386 14 22",
      bhMail: "sandra.brunner@example.com",
      parzellenNr: "872",
      objektadresse: "Hinterdorf 3, 8494 Bauma",
      objektart: "Umbau",
    },
    raeume: [
      ["Wohnen", 38],
      ["Küche", 14.5],
      ["Zimmer 1", 15],
      ["Zimmer 2", 13],
      ["Bad", 7.5],
      ["Atelier (ehem. Tenn)", 46],
    ] as [string, number][],
    eintraege: [
      w("eck.bauzone", "K – Kernzone Hinterdorf"),
      w("eck.vollgeschosse", 2),
      w("eck.grenzabstand_gross", 7),
      w("eck.grenzabstand_klein", 3.5),
      w("eck.gebaeudehoehe", 7.5),
      w("eck.gesamthoehe", 12),
      w("eck.max_laenge", 30),
      w("eck.max_tiefe", 16),
      w("eck.budget", 680000),
      w("eck.zeitrahmen", { von: "2025-03-01", bis: "2026-10-31" }),
      e("pr.dossier", "erledigt", { wert: true }),
      e("pr.az_bmz", "nicht_relevant", { notiz: "Kernzone: keine AZ, Volumen bleibt bestehen" }),
      e("pr.sia116", "erledigt", { wert: 1620 }),
      e("pr.sia416", "erledigt", { wert: 1495 }),
      e("pr.det_kosten", "erledigt", { wert: true, datum: "2025-05-22" }),
      e("pr.besprechung", "erledigt", { wert: "2025-06-03", notiz: "Denkmalpflege einbeziehen" }),
      e("bp.architekturvertrag", "erledigt", { datum: "2025-06-20" }),
      e("bp.dossier_ueberarbeitet", "erledigt", { wert: true }),
      e("bp.sr_ersatzbeitrag", "nicht_relevant"),
      e("bp.sr_erstellung", "nicht_relevant"),
      e("bp.fp_energienachweis", "erledigt"),
      e("bp.fp_geologe", "nicht_relevant"),
      e("bp.fp_schadstoff", "erledigt", { notiz: "Asbest in Eternitplatten Dach nachgewiesen – Sanierung einplanen" }),
      e("bp.bg_gn", "erledigt"),
      e("bp.bg_objektschutz", "nicht_relevant"),
      e("bp.bg_sr_ersatzgesuch", "nicht_relevant"),
      e("bp.bg_energienachweis", "offen", { wert: false }),
      e("bp.bg_schutzraumgesuch", "nicht_relevant"),
      e("bp.bg_bauingenieur", "nicht_relevant"),
      e("bp.bg_architektenplan_50", "nicht_relevant"),
      e("bp.bg_entsorgungskonzept", "offen", { notiz: "Abhängig von Schadstoffsanierung" }),
      e("bp.bg_situation", "erledigt"),
      e("bp.bg_grundrisse", "erledigt"),
      e("bp.bg_fassaden", "offen"),
      e("bp.bg_material_farbkonzept", "offen", { notiz: "Bemusterung vor Ort mit Denkmalpflege am 18.11." }),
    ],
  },
  {
    projekt: {
      projektnummer: "2025-012",
      projektname: "Anbau MFH Seestrasse",
      bhName: "Wohnbaugenossenschaft Seeblick",
      bhVorname: "",
      bhAdresse: "c/o Verwaltung Meier Immobilien AG\nBahnhofstrasse 21\n8640 Rapperswil",
      bhTelefon: "055 210 44 90",
      bhMail: "verwaltung@example.com",
      parzellenNr: "2315",
      objektadresse: "Seestrasse 48, 8640 Rapperswil",
      objektart: "Anbau",
    },
    raeume: [
      ["Wohnung 2.5 Zi. EG", 62],
      ["Wohnung 2.5 Zi. OG", 62],
      ["Velo-/Kinderwagenraum", 18],
    ] as [string, number][],
    eintraege: [
      w("eck.bauzone", "W3 – Wohnzone 3 Geschosse"),
      w("eck.vollgeschosse", 3),
      w("eck.grenzabstand_gross", 10),
      w("eck.grenzabstand_klein", 5),
      w("eck.gebaeudehoehe", 10.5),
      w("eck.gesamthoehe", 13.5),
      w("eck.max_laenge", 40),
      w("eck.mlz_ab", 20),
      w("eck.mlz_bemessung", "1/4 der Mehrlänge"),
      w("eck.max_tiefe", 16),
      w("eck.budget", 1850000),
      w("eck.zeitrahmen", { von: "2025-10-01", bis: null }),
      e("pr.dossier", "erledigt", { wert: true }),
      e("pr.az_bmz", "offen", { wert: "AZ bestehend 0.62, zulässig 0.70" }),
      e("pr.sia116", "offen"),
    ],
  },
];

async function main() {
  const anzahl = await prisma.projekt.count();
  if (anzahl > 0) {
    console.log(`Datenbank enthält bereits ${anzahl} Projekte – Beispieldaten werden nicht eingefügt.`);
    return;
  }
  for (const { projekt, raeume, eintraege } of projekte) {
    await prisma.projekt.create({
      data: {
        ...projekt,
        raeume: { create: raeume.map(([bezeichnung, flaecheM2], sortierung) => ({ bezeichnung, flaecheM2, sortierung })) },
        eintraege: {
          create: eintraege.map((x) => ({
            itemKey: x.key,
            status: x.status ?? "offen",
            datum: x.datum ?? null,
            notiz: x.notiz ?? null,
            wert: x.wert === undefined ? null : JSON.stringify(x.wert),
          })),
        },
      },
    });
  }
  console.log(`${projekte.length} Beispielprojekte eingefügt.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
