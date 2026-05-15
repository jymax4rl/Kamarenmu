"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiHome, HiSearch, HiCollection, HiLightningBolt, HiPencilAlt,
} from "react-icons/hi";

const TABS = [
  { href: "/",          label: "Home",       Icon: HiHome          },
  { href: "/dictionary", label: "Lookup",    Icon: HiSearch        },
  { href: "/articles",  label: "Word Lists", Icon: HiCollection    },
  { href: "/news",      label: "Challenge",  Icon: HiLightningBolt },
  { href: "/dictionary?post=true", label: "Word Post", Icon: HiPencilAlt },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    const base = href.split("?")[0];
    return base === "/" ? pathname === "/" : pathname.startsWith(base);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md h-[68px] px-3 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-between gap-1">
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-shrink-0 flex items-center justify-center"
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className={`flex items-center gap-1.5 rounded-full transition-colors duration-300 ${
                  active
                    ? "bg-[#00BFA5] text-white px-4 py-2.5"
                    : "text-gray-400 p-2"
                }`}
              >
                <Icon className={active ? "text-lg flex-shrink-0" : "text-2xl"} />
                <AnimatePresence mode="wait">
                  {active && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[11px] font-bold whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
