import type { NewsItem } from "@/types";
import { NewsCard } from "./NewsCard";

export function NewsHorizontalRow({ items }: { items: NewsItem[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
      {items.map((item, i) => (
        <div key={item._id} className="snap-start">
          <NewsCard item={item} index={i} />
        </div>
      ))}
    </div>
  );
}

export function NewsStack({ items }: { items: NewsItem[] }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={item._id} className="w-full">
          <NewsCard item={item} index={i} />
        </div>
      ))}
    </div>
  );
}
