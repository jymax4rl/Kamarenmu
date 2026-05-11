import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminForms } from "./AdminForms";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  const bootstrapEmail = process.env.ADMIN_EMAIL?.trim();
  const isBootstrap = Boolean(bootstrapEmail && session.user.email === bootstrapEmail);
  const isAdmin = session.user.role === "admin" || isBootstrap;

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminForms />;
}
