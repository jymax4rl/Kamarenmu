import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { LinguisticReference } from "@/models/LinguisticReference";
import { jsonError, jsonOk, requireAdmin } from "@/lib/api-handlers";
import { toPlain } from "@/lib/serialize";

// Public — fetch all active references (used to enrich dictionary cards)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const filter: Record<string, unknown> = { isActive: true };
    if (category) filter.category = category;

    const items = await LinguisticReference.find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return jsonOk(toPlain(items));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to fetch linguistic references", 500);
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    await connectDB();
    const body = await req.json();
    const created = await LinguisticReference.create(body);
    return jsonOk(toPlain(created.toObject()), 201);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create reference", 400);
  }
}

export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    await connectDB();
    const { id, ...rest } = await req.json();
    if (!id) return jsonError("id is required", 400);
    const updated = await LinguisticReference.findByIdAndUpdate(id, rest, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return jsonError("Reference not found", 404);
    return jsonOk(toPlain(updated));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update reference", 400);
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      try { const b = await req.json(); id = b.id; } catch { /* optional */ }
    }
    if (!id) return jsonError("id is required", 400);
    const deleted = await LinguisticReference.findByIdAndDelete(id).lean();
    if (!deleted) return jsonError("Reference not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete reference", 500);
  }
}
