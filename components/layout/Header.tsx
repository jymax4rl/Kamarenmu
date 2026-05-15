"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { HiSearch, HiOutlineSearch } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { BsShieldFill } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/articles", label: "Word Lists" },
  { href: "/news", label: "Challenge" },
  { href: "/dictionary", label: "Dictionnaire" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "president";

  return (
    <>
      {/* Minimal top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex justify-center bg-white/80 backdrop-blur-md border-b border-gray-100/60">
        <div className="w-full max-w-md h-14 px-4 flex items-center justify-between">
          {/* Search icon → dictionary */}
          <Link
            href="/dictionary"
            className="flex items-center justify-center h-10 w-10 rounded-full text-gray-500 hover:bg-gray-100 transition"
            aria-label="Search"
          >
            <HiOutlineSearch className="text-xl" />
          </Link>

          {/* App name */}
          <Link href="/" className="text-sm font-black tracking-widest text-gray-800 uppercase">
            Kama Renmu
          </Link>

          {/* Profile / avatar */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="h-9 w-9 rounded-full flex items-center justify-center overflow-hidden bg-[#00BFA5] text-white font-bold text-sm hover:opacity-90 transition"
            aria-label="Menu"
          >
            {status === "authenticated" && session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="h-9 w-9 object-cover" />
            ) : (
              <span>{(session?.user?.name || session?.user?.email || "K").charAt(0).toUpperCase()}</span>
            )}
          </button>
        </div>
      </header>

      {/* Slide-in drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55] bg-black/35 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed top-0 right-0 bottom-0 z-[60] w-[min(88vw,20rem)] bg-white shadow-2xl border-l border-gray-100 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-900">Menu</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full p-2 hover:bg-gray-100 transition"
                >
                  <IoClose className="text-2xl text-gray-600" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {NAV_LINKS.map(({ href, label }) => {
                  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        active ? "bg-[#00BFA5]/10 text-[#00BFA5]" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold transition mt-1 ${
                      pathname.startsWith("/admin")
                        ? "bg-[#00BFA5] text-white"
                        : "bg-[#00BFA5]/10 text-[#00BFA5] hover:bg-[#00BFA5]/20"
                    }`}
                  >
                    <BsShieldFill className="text-base" />
                    Administration
                  </Link>
                )}
              </nav>

              <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/50">
                {status === "authenticated" && session?.user && (
                  <div className="rounded-2xl bg-white border border-gray-100 p-3 flex items-center gap-3">
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#00BFA5] flex items-center justify-center text-white font-bold text-sm">
                        {(session.user.name || session.user.email || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name || "Signed in"}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                    </div>
                  </div>
                )}
                {status === "authenticated" ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/account"
                      className="text-center rounded-2xl bg-[#00BFA5] text-white py-3 text-sm font-semibold hover:opacity-90 transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      Account
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
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
