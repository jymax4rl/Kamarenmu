"use client";

import Image from "next/image";
import Link from "next/link";
import type { President } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export function PresidentSpotlight({ president }: { president: President }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={president.photo}
            alt={president.fullName}
            fill
            className="object-cover rounded-3xl"
            sizes="(max-width: 448px) 100vw, 448px"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent rounded-b-3xl p-4 pt-16">
            <p className="text-xs font-semibold text-amber-200 uppercase tracking-wider">
              Current President
            </p>
            <h2 className="text-xl font-bold text-white mt-1">
              {president.fullName}
            </h2>
          </div>
        </div>
        <div className="p-4 flex justify-center">
          <Link href="/about">
            <Button pill className="px-8">
              View Profile
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
