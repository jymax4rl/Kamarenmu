"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { HiOutlineMenuAlt3, HiOutlineSearch } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/articles", label: "Articles" },
  { href: "/news", label: "News" },
  { href: "/dictionary", label: "Dictionnaire" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex justify-center bg-white/90 backdrop-blur-md border-b border-amber-100/90 shadow-sm">
        <div className="w-full max-w-md h-14 px-3 flex items-center gap-2">
          <Link
            href="/"
            className="flex-shrink-0 flex items-center justify-center rounded-2xl p-1.5 min-w-[44px] min-h-[44px] hover:bg-amber-50 active:scale-95 transition"
            aria-label="Kama Renmu Jikke — Home"
          >
            <Image
              src="/images/kama-logo-dark.svg"
              width={34}
              height={32}
              className="h-8 w-auto object-contain"
              alt="Kama Renmu Jikke"
              priority
            />
          </Link>

          <Link
            href="/articles"
            className="flex-1 min-w-0 flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200/80 px-3.5 py-2 text-sm text-gray-500 shadow-inner hover:border-amber-200 hover:bg-amber-50/40 transition active:scale-[0.99]"
          >
            <HiOutlineSearch className="text-lg flex-shrink-0 text-gray-400" aria-hidden />
            <span className="truncate text-left">Articles, news, topics…</span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex-shrink-0 flex items-center justify-center rounded-full h-11 w-11 text-gray-700 hover:bg-gray-100 transition active:scale-95"
            aria-label="Open menu"
          >
            <HiOutlineMenuAlt3 className="text-2xl" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] bg-black/35 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed top-0 right-0 bottom-0 z-[60] w-[min(88vw,20rem)] bg-white shadow-2xl border-l border-amber-100 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-amber-100">
                <span className="text-sm font-bold text-gray-900">Menu</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full p-2 hover:bg-gray-100 transition"
                  aria-label="Close menu"
                >
                  <IoClose className="text-2xl text-gray-600" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {NAV_LINKS.map(({ href, label }) => {
                  const active =
                    href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-amber-50 text-amber-800"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-amber-100 space-y-3 bg-amber-50/40">
                {status === "authenticated" && session?.user && (
                  <div className="rounded-2xl bg-white border border-amber-100 p-3 flex items-center gap-3">
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-900 font-bold text-sm">
                        {(session.user.name || session.user.email || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {session.user.name || "Signed in"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                )}

                {status === "authenticated" ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/account"
                      className="text-center rounded-2xl bg-amber-600 text-white py-3 text-sm font-semibold hover:bg-amber-700 transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      Account
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="block text-center rounded-2xl bg-gray-900 text-white py-3 text-sm font-semibold hover:bg-gray-800 transition"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in with Google
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
