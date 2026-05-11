"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiFillHome, AiOutlineHome } from "react-icons/ai";
import {
  BsFileText,
  BsFileTextFill,
  BsNewspaper,
  BsInfoCircle,
  BsInfoCircleFill,
  BsPerson,
  BsPersonFill,
  BsBook,
  BsBookFill,
} from "react-icons/bs";

const tabs = [
  { href: "/", label: "Home", IconOutline: AiOutlineHome, IconFill: AiFillHome },
  {
    href: "/articles",
    label: "Articles",
    IconOutline: BsFileText,
    IconFill: BsFileTextFill,
  },
  { href: "/dictionary", label: "Dict.", IconOutline: BsBook, IconFill: BsBookFill },
  { href: "/news", label: "News", IconOutline: BsNewspaper, IconFill: BsNewspaper },
  {
    href: "/about",
    label: "About",
    IconOutline: BsInfoCircle,
    IconFill: BsInfoCircleFill,
  },
  {
    href: "/account",
    label: "Account",
    IconOutline: BsPerson,
    IconFill: BsPersonFill,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-md h-16 px-1 sm:px-3 bg-white/90 backdrop-blur-md rounded-t-3xl shadow-nav flex items-center justify-between gap-0 border-t border-amber-100/80"
        aria-label="Main navigation"
      >
        {tabs.map(({ href, label, IconOutline, IconFill }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          const Icon = active ? IconFill : IconOutline;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 text-[10px] sm:text-xs font-medium transition-colors duration-200 min-w-0 flex-1 ${
                active ? "text-amber-600" : "text-gray-400 hover:text-amber-500/80"
              }`}
            >
              <span className="relative flex flex-col items-center">
                <Icon className="text-lg sm:text-xl" aria-hidden />
                {active && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-amber-600" />
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
