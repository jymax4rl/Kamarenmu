import Link from "next/link";
import {
  getArticles,
  getCurrentPresident,
  getNews,
} from "@/lib/data";
import { PresidentSpotlight } from "@/components/president/PresidentCard";
import { NewsHorizontalRow } from "@/components/news/NewsList";
import { ArticleList } from "@/components/articles/ArticleList";
import { Card } from "@/components/ui/Card";
import { CtaBanner } from "@/components/home/CtaBanner";

export const dynamic = "force-dynamic";

async function StatsStrip({
  articleTotal,
  newsTotal,
}: {
  articleTotal: number;
  newsTotal: number;
}) {
  const stats = [
    { label: "Members", value: "500+" },
    { label: "Articles", value: String(articleTotal || "—") },
    { label: "Events", value: String(Math.max(3, Math.floor(newsTotal / 2))) },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="text-center py-4 px-2 rounded-2xl">
          <p className="text-xl font-bold text-amber-700">{s.value}</p>
          <p className="text-xs text-gray-500 mt-1">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const [president, newsData, articlesData] = await Promise.all([
    getCurrentPresident(),
    getNews({ limit: 12 }),
    getArticles({ limit: 3 }),
  ]);

  const news = newsData?.items ?? [];
  const articles = articlesData?.items ?? [];

  return (
    <div className="space-y-8 pb-4">
      <section className="pt-2 space-y-2">
        <p className="text-sm text-gray-600 leading-relaxed">
          O ra xa Kunyi, Kama Renmu.
        </p>
      </section>

      {president && (
        <section>
          <PresidentSpotlight president={president} />
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-gray-900">Latest News</h2>
          <Link
            href="/news"
            className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition"
          >
            See all
          </Link>
        </div>
        {news.length > 0 ? (
          <NewsHorizontalRow items={news} />
        ) : (
          <Card className="text-sm text-gray-500 text-center py-8">
            News will appear here once published.
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-gray-900">Recent Articles</h2>
          <Link
            href="/articles"
            className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition"
          >
            Browse
          </Link>
        </div>
        {articles.length > 0 ? (
          <ArticleList articles={articles} />
        ) : (
          <Card className="text-sm text-gray-500 text-center py-8">
            Articles coming soon.
          </Card>
        )}
      </section>

      <StatsStrip
        articleTotal={articlesData?.pagination.total ?? 0}
        newsTotal={newsData?.pagination.total ?? 0}
      />

      <CtaBanner />
    </div>
  );
}
