import type { Article } from "@/types";
import { ArticleCard } from "./ArticleCard";

export function ArticleList({ articles }: { articles: Article[] }) {
  return (
    <div className="flex flex-col gap-4">
      {articles.map((a, i) => (
        <ArticleCard key={a._id} article={a} index={i} />
      ))}
    </div>
  );
}

export function ArticleListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl bg-white border border-amber-50 overflow-hidden shadow-md animate-pulse"
        >
          <div className="aspect-video bg-amber-100/80" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-amber-100 rounded-xl w-3/4" />
            <div className="h-3 bg-gray-100 rounded-lg w-full" />
            <div className="h-3 bg-gray-100 rounded-lg w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
