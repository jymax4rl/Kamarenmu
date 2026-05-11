import { ArticleListSkeleton } from "@/components/articles/ArticleList";

export default function Loading() {
  return (
    <div className="space-y-5 pb-4 pt-2">
      <div className="h-8 bg-amber-100 rounded-xl w-40 animate-pulse" />
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-20 rounded-full bg-amber-50 animate-pulse flex-shrink-0"
          />
        ))}
      </div>
      <ArticleListSkeleton />
    </div>
  );
}
