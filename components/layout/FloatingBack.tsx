"use client";

import Link from "next/link";
import { IoChevronBack } from "react-icons/io5";

export function FloatingBack({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="absolute top-4 left-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg backdrop-blur-md border border-amber-100 hover:bg-white transition active:scale-95"
      aria-label="Go back"
    >
      <IoChevronBack className="text-xl" />
    </Link>
  );
}
