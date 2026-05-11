import dotenv from "dotenv";
import mongoose from "mongoose";
import { President } from "../models/President";
import { Administrator } from "../models/Administrator";
import { Article } from "../models/Article";
import { News } from "../models/News";

dotenv.config({ path: ".env.local" });
dotenv.config();

const URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/kamarenmujikke";

async function seed() {
  await mongoose.connect(URI);
  const dbName =
    mongoose.connection.db?.databaseName ?? "kamarenmujikke";
  console.log("Connected to MongoDB, database:", dbName);

  await Promise.all([
    President.deleteMany({}),
    Administrator.deleteMany({}),
    Article.deleteMany({}),
    News.deleteMany({}),
  ]);

  await President.insertMany([
    {
      fullName: "Amadou Djiba Kanté",
      photo: "https://picsum.photos/seed/krj-pres-current/800/900",
      biography:
        "Amadou Djiba Kanté is a linguist and community organizer who grew up between Kaedi and Paris. He champions youth-led Soninke literacy circles, mentors diaspora storytellers, and negotiates partnerships with cultural institutions to digitize oral histories without losing their communal warmth.",
      mandateStart: new Date("2023-01-15"),
      isCurrent: true,
      contactEmail: "president@kamarenmu.example.org",
      phone: "+221 77 000 11 22",
      socialLinks: {
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        instagram: "https://instagram.com",
      },
    },
    {
      fullName: "Mariama Sow Diallo",
      photo: "https://picsum.photos/seed/krj-pres-past/800/900",
      biography:
        "Mariama Sow Diallo served two disciplined terms focused on heritage archives and women's cooperatives. Her calm diplomacy expanded membership across West Africa and North America, laying the groundwork for today's digital publications.",
      mandateStart: new Date("2016-06-01"),
      mandateEnd: new Date("2022-12-31"),
      isCurrent: false,
      contactEmail: "archive@kamarenmu.example.org",
      phone: "+223 76 222 33 44",
    },
  ]);

  await Administrator.insertMany([
    {
      fullName: "Ibrahim Minté Coulibaly",
      photo: "https://picsum.photos/seed/krj-admin1/400/400",
      role: "Secretary General",
      department: "Governance",
      biography:
        "Coordinates assemblies, keeps transparent minutes, and ensures bylaws stay aligned with grassroots expectations.",
      email: "secretariat@kamarenmu.example.org",
      phone: "+221 70 111 22 33",
      isActive: true,
      order: 1,
      socialLinks: { twitter: "https://twitter.com" },
    },
    {
      fullName: "Fatoumata Wagué Sy",
      photo: "https://picsum.photos/seed/krj-admin2/400/400",
      role: "Treasurer",
      department: "Finance",
      biography:
        "Oversees ethical budgeting for cultural grants, festivals, and scholarship pools with meticulous reporting.",
      email: "finance@kamarenmu.example.org",
      isActive: true,
      order: 2,
    },
    {
      fullName: "Cheikhna Touré",
      photo: "https://picsum.photos/seed/krj-admin3/400/400",
      role: "Communication Officer",
      department: "Media",
      biography:
        "Shapes multilingual messaging, trains volunteer photographers, and safeguards respectful representation online.",
      email: "media@kamarenmu.example.org",
      phone: "+33 6 44 55 66 77",
      isActive: true,
      order: 3,
      socialLinks: {
        instagram: "https://instagram.com",
        facebook: "https://facebook.com",
      },
    },
    {
      fullName: "Aissata Ganame",
      photo: "https://picsum.photos/seed/krj-admin4/400/400",
      role: "Language Programs Lead",
      department: "Education",
      biography:
        "Designs immersive Soninke weekends for families, pairs elders with teens for mentorship, and curates printable lexicons.",
      email: "education@kamarenmu.example.org",
      isActive: true,
      order: 4,
      socialLinks: { linkedin: "https://linkedin.com" },
    },
  ]);

  const now = new Date();

  await Article.insertMany([
    {
      title: "Soninke greetings as bridges across generations",
      slug: "soninke-greetings-generations",
      excerpt:
        "How everyday salutations carry ethics of respect, humor, and hospitality—and why younger speakers are remixing them thoughtfully.",
      content: `<p>Greetings in Soninke communities do far more than open a conversation. They encode clan courtesy, age awareness, and spiritual goodwill.</p><p>This essay walks through morning exchanges along the Senegal River, showing how migrants adapt phrasing while elders gently coach pronunciation.</p><p>We close with three practical drills families can try around the dinner table.</p>`,
      coverImage: "https://picsum.photos/seed/krj-art1/1200/675",
      author: "Aissata Ganame",
      category: "Language",
      tags: ["language", "family", "oral tradition"],
      isPublished: true,
      publishedAt: new Date(now.getTime() - 86400000 * 2),
      readTime: 6,
    },
    {
      title: "Mapping Soninke trade roads through textile patterns",
      slug: "textile-patterns-trade-roads",
      excerpt:
        "Cloth motifs remembered by aunties often mirror historic caravan stops—an overlooked archive for curious historians.",
      content: `<p>Stripes, diamonds, and indigo gradients preserved in trousseaus quietly narrate journeys between Gadiaga and Saharan hubs.</p><p>We compare photographs from community closets with colonial-era maps, highlighting respectful ways to interpret patterns without flattening living artistry.</p>`,
      coverImage: "https://picsum.photos/seed/krj-art2/1200/675",
      author: "Mariama Sow Diallo",
      category: "History",
      tags: ["history", "textiles", "trade"],
      isPublished: true,
      publishedAt: new Date(now.getTime() - 86400000 * 5),
      readTime: 8,
    },
    {
      title: "Urban kitchens keeping fermented fonio alive",
      slug: "urban-kitchens-fonio",
      excerpt:
        "From Bamako to Montreal, cooks tweak fermentation timers while honoring the patient rhythms taught by grandmothers.",
      content: `<p>Fonio ferments tie nutrition to seasonal humor—rainy months invite tangier starters; dry heat favors mellow blends.</p><p>We interviewed twelve households about jars, cloth covers, and playlist rituals that turn waiting time into storytelling.</p>`,
      coverImage: "https://picsum.photos/seed/krj-art3/1200/675",
      author: "Cheikhna Touré",
      category: "Culture",
      tags: ["food", "migration", "culture"],
      isPublished: true,
      publishedAt: new Date(now.getTime() - 86400000 * 8),
      readTime: 7,
    },
    {
      title: "Teaching tone without shame: classroom notes",
      slug: "teaching-tone-without-shame",
      excerpt:
        "Practical cues for tutors navigating tonal pairs with teens who grew up multilingual—games, beats, and gentle humor.",
      content: `<p>Tone slips trigger giggles; our toolkit converts embarrassment into curiosity using drum taps and selfie videos.</p><p>The lesson plans align with weekend heritage schools from Nouakchott to Ohio.</p>`,
      coverImage: "https://picsum.photos/seed/krj-art4/1200/675",
      author: "Ibrahim Minté Coulibaly",
      category: "Language",
      tags: ["pedagogy", "tone", "youth"],
      isPublished: true,
      publishedAt: new Date(now.getTime() - 86400000 * 11),
      readTime: 5,
    },
    {
      title: "Community arbitration under the palaver tree",
      slug: "palaver-tree-arbitration",
      excerpt:
        "Why mediated disputes still resonate for diaspora associations adapting hybrid Zoom circles with elders on mute unless spoken to.",
      content: `<p>Palaver aesthetics rely on pacing, proverbs, and shared seating. Digital adaptations succeed when facilitators choreograph silence as deliberately as speech.</p><p>We summarize anonymized cases involving festival budgets and youth councils.</p>`,
      coverImage: "https://picsum.photos/seed/krj-art5/1200/675",
      author: "Amadou Djiba Kanté",
      category: "Community",
      tags: ["governance", "diaspora", "justice"],
      isPublished: true,
      publishedAt: new Date(now.getTime() - 86400000 * 14),
      readTime: 9,
    },
    {
      title: "Recording lullabies with consent and care",
      slug: "recording-lullabies-consent",
      excerpt:
        "Ethical field protocols when documenting nighttime songs—warm lighting, compensating singers, and naming collaborators prominently.",
      content: `<p>Lullabies hold intimate cosmologies. This guide covers consent forms in multiple scripts, revenue splits for streaming, and archival redundancy.</p><p>Includes a checklist borrowed from sister communities with gratitude.</p>`,
      coverImage: "https://picsum.photos/seed/krj-art6/1200/675",
      author: "Fatoumata Wagué Sy",
      category: "Culture",
      tags: ["audio", "archives", "ethics"],
      isPublished: true,
      publishedAt: new Date(now.getTime() - 86400000 * 17),
      readTime: 6,
    },
  ]);

  await News.insertMany([
    {
      title: "Annual heritage summit opens registration",
      slug: "heritage-summit-registration",
      excerpt:
        "Three-day hybrid gathering with mentoring labs, youth debates, and an elders' listening lounge opening this autumn.",
      content: `<p>Registration includes subsidized seats for students and simultaneous interpretation in French and English.</p><p>Early registrants receive printable vocabulary packs celebrating river metaphors.</p>`,
      coverImage: "https://picsum.photos/seed/krj-news1/1200/700",
      author: "Communication Office",
      isBreaking: true,
      category: "Announcement",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 3600000 * 5),
    },
    {
      title: "Emergency housing drive for flood-affected families",
      slug: "housing-drive-floods",
      excerpt:
        "Volunteers coordinate transfers to safer districts while documenting needs transparently on our community ledger.",
      content: `<p>Partnerships with regional NGOs unlock modular shelters; donors receive weekly voice notes with updates.</p>`,
      coverImage: "https://picsum.photos/seed/krj-news2/1200/700",
      author: "Secretariat",
      isBreaking: true,
      category: "Announcement",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 3600000 * 9),
    },
    {
      title: "Night market celebrates ajawér poetry duel",
      slug: "night-market-poetry-duel",
      excerpt:
        "Street lamps, kora loops, and spontaneous rhyme battles drew hundreds last Saturday in the Plateau district.",
      content: `<p>Youth finalists paired with mentors will publish annotated transcripts next month.</p>`,
      coverImage: "https://picsum.photos/seed/krj-news3/1200/700",
      author: "Events Desk",
      isBreaking: false,
      category: "Event",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 86400000 * 1),
    },
    {
      title: "Library digitization sprint seeks volunteers",
      slug: "library-digitization-volunteers",
      excerpt:
        "Two-week remote sprint to scan annotated hymnals; training sessions happen nightly in Soninke and French.",
      content: `<p>Volunteers receive stipends for bandwidth and childcare upon request.</p>`,
      coverImage: "https://picsum.photos/seed/krj-news4/1200/700",
      author: "Archive Circle",
      isBreaking: false,
      category: "Announcement",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 86400000 * 3),
    },
    {
      title: "Press release: transparency report published",
      slug: "transparency-report-published",
      excerpt:
        "Annual ledger outlines grants, honoraria, and carbon offsets linked to travel for cultural exchanges.",
      content: `<p>The PDF includes plain-language summaries and QR codes linking to raw spreadsheets.</p>`,
      coverImage: "https://picsum.photos/seed/krj-news5/1200/700",
      author: "Finance Committee",
      isBreaking: false,
      category: "Press Release",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 86400000 * 6),
    },
    {
      title: "Youth caravan arrives for cross-border workshop",
      slug: "youth-caravan-workshop",
      excerpt:
        "Buses from three countries converge for a ten-day intensive blending civic tech with praise poetry traditions.",
      content: `<p>Sessions cover consentful filming, budgeting hackathons, and dawn jogging circles narrated by elders.</p>`,
      coverImage: "https://picsum.photos/seed/krj-news6/1200/700",
      author: "Programs Desk",
      isBreaking: false,
      category: "Event",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 86400000 * 9),
    },
  ]);

  console.log("Seed completed: presidents, administrators, articles, news.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
