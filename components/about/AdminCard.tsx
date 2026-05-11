"use client";

import Image from "next/image";
import { useState } from "react";
import type { Administrator } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";

export function AdminCard({ admin }: { admin: Administrator }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        layout
        onClick={() => setOpen(true)}
        className="text-left w-full rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <Card className="p-3 hover:shadow-xl transition-shadow duration-200 cursor-pointer">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-inner">
              <Image
                src={admin.photo}
                alt={admin.fullName}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {admin.fullName}
              </p>
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                <Badge>{admin.role}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">{admin.department}</p>
            </div>
          </div>
        </Card>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm px-3 pb-28"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 28 }}
              className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-24 w-24 rounded-2xl overflow-hidden">
                  <Image
                    src={admin.photo}
                    alt={admin.fullName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">
                    {admin.fullName}
                  </h3>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Badge>{admin.role}</Badge>
                    <Badge tone="muted">{admin.department}</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {admin.biography}
                </p>
                <div className="w-full rounded-2xl bg-amber-50/80 p-3 text-sm space-y-1">
                  <p>
                    <span className="text-gray-500">Email:</span>{" "}
                    <a
                      href={`mailto:${admin.email}`}
                      className="text-amber-700 font-medium"
                    >
                      {admin.email}
                    </a>
                  </p>
                  {admin.phone && (
                    <p>
                      <span className="text-gray-500">Phone:</span>{" "}
                      <a
                        href={`tel:${admin.phone}`}
                        className="text-amber-700 font-medium"
                      >
                        {admin.phone}
                      </a>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-1 w-full rounded-2xl bg-gray-900 text-white py-3 text-sm font-semibold hover:bg-gray-800 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
