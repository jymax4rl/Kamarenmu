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
 * Returns a 401/403 NextResponse if the request is not from an authenticated
 * admin, or null if the caller may proceed.
 *
 * Admin = any signed-in user when ADMIN_EMAIL is unset;
 *       = the specific email in ADMIN_EMAIL when it is set.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return jsonError("Unauthorized", 401);
  }
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (adminEmail && session.user.email !== adminEmail) {
    return jsonError("Forbidden", 403);
  }
  return null;
}
