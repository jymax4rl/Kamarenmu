"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function CtaBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-6 text-white shadow-xl shadow-amber-300/40"
    >
      <h3 className="text-xl font-bold">Carry the culture forward</h3>
      <p className="text-sm text-amber-50 mt-2 leading-relaxed">
        Meet our leadership, explore our mission, and learn how we preserve
        Soninke voices for the next generation.
      </p>
      <div className="mt-4">
        <Link href="/about">
          <Button
            variant="ghost"
            pill
            className="bg-white text-amber-800 hover:bg-amber-50 border-0 shadow-md"
          >
            Learn About Us
          </Button>
        </Link>
      </div>
    </motion.section>
  );
}
