/**
 * Seed script — Soninke linguistic reference data
 * Run with:  npx tsx scripts/seed-linguistic-refs.ts
 *
 * Data sources: Soninke alphabet & pronunciation guides (images provided)
 */

import "dotenv/config";
import mongoose from "mongoose";
import { LinguisticReference } from "../models/LinguisticReference";

const MONGODB_URI = process.env.MONGODB_URI!;

const REFS = [
  // ── Pronunciation rules ──────────────────────────────────────────────────
  {
    category: "rule",
    title: "Voyelles longues — écriture double",
    body: "Les voyelles longues s'écrivent comme doubles voyelles : aa, ee, ii, oo, uu.\n\nExemples de paires minimales :\n• fare (âne) ↔ faare (messager)\n• kara (traverser) ↔ kaara (chez, village d'origine)\n• sere (personne) ↔ seera (apprendre)\n• bire (vivre) ↔ biire (hangar)\n• kine (crocodile) ↔ kiine (mari)\n• gore (ligne de pêche) ↔ goore (enclos)\n• dome (canari) ↔ doome (ensemble)\n• sugu (téter) ↔ suugu (chanter)",
    triggerPatterns: ["aa", "ee", "ii", "oo", "uu"],
    isGlobal: false,
    sortOrder: 1,
  },
  {
    category: "rule",
    title: "Pas de double voyelle en début de mot",
    body: "On n'écrit pas de double voyelle au début d'un mot, même si on la prononce allongée.\n\nExemples :\n• ayi [aayi] → non\n• Isa [iisa] → Issa\n\nException : les interjections avec une voyelle longue (ee !, aa !).",
    triggerPatterns: ["ayi", "isa"],
    isGlobal: false,
    sortOrder: 2,
  },
  {
    category: "rule",
    title: "Pas de double voyelle en fin de mot",
    body: "On n'écrit pas de double voyelle à la fin d'un mot, même si certains locuteurs la prononcent allongée.\n\nExemples :\n• ka [kaa] → maison\n• ta [taa] → pied\n• na [naa] → vache",
    triggerPatterns: [],
    isGlobal: false,
    sortOrder: 3,
  },
  {
    category: "rule",
    title: "Auxiliaire ga — distinction inaccompli / accompli",
    body: "On peut constater une distinction entre l'auxiliaire *ga* prononcé [gaa] quand il est utilisé avec l'inaccompli (pour indiquer que l'action est ou n'était pas encore finie), et le *ga* prononcé [ga] quand il est utilisé avec l'accompli.",
    triggerPatterns: ["ga "],
    isGlobal: false,
    sortOrder: 4,
  },

  // ── Alphabet ─────────────────────────────────────────────────────────────
  {
    category: "alphabet",
    title: "L'alphabet soninké — vue d'ensemble",
    body: "L'alphabet soninké compte 26 lettres :\na, b, c, d, e, f, g, h, i, j, k, l, m, n, ɲ, ŋ, o, p, q, r, s, t, u, w, x, y\n\nLes 5 voyelles : a, e, i, o, u\nLes 21 consonnes : b, c, d, f, g, h, j, k, l, m, n, ɲ, ŋ, p, q, r, s, t, w, x, y",
    triggerPatterns: [],
    isGlobal: true,
    sortOrder: 10,
  },
  {
    category: "alphabet",
    title: "Lettre a — prononciation",
    body: "**a** — Prononciation : *a* — Exemple soninké : *Alla* (Dieu)",
    triggerPatterns: ["a"],
    isGlobal: false,
    sortOrder: 11,
  },
  {
    category: "alphabet",
    title: "Lettre b",
    body: "**b** — Prononciation : *b* — Exemple soninké : *barama* (marmite)",
    triggerPatterns: ["b"],
    isGlobal: false,
    sortOrder: 12,
  },
  {
    category: "alphabet",
    title: "Lettre c",
    body: "**c** — Prononciation : *th, ti, tch* — Exemple soninké : *ceero* (perroquet)",
    triggerPatterns: ["c"],
    isGlobal: false,
    sortOrder: 13,
  },
  {
    category: "alphabet",
    title: "Lettre d",
    body: "**d** — Prononciation : *d* — Exemple soninké : *dala* (mare)",
    triggerPatterns: ["d"],
    isGlobal: false,
    sortOrder: 14,
  },
  {
    category: "alphabet",
    title: "Lettre e",
    body: "**e** — Prononciation : *é* — Exemple soninké : *gesere* (généalogiste)",
    triggerPatterns: ["e"],
    isGlobal: false,
    sortOrder: 15,
  },
  {
    category: "alphabet",
    title: "Lettre f",
    body: "**f** — Prononciation : *f (ou h aspiré)* — Exemple soninké : *fare* (âne)",
    triggerPatterns: ["f"],
    isGlobal: false,
    sortOrder: 16,
  },
  {
    category: "alphabet",
    title: "Lettre g",
    body: "**g** — Prononciation : *g, gu(e), gu(i)* — Exemple soninké : *gede* (puits)",
    triggerPatterns: ["g"],
    isGlobal: false,
    sortOrder: 17,
  },
  {
    category: "alphabet",
    title: "Lettre h",
    body: "**h** — Prononciation : *h aspiré* — Exemple soninké : *hoore* (noble)",
    triggerPatterns: ["h"],
    isGlobal: false,
    sortOrder: 18,
  },
  {
    category: "alphabet",
    title: "Lettre i",
    body: "**i** — Prononciation : *i* — Exemple soninké : *iyo* (oui)",
    triggerPatterns: ["i"],
    isGlobal: false,
    sortOrder: 19,
  },
  {
    category: "alphabet",
    title: "Lettre j",
    body: "**j** — Prononciation : *di, dj* — Exemple soninké : *jaare* (griot)",
    triggerPatterns: ["j"],
    isGlobal: false,
    sortOrder: 20,
  },
  {
    category: "alphabet",
    title: "Lettre k",
    body: "**k** — Prononciation : *k* — Exemple soninké : *ka* (maison)",
    triggerPatterns: ["k"],
    isGlobal: false,
    sortOrder: 21,
  },
  {
    category: "alphabet",
    title: "Lettre l",
    body: "**l** — Prononciation : *l* — Exemple soninké : *labo* (couteau)",
    triggerPatterns: ["l"],
    isGlobal: false,
    sortOrder: 22,
  },
  {
    category: "alphabet",
    title: "Lettre m",
    body: "**m** — Prononciation : *m* — Exemple soninké : *ma* (mère)",
    triggerPatterns: ["m"],
    isGlobal: false,
    sortOrder: 23,
  },
  {
    category: "alphabet",
    title: "Lettre n",
    body: "**n** — Prononciation : *n* — Exemple soninké : *na* (vache)",
    triggerPatterns: ["n"],
    isGlobal: false,
    sortOrder: 24,
  },
  {
    category: "alphabet",
    title: "Lettre ɲ (ny/gn)",
    body: "**ɲ** — Prononciation : *gn, ny* — Exemple soninké : *nogome* (chameau)\n\n*Note : La lettre ɲ est utilisée au Mali et ñ (n tilde) au Sénégal, en Gambie et en Mauritanie.*",
    triggerPatterns: ["ɲ", "ny", "ñ"],
    isGlobal: false,
    sortOrder: 25,
  },
  {
    category: "alphabet",
    title: "Lettre ŋ (ng)",
    body: "**ŋ** — Prononciation : *ng* — Exemple soninké : *fanŋe* (fleuve)",
    triggerPatterns: ["ŋ", "ng"],
    isGlobal: false,
    sortOrder: 26,
  },
  {
    category: "alphabet",
    title: "Lettre o",
    body: "**o** — Prononciation : *o* — Exemple soninké : *orodoome* (bouteille)",
    triggerPatterns: ["o"],
    isGlobal: false,
    sortOrder: 27,
  },
  {
    category: "alphabet",
    title: "Lettre p",
    body: "**p** — Prononciation : *p* — Exemple soninké : *pandi* (pioche)",
    triggerPatterns: ["p"],
    isGlobal: false,
    sortOrder: 28,
  },
  {
    category: "alphabet",
    title: "Lettre q",
    body: "**q** — Prononciation : *q uvulaire (qaaf en arabe)* — Exemple soninké : *samaqe* (serpent)",
    triggerPatterns: ["q"],
    isGlobal: false,
    sortOrder: 29,
  },
  {
    category: "alphabet",
    title: "Lettre r",
    body: "**r** — Prononciation : *r roulé* — Exemple soninké : *renme* (enfant)",
    triggerPatterns: ["r"],
    isGlobal: false,
    sortOrder: 30,
  },
  {
    category: "alphabet",
    title: "Lettre s",
    body: "**s** — Prononciation : *s* — Exemple soninké : *sere* (personne)",
    triggerPatterns: ["s"],
    isGlobal: false,
    sortOrder: 31,
  },
  {
    category: "alphabet",
    title: "Lettre t",
    body: "**t** — Prononciation : *t* — Exemple soninké : *te* (champ)",
    triggerPatterns: ["t"],
    isGlobal: false,
    sortOrder: 32,
  },
  {
    category: "alphabet",
    title: "Lettre u",
    body: "**u** — Prononciation : *ou* — Exemple soninké : *unmu* (Oumou)",
    triggerPatterns: ["u"],
    isGlobal: false,
    sortOrder: 33,
  },
  {
    category: "alphabet",
    title: "Lettre w",
    body: "**w** — Prononciation : *ou, w* — Exemple soninké : *waaga* (l'an prochain)",
    triggerPatterns: ["w"],
    isGlobal: false,
    sortOrder: 34,
  },
  {
    category: "alphabet",
    title: "Lettre x",
    body: "**x** — Prononciation : *kh uvulaire (kha en arabe)* — Exemple soninké : *xaaxo* (hivernage)",
    triggerPatterns: ["x"],
    isGlobal: false,
    sortOrder: 35,
  },
  {
    category: "alphabet",
    title: "Lettre y",
    body: "**y** — Prononciation : *y* — Exemple soninké : *yaaxe* (œil)",
    triggerPatterns: ["y"],
    isGlobal: false,
    sortOrder: 36,
  },

  // ── Vocabulary sets ──────────────────────────────────────────────────────
  {
    category: "vocabulary",
    title: "Les mois en soninké (Sooninkan xasu)",
    body: "1. Sooma — Janvier\n2. Joona — Février\n3. Maari — Mars\n4. Birelli — Avril\n5. Birero — Mai\n6. Jowoye — Juin\n7. Jowoyelli — Juillet\n8. Juxa — Août\n9. Wura — Septembre\n10. Kankuti — Octobre\n11. Nafabire — Novembre\n12. Dagabire — Décembre",
    triggerPatterns: [
      "sooma", "joona", "maari", "birelli", "birero",
      "jowoye", "jowoyelli", "juxa", "wura", "kankuti",
      "nafabire", "dagabire",
      "mois", "month", "janvier", "février", "mars", "january", "february",
    ],
    isGlobal: false,
    sortOrder: 50,
  },
  {
    category: "vocabulary",
    title: "Les saisons lunaires soninké (Silaamin xasu)",
    body: "1. Xasanne  2. Xasanne-xoxone  3. Annabiŋaqe  4. Annabiŋaqe-xoxone\n5. Jimini-fana  6. Jimini-lagare  7. Saaban-fana  8. Saaban-lagare\n9. Sunqaso  10. Minaxaso  11. Naxanqaso  12. Baana (baano)",
    triggerPatterns: [
      "xasanne", "annabiŋaqe", "jimini", "saaban", "sunqaso",
      "minaxaso", "naxanqaso", "baana",
    ],
    isGlobal: false,
    sortOrder: 51,
  },
  {
    category: "vocabulary",
    title: "Les jours de la semaine (Kootanu)",
    body: "1. Tangikoota = sibiti (samedi)\n2. Tunkakoota = alahadi (dimanche)\n3. Tuumakoota = tenenɲe (lundi)\n4. Gangonkoota = taraata (mardi)\n5. Wandekoota = araaba (mercredi)\n6. Xañakoota = alaxamisa (jeudi)\n7. Harinakoota = juma (vendredi)",
    triggerPatterns: [
      "koota", "tangi", "tunka", "tuuma", "gangon", "wande", "xaña", "harina",
      "sibiti", "alahadi", "juma",
      "day", "week", "jour", "semaine",
    ],
    isGlobal: false,
    sortOrder: 52,
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Remove old seed data before re-seeding (idempotent)
  await LinguisticReference.deleteMany({});
  console.log("Cleared existing linguistic references");

  const inserted = await LinguisticReference.insertMany(
    REFS.map((r) => ({ ...r, isActive: true }))
  );
  console.log(`Inserted ${inserted.length} linguistic references`);

  await mongoose.disconnect();
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
