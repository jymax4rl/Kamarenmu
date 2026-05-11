import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminForms } from "./AdminForms";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (adminEmail && session.user.email !== adminEmail) {
    redirect("/");
  }

  return <AdminForms />;
}
