"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";

const nav = [
  { href: "#porque", label: "Por qué" },
  { href: "#como-funciona", label: "Cómo" },
  { href: "/feed", label: "Feed" },
];

export function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md ${
        transparent ? "border-white/5 bg-klik-black/35" : "border-white/5 bg-klik-black/80"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="#lista-espera"
            className="rounded-full bg-klik-green px-4 py-2 text-xs font-bold uppercase tracking-wider text-klik-black"
          >
            Quiero mi lugar
          </Link>
        </nav>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white md:hidden"
          aria-expanded={open}
          aria-label="Abrir menú"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Menú</span>
          <span className="flex flex-col gap-1.5">
            <span className="block h-px w-4 bg-white" />
            <span className="block h-px w-4 bg-white" />
          </span>
        </button>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 md:hidden"
          >
            <div className="flex flex-col gap-4 px-4 py-4">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-semibold text-white/80"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="#lista-espera"
                onClick={() => setOpen(false)}
                className="rounded-full bg-klik-green px-4 py-3 text-center text-sm font-bold text-klik-black"
              >
                Quiero mi lugar
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
