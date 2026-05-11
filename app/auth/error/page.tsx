import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const code = searchParams.error ?? "Configuration";

  return (
    <div className="max-w-sm mx-auto pt-8 pb-12 px-2 text-center space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Sign-in issue</h1>
      <Card className="rounded-3xl p-5 text-sm text-gray-600">
        <p>
          We couldn&apos;t complete authentication{" "}
          <span className="font-mono text-xs text-gray-500">({code})</span>.
        </p>
        <p className="mt-3">
          Check Google OAuth credentials and the authorized redirect URI in
          Google Cloud Console.
        </p>
      </Card>
      <Link
        href="/auth/signin"
        className="inline-flex rounded-full bg-amber-600 text-white px-6 py-3 text-sm font-semibold hover:bg-amber-700 transition"
      >
        Try again
      </Link>
    </div>
  );
}
