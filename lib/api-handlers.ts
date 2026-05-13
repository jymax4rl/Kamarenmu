import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Returns a 401/403 NextResponse if the caller is not an authenticated admin,
 * or null if the caller may proceed.
 *
 * Admin = session.user.role === 'admin'  (stored in MongoDB + JWT)
 * Bootstrap override: ADMIN_EMAIL env var always grants admin access
 * so the first admin can set themselves without a DB round-trip.
 */
/**
 * Stricter guard — only the bootstrap super-admin (ADMIN_EMAIL) or a user
 * with role "president" may manage team members (administrators, presidents).
 * Regular admins are blocked.
 */
export async function requireTeamManager(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return jsonError("Unauthorized", 401);
  }
  const bootstrapEmail = process.env.ADMIN_EMAIL?.trim();
  const isBootstrap = Boolean(bootstrapEmail && session.user.email === bootstrapEmail);
  const isPresident = session.user.role === "president";
  if (!isBootstrap && !isPresident) {
    return jsonError("Forbidden — seul le président ou le super-admin peut gérer l'équipe", 403);
  }
  return null;
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return jsonError("Unauthorized", 401);
  }
  const bootstrapEmail = process.env.ADMIN_EMAIL?.trim();
  const isBootstrap = Boolean(bootstrapEmail && session.user.email === bootstrapEmail);
  const isAdminRole = session.user.role === "admin";
  if (!isBootstrap && !isAdminRole) {
    return jsonError("Forbidden", 403);
  }
  return null;
}
