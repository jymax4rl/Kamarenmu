import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Administrator } from "@/models/Administrator";
import { jsonError, jsonOk, parsePagination, requireAdmin } from "@/lib/api-handlers";
import { toPlain } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const doc = await Administrator.findById(id).lean();
      if (!doc) return jsonError("Administrator not found", 404);
      return jsonOk(toPlain(doc));
    }

    const { page, limit, skip } = parsePagination(searchParams);
    const filter = {};
    const [items, total] = await Promise.all([
      Administrator.find(filter)
        .sort({ order: 1, fullName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Administrator.countDocuments(filter),
    ]);

    return jsonOk({
      items: toPlain(items),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to fetch administrators", 500);
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    await connectDB();
    const body = await req.json();
    const created = await Administrator.create(body);
    return jsonOk(toPlain(created.toObject()), 201);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create administrator", 400);
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return jsonError("id is required", 400);
    const updated = await Administrator.findByIdAndUpdate(id, rest, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return jsonError("Administrator not found", 404);
    return jsonOk(toPlain(updated));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update administrator", 400);
  }
}

export async function PATCH(req: NextRequest) {
  return PUT(req);
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
      } catch {
        /* optional body */
      }
    }
    if (!id) return jsonError("id is required", 400);
    const deleted = await Administrator.findByIdAndDelete(id).lean();
    if (!deleted) return jsonError("Administrator not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete administrator", 500);
  }
}
