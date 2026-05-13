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
    <div className="relative space-y-4 pb-4 pt-2">
      {/* Ambient blobs — give the glass cards depth to blur against */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-orange-200/15 blur-3xl" />
        <div className="absolute bottom-32 right-0 h-72 w-72 rounded-full bg-yellow-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-amber-100/25 blur-2xl" />
      </div>

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
