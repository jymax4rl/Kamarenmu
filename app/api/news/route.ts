import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { News } from "@/models/News";
import { jsonError, jsonOk, parsePagination, requireAdmin } from "@/lib/api-handlers";
import { toPlain } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (slug) {
      const doc = await News.findOne({ slug, isPublished: true }).lean();
      if (!doc) return jsonError("News not found", 404);
      return jsonOk(toPlain(doc));
    }

    if (id) {
      const doc = await News.findById(id).lean();
      if (!doc) return jsonError("News not found", 404);
      return jsonOk(toPlain(doc));
    }

    const { page, limit, skip } = parsePagination(searchParams);
    const category = searchParams.get("category");
    const filter: Record<string, unknown> = { isPublished: true };
    if (category && category !== "all") {
      filter.category = category;
    }

    const [items, total] = await Promise.all([
      News.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
      News.countDocuments(filter),
    ]);

    return jsonOk({
      items: toPlain(items),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to fetch news", 500);
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    await connectDB();
    const body = await req.json();
    const created = await News.create(body);
    return jsonOk(toPlain(created.toObject()), 201);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create news", 400);
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
    const updated = await News.findByIdAndUpdate(id, rest, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return jsonError("News not found", 404);
    return jsonOk(toPlain(updated));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update news", 400);
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
    const deleted = await News.findByIdAndDelete(id).lean();
    if (!deleted) return jsonError("News not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete news", 500);
  }
}
