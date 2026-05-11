import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-2">
      <Card className="py-8 px-6 max-w-sm w-full">
        <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
          404
        </p>
        <h1 className="text-xl font-bold text-gray-900 mt-2">
          Page not found
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          The story you are looking for may have moved. Try the home feed or
          articles list.
        </p>
        <Link
          href="/"
          className="inline-flex mt-5 rounded-full bg-amber-600 text-white px-6 py-3 text-sm font-semibold hover:bg-amber-700 transition"
        >
          Back home
        </Link>
      </Card>
    </div>
  );
}
