import Link from "next/link";
import { Suspense } from "react";
import { getArticles } from "@/lib/data";
import { ArticleList, ArticleListSkeleton } from "@/components/articles/ArticleList";

const CATEGORIES = [
  "all",
  "Culture",
  "History",
  "Language",
  "Community",
] as const;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const raw = searchParams.category;
  const category =
    raw && CATEGORIES.includes(raw as (typeof CATEGORIES)[number])
      ? raw === "all"
        ? undefined
        : raw
      : undefined;

  return (
    <div className="space-y-5 pb-4">
      <div className="px-1 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
        <p className="text-sm text-gray-500 mt-1">
          Long reads on Soninke language, history, and living culture.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {CATEGORIES.map((c) => {
          const active =
            (c === "all" && !category) ||
            (c !== "all" && category === c);
          const href =
            c === "all" ? "/articles" : `/articles?category=${encodeURIComponent(c)}`;
          return (
            <Link
              key={c}
              href={href}
              scroll={false}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 border ${
                active
                  ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200/50"
                  : "bg-white text-gray-600 border-amber-100 hover:border-amber-300"
              }`}
            >
              {c === "all" ? "All" : c}
            </Link>
          );
        })}
      </div>

      <Suspense
        key={category ?? "all"}
        fallback={<ArticleListSkeleton />}
      >
        <ArticlesBody category={category} />
      </Suspense>
    </div>
  );
}

async function ArticlesBody({ category }: { category?: string }) {
  const data = await getArticles({ category, limit: 20 });
  const items = data?.items ?? [];

  if (!items.length) {
    return (
      <p className="text-center text-gray-500 py-12 text-sm">
        No articles in this category yet.
      </p>
    );
  }

  return <ArticleList articles={items} />;
}
