import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { jsonError, jsonOk, parsePagination, requireAdmin } from "@/lib/api-handlers";
import { toPlain } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const role = searchParams.get("role");
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;

    const [items, total] = await Promise.all([
      User.find(filter)
        .select("-googleId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return jsonOk({
      items: toPlain(items),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to fetch users", 500);
  }
}

// Admin promotes or demotes a user
export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    await connectDB();
    const { id, role, isActive } = await req.json();
    if (!id) return jsonError("id is required", 400);
    if (role && !["user", "admin"].includes(role)) {
      return jsonError("role must be 'user' or 'admin'", 400);
    }
    const update: Record<string, unknown> = {};
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await User.findByIdAndUpdate(id, update, { new: true })
      .select("-googleId")
      .lean();
    if (!updated) return jsonError("User not found", 404);
    return jsonOk(toPlain(updated));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update user", 400);
  }
}
