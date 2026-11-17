"use client";

import Link from "next/link";
import { LandingReveal, Magnetic } from "@/components/landing/landing-motion";

export function LandingFinalCta() {
  return (
    <section className="hero-cinematic theme-media relative overflow-hidden px-4 py-16 text-white sm:py-20">
      <div className="hero-aurora" aria-hidden />
      <div className="hero-grain" aria-hidden />
      <LandingReveal className="relative mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-klik-green">Hoy es un buen día</p>
        <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight sm:text-5xl">
          Alguien ya está buscando lo que tú sabes.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/70">
          No esperes a tenerlo todo perfecto. Abre tu cuenta, publica tu primer contenido y deja que
          tu conocimiento empiece a trabajar para ti.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <Link
              href="/register"
              className="cta-shimmer inline-flex min-h-12 items-center rounded-full bg-klik-green px-7 text-sm font-bold text-klik-black shadow-[0_12px_30px_-12px_rgba(48,209,88,0.9)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
            >
              Crea tu cuenta gratis
            </Link>
          </Magnetic>
          <Link
            href="/cursos"
            className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Ver lo que ya se publica
          </Link>
        </div>
      </LandingReveal>
    </section>
  );
}
