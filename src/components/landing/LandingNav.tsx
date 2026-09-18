"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeProvider";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        borderColor: "var(--l-border)",
        background: "var(--l-nav)",
        color: "var(--l-fg)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16">
        <Logo markClassName="h-8 w-8" />

        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <Link
            href="/feed"
            className="rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-80"
            style={{ color: "var(--l-fg)" }}
          >
            Tienda
          </Link>
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-80"
            style={{ color: "var(--l-fg)" }}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="on-accent rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--l-accent)" }}
          >
            Crear cuenta
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border"
            style={{ borderColor: "var(--l-border)", color: "var(--l-fg)" }}
            aria-expanded={open}
            aria-label="Menú"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="flex flex-col gap-1.5">
              <span className="block h-px w-3.5" style={{ background: "var(--l-fg)" }} />
              <span className="block h-px w-3.5" style={{ background: "var(--l-fg)" }} />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t px-4 py-3 sm:hidden" style={{ borderColor: "var(--l-border)" }}>
          <div className="flex flex-col gap-2">
            <Link
              href="/feed"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ color: "var(--l-fg)", background: "var(--l-surface)" }}
            >
              Tienda
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ color: "var(--l-fg)", background: "var(--l-surface)" }}
            >
              Entrar
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="on-accent rounded-xl px-4 py-3 text-center text-sm font-semibold text-white"
              style={{ background: "var(--l-accent)" }}
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
