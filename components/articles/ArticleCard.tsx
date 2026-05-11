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
        className="group relative block rounded-3xl overflow-hidden aspect-[5/3] shadow-lg shadow-amber-900/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99]"
      >
        {/* Blurred background image */}
        <Image
          src={article.coverImage}
          alt=""
          fill
          className="object-cover scale-110 blur-sm brightness-75 transition-all duration-500 group-hover:blur-0 group-hover:scale-105"
          sizes="(max-width: 448px) 100vw, 448px"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div>
            <Badge>{article.category}</Badge>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-white text-base leading-snug line-clamp-2 drop-shadow-md">
              {article.title}
            </h3>
            <p className="text-xs text-white/70 line-clamp-1">{article.excerpt}</p>
            <div className="flex items-center justify-between text-[11px] text-white/60 pt-0.5">
              <span>{article.author}</span>
              <span>{article.readTime} min read</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
