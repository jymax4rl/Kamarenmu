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
  const isPrivileged =
    session.user.role === "admin" ||
    session.user.role === "president" ||
    isBootstrap;

  if (!isPrivileged) {
    redirect("/");
  }

  // Only the super-admin (ADMIN_EMAIL) and the president can add/manage team members
  const isTeamManager = isBootstrap || session.user.role === "president";

  return <AdminForms isTeamManager={isTeamManager} />;
}
