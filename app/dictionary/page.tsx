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

  try {
    await connectDB();
    const [entryDocs, refDocs] = await Promise.all([
      DictionaryEntry.find({ status: { $in: ["approved", "flagged"] } })
        .sort({ soninke: 1 })
        .limit(200)
        .lean(),
      LinguisticReference.find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean(),
    ]);
    entries = toPlain(entryDocs) as DictionaryEntryType[];
    linguisticRefs = toPlain(refDocs) as LinguisticReferenceType[];
  } catch {
    // DB unavailable — render empty state gracefully
  }

  return (
    <div className="space-y-4 pb-4 pt-2">
      <div className="px-1">
        <h1 className="text-2xl font-bold text-gray-900">Dictionnaire</h1>
        <p className="text-sm text-gray-500 mt-1">
          Soninké → Anglais. Contribuez, explorez, préservez la langue.
        </p>
      </div>

      <DictionaryClient initialEntries={entries} linguisticRefs={linguisticRefs} />
    </div>
  );
}
