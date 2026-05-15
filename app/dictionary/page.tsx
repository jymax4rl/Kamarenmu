import { connectDB } from "@/lib/mongodb";
import { DictionaryEntry } from "@/models/DictionaryEntry";
import { LinguisticReference } from "@/models/LinguisticReference";
import { toPlain } from "@/lib/serialize";
import { DictionaryClient } from "./DictionaryClient";
import type {
  DictionaryEntry as DictionaryEntryType,
  LinguisticReference as LinguisticReferenceType,
} from "@/types";

export const dynamic = "force-dynamic";

export default async function DictionaryPage() {
  let entries: DictionaryEntryType[] = [];
  let linguisticRefs: LinguisticReferenceType[] = [];
  let featuredEntry: DictionaryEntryType | null = null;

  try {
    await connectDB();
    const [entryDocs, refDocs, featuredDocs] = await Promise.all([
      DictionaryEntry.find({ status: { $in: ["approved", "flagged"] } })
        .sort({ soninke: 1 })
        .limit(200)
        .lean(),
      LinguisticReference.find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean(),
      // Featured = most upvoted approved entry
      DictionaryEntry.find({ status: "approved" })
        .sort({ upvotes: -1, createdAt: -1 })
        .limit(1)
        .lean(),
    ]);
    entries = toPlain(entryDocs) as DictionaryEntryType[];
    linguisticRefs = toPlain(refDocs) as LinguisticReferenceType[];
    featuredEntry = featuredDocs[0]
      ? (toPlain(featuredDocs[0]) as DictionaryEntryType)
      : null;
  } catch {
    // DB unavailable — render empty state gracefully
  }

  return (
    <DictionaryClient
      initialEntries={entries}
      linguisticRefs={linguisticRefs}
      featuredEntry={featuredEntry}
    />
  );
}
