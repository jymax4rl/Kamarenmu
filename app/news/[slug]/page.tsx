import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsBySlug } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { FloatingBack } from "@/components/layout/FloatingBack";
import { Badge } from "@/components/ui/Badge";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const news = await getNewsBySlug(params.slug);
  if (!news) return { title: "News" };
  return {
    title: news.title,
    description: news.excerpt,
    openGraph: {
      title: news.title,
      description: news.excerpt,
      images: [{ url: news.coverImage }],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const news = await getNewsBySlug(params.slug);
  if (!news) notFound();

  return (
    <article className="-mx-4 space-y-6 pb-6">
      <div className="relative w-full aspect-[16/11] overflow-hidden rounded-b-3xl shadow-lg">
        <Image
          src={news.coverImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <FloatingBack href="/news" />
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 items-center">
          {news.isBreaking && <Badge tone="breaking">Breaking</Badge>}
          <Badge tone="muted">{news.category}</Badge>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
          Published {formatDate(news.publishedAt)}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {news.title}
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">{news.excerpt}</p>

        <div className="rounded-2xl bg-amber-50/80 border border-amber-100 px-4 py-3 text-sm text-gray-700">
          <span className="text-gray-500">By </span>
          <span className="font-semibold text-gray-900">{news.author}</span>
        </div>

        <div
          className="prose-soninke prose-sm sm:prose-base"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      </div>
    </article>
  );
}
