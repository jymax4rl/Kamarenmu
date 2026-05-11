"use client";

import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FcGoogle } from "react-icons/fc";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const oauthError = searchParams.get("error");
  const { status } = useSession();
  const [busy, setBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      window.location.href = callbackUrl;
    }
  }, [status, callbackUrl]);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data: Record<string, unknown>) =>
        setGoogleReady(Boolean(data?.google))
      )
      .catch(() => setGoogleReady(false));
  }, []);

  return (
    <div className="max-w-sm mx-auto space-y-6 pt-4 pb-8">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Join the community</h1>
        <p className="text-sm text-gray-500">
          Create an account or sign in with your Google profile. No separate
          password — Gmail verifies you securely.
        </p>
      </div>

      <Card className="p-6 space-y-5 rounded-3xl">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Display name{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <Input
            name="displayName"
            placeholder="How we should greet you"
            disabled
            className="opacity-70 cursor-not-allowed"
          />
          <p className="text-[11px] text-gray-400">
            Pulled from your Google account after sign-in. Editing coming soon.
          </p>
        </div>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-amber-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-white px-3 text-gray-400 font-semibold">
              Continue with
            </span>
          </div>
        </div>

        {oauthError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            Something went wrong signing in ({oauthError}). Try again or check
            Google OAuth settings.
          </p>
        )}

        {googleReady === false && (
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 leading-relaxed">
            Add{" "}
            <code className="font-mono text-[11px]">GOOGLE_CLIENT_ID</code> and{" "}
            <code className="font-mono text-[11px]">GOOGLE_CLIENT_SECRET</code>{" "}
            to <code className="font-mono text-[11px]">.env.local</code>, then
            restart the dev server.
          </p>
        )}

        <Button
          type="button"
          className="w-full gap-3 bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50"
          disabled={busy || googleReady === false}
          onClick={() => {
            setBusy(true);
            signIn("google", { callbackUrl });
          }}
        >
          <FcGoogle className="text-xl" aria-hidden />
          {busy ? "Redirecting…" : "Continue with Google"}
        </Button>
      </Card>

      <p className="text-center text-xs text-gray-500 px-2">
        By continuing you agree to respectful use of this community space.{" "}
        <Link
          href="/about"
          className="text-amber-700 font-semibold hover:underline"
        >
          About us
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-8 text-center text-sm text-gray-500">Loading…</div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
