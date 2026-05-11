import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { SignOutButton } from "@/components/account/SignOutButton";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/account");
  }

  const u = session.user;

  return (
    <div className="space-y-6 pt-2 pb-10 max-w-sm mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your account</h1>
        <p className="text-sm text-gray-500 mt-1">
          Signed in with Google. Profile details come from your Google account.
        </p>
      </div>

      <Card className="rounded-3xl p-5 flex flex-col items-center text-center gap-3">
        {u.image ? (
          <Image
            src={u.image}
            alt=""
            width={88}
            height={88}
            className="rounded-full object-cover border border-amber-100 shadow-inner"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center text-3xl font-bold text-amber-800 border border-amber-200">
            {(u.name || u.email || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {u.name || "Community member"}
          </p>
          <p className="text-sm text-gray-500 break-all">{u.email}</p>
          {u.id && (
            <p className="text-[11px] text-gray-400 mt-2 font-mono">
              ID: {u.id}
            </p>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        <Link
          href="/"
          className="block text-center rounded-2xl bg-amber-600 text-white py-3 text-sm font-semibold hover:bg-amber-700 transition"
        >
          Back to home
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
