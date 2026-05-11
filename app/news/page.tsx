import Link from "next/link";
import { getNews } from "@/lib/data";
import { NewsStack } from "@/components/news/NewsList";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default async function NewsPage() {
  const data = await getNews({ limit: 30 });
  const items = data?.items ?? [];
  const breaking = items.filter((n) => n.isBreaking);
  const regular = items.filter((n) => !n.isBreaking);

  return (
    <div className="space-y-5 pb-4">
      <div className="px-1 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">News</h1>
        <p className="text-sm text-gray-500 mt-1">
          Announcements, gatherings, and timely updates from the community.
        </p>
      </div>

      {breaking.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-red-700 uppercase tracking-wide px-1">
            Breaking
          </h2>
          <div className="space-y-3">
            {breaking.map((n) => (
              <Link key={n._id} href={`/news/${n.slug}`} className="block">
                <Card className="p-0 overflow-hidden border-red-100 bg-gradient-to-br from-red-50 to-white shadow-red-100/40 hover:shadow-lg transition-shadow active:scale-[0.99]">
                  <div className="px-4 py-3 flex items-start gap-3">
                    <Badge tone="breaking">Breaking</Badge>
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-snug">
                        {n.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {n.excerpt}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 px-1">
          All updates
        </h2>
        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-sm">
            No news published yet.
          </p>
        ) : regular.length > 0 ? (
          <NewsStack items={regular} />
        ) : (
          <p className="text-sm text-gray-500 px-1 py-4">
            Additional briefings will appear here alongside breaking alerts.
          </p>
        )}
      </section>
    </div>
  );
}
