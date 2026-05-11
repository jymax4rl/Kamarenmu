"use client";

import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { motion } from "framer-motion";

export function ArticleCard({
  article,
  index = 0,
}: {
  article: Article;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <Link
        href={`/articles/${article.slug}`}
        className="group block rounded-3xl bg-white shadow-lg shadow-amber-100/50 border border-amber-50 overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99]"
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-t-3xl">
          <Image
            src={article.coverImage}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03] rounded-2xl"
            sizes="(max-width: 448px) 100vw, 448px"
          />
          <div className="absolute top-3 left-3">
            <Badge>{article.category}</Badge>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
            {article.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span>{article.author}</span>
            <span>{article.readTime} min read</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
