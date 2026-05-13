import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DictionaryEntry } from "@/models/DictionaryEntry";
import { jsonError, jsonOk, parsePagination, requireAdmin } from "@/lib/api-handlers";
import { toPlain } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();

    if (id) {
      const doc = await DictionaryEntry.findById(id).lean();
      if (!doc) return jsonError("Entry not found", 404);
      return jsonOk(toPlain(doc));
    }

    // Pending/rejected listing requires admin
    if (status && status !== "approved") {
      const authError = await requireAdmin();
      if (authError) return authError;
    }

    const { page, limit, skip } = parsePagination(searchParams);
    // Default public view: approved + flagged (still visible, marked under review)
    const filter: Record<string, unknown> = {
      status: status || { $in: ["approved", "flagged"] },
    };

    if (q) {
      filter.$or = [
        { soninke: { $regex: q, $options: "i" } },
        { english: { $regex: q, $options: "i" } },
        { definition: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      DictionaryEntry.find(filter)
        .sort({ soninke: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DictionaryEntry.countDocuments(filter),
    ]);

    return jsonOk({
      items: toPlain(items),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to fetch dictionary entries", 500);
  }
}

// Public — any visitor can submit a word request (lands as "pending")
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      soninke,
      english,
      french,
      audioUrl,
      phonetic,
      partOfSpeech,
      wordType,
      dialect,
      semanticCategories,
      frequencyLevel,
      definition,
      example,
      submittedBy,
      submittedByEmail,
    } = body;

    if (!soninke?.trim()) {
      return jsonError("soninke field is required", 400);
    }
    if (!english?.trim() && !french?.trim()) {
      return jsonError("At least one translation (english or french) is required", 400);
    }

    const created = await DictionaryEntry.create({
      soninke: soninke.trim(),
      english: english?.trim() || undefined,
      french: french?.trim() || undefined,
      audioUrl: audioUrl?.trim() || undefined,
      phonetic: phonetic?.trim() || undefined,
      partOfSpeech: partOfSpeech?.trim() || undefined,
      wordType: wordType?.trim() || undefined,
      dialect: dialect?.trim() || undefined,
      semanticCategories: Array.isArray(semanticCategories)
        ? semanticCategories.map((c: string) => c.trim()).filter(Boolean)
        : undefined,
      frequencyLevel: frequencyLevel?.trim() || undefined,
      definition: definition?.trim() || undefined,
      example: example?.trim() || undefined,
      submittedBy: submittedBy?.trim() || undefined,
      submittedByEmail: submittedByEmail?.trim() || undefined,
      status: "pending",
    });

    return jsonOk(toPlain(created.toObject()), 201);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to submit dictionary entry", 400);
  }
}

// Admin — approve, reject, or update an entry
export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    await connectDB();
    const body = await req.json();
    const { id, status, kemetRapprochement, validatedBy, ...rest } = body;
    if (!id) return jsonError("id is required", 400);

    const update: Record<string, unknown> = { ...rest };
    if (status) update.status = status;
    if (kemetRapprochement !== undefined) update.kemetRapprochement = kemetRapprochement;
    if (validatedBy) update.validatedBy = validatedBy;
    // Reset vote counters when re-approving a flagged entry
    if (status === "approved") {
      update.downvotes = 0;
      update.upvotes = 0;
    }

    const updated = await DictionaryEntry.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return jsonError("Entry not found", 404);
    return jsonOk(toPlain(updated));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update dictionary entry", 400);
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch { /* optional body */ }
    }
    if (!id) return jsonError("id is required", 400);
    const deleted = await DictionaryEntry.findByIdAndDelete(id).lean();
    if (!deleted) return jsonError("Entry not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete dictionary entry", 500);
  }
}
