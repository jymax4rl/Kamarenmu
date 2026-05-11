import Image from "next/image";
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

const PLACEHOLDER_NEWS = [
  { seed: "soninke-news-1", label: "Latest from the community" },
  { seed: "soninke-news-2", label: "Upcoming gatherings" },
  { seed: "soninke-news-3", label: "Cultural updates" },
];

const PLACEHOLDER_ARTICLES = [
  { seed: "soninke-art-1", label: "Language & Heritage" },
  { seed: "soninke-art-2", label: "Oral Histories" },
];

function PlaceholderNewsCard({ seed, label }: { seed: string; label: string }) {
  return (
    <Link
      href="/news"
      className="group relative flex-shrink-0 w-[240px] block rounded-3xl overflow-hidden aspect-[3/4] shadow-lg shadow-amber-900/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <Image
        src={`https://picsum.photos/seed/${seed}/480/640`}
        alt=""
        fill
        className="object-cover scale-110 blur-sm brightness-75 transition-all duration-500 group-hover:blur-0 group-hover:scale-105"
        sizes="240px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-1">
          Coming soon
        </p>
        <h3 className="font-bold text-white text-sm leading-snug drop-shadow-md">
          {label}
        </h3>
      </div>
    </Link>
  );
}

function PlaceholderArticleCard({ seed, label }: { seed: string; label: string }) {
  return (
    <Link
      href="/articles"
      className="group relative block rounded-3xl overflow-hidden aspect-[5/3] shadow-lg shadow-amber-900/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <Image
        src={`https://picsum.photos/seed/${seed}/800/480`}
        alt=""
        fill
        className="object-cover scale-110 blur-sm brightness-75 transition-all duration-500 group-hover:blur-0 group-hover:scale-105"
        sizes="(max-width: 448px) 100vw, 448px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-1">
          Coming soon
        </p>
        <h3 className="font-bold text-white text-base leading-snug drop-shadow-md">
          {label}
        </h3>
      </div>
    </Link>
  );
}

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

      <section>
        {news.length > 0 ? (
          <NewsHorizontalRow items={news} />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
            {PLACEHOLDER_NEWS.map((p) => (
              <div key={p.seed} className="snap-start">
                <PlaceholderNewsCard seed={p.seed} label={p.label} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        {articles.length > 0 ? (
          <ArticleList articles={articles} />
        ) : (
          <div className="flex flex-col gap-4">
            {PLACEHOLDER_ARTICLES.map((p) => (
              <PlaceholderArticleCard key={p.seed} seed={p.seed} label={p.label} />
            ))}
          </div>
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
