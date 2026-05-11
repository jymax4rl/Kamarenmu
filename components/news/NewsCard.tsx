"use client";

import Image from "next/image";
import Link from "next/link";
import type { NewsItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { motion } from "framer-motion";

export function NewsCard({
  item,
  index = 0,
}: {
  item: NewsItem;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="flex-shrink-0 w-[240px]"
    >
      <Link
        href={`/news/${item.slug}`}
        className="group relative block rounded-3xl overflow-hidden aspect-[3/4] shadow-lg shadow-amber-900/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99]"
      >
        {/* Blurred background image */}
        <Image
          src={item.coverImage}
          alt=""
          fill
          className="object-cover scale-110 blur-sm brightness-75 transition-all duration-500 group-hover:blur-0 group-hover:scale-105"
          sizes="240px"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            {item.isBreaking && <Badge tone="breaking">Breaking</Badge>}
            <Badge tone="muted">{item.category}</Badge>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-white text-sm leading-snug line-clamp-3 drop-shadow-md">
              {item.title}
            </h3>
            <p className="text-[11px] text-white/65 line-clamp-2">{item.excerpt}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
