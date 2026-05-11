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
      className="flex-shrink-0 w-[260px]"
    >
      <Link
        href={`/news/${item.slug}`}
        className="group block h-full rounded-3xl bg-white shadow-lg shadow-amber-100/50 border border-amber-50 overflow-hidden transition-all duration-200 hover:shadow-xl active:scale-[0.99]"
      >
        <div className="relative aspect-[16/10] w-full">
          <Image
            src={item.coverImage}
            alt=""
            fill
            className="object-cover rounded-2xl"
            sizes="260px"
          />
          {item.isBreaking && (
            <div className="absolute top-2 left-2">
              <Badge tone="breaking">Breaking</Badge>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge tone="muted">{item.category}</Badge>
          </div>
        </div>
        <div className="p-3 space-y-1">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2">{item.excerpt}</p>
        </div>
      </Link>
    </motion.div>
  );
}
