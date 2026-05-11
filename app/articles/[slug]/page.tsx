import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { FloatingBack } from "@/components/layout/FloatingBack";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArticleCard } from "@/components/articles/ArticleCard";

type Props = { params: { slug: string } };

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: "Article" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.coverImage }],
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const relatedData = await getArticles({
    category: article.category,
    limit: 8,
  });
  const related =
    relatedData?.items?.filter((a) => a.slug !== article.slug).slice(0, 3) ??
    [];

  return (
    <article className="-mx-4 space-y-6 pb-6">
      <div className="relative w-full aspect-[16/11] overflow-hidden rounded-b-3xl shadow-lg">
        <Image
          src={article.coverImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <FloatingBack href="/articles" />
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <Badge>{article.category}</Badge>
          <Badge tone="muted">{formatDate(article.publishedAt)}</Badge>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {article.title}
        </h1>

        <Card className="flex items-center gap-3 py-3 px-4 rounded-2xl">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
            {article.author.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {article.author}
            </p>
            <p className="text-xs text-gray-500">
              {article.readTime} min read ·{" "}
              {article.tags.slice(0, 3).join(", ")}
            </p>
          </div>
        </Card>

        <div
          className="prose-soninke prose-sm sm:prose-base"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {related.length > 0 && (
          <section className="pt-6 space-y-3 border-t border-amber-100">
            <h2 className="text-lg font-bold text-gray-900">
              Related Articles
            </h2>
            <div className="flex flex-col gap-4">
              {related.map((a, i) => (
                <ArticleCard key={a._id} article={a} index={i} />
              ))}
            </div>
            <Link
              href="/articles"
              className="inline-block text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              View all articles
            </Link>
          </section>
        )}
      </div>
    </article>
  );
}
