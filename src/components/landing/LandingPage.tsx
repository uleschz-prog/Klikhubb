"use client";

import Link from "next/link";
import type { FeedVideo } from "@/lib/video/types";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingThemeProvider } from "@/components/landing/LandingTheme";
import { LandingVideoCard } from "@/components/landing/LandingVideoCard";
import { brand } from "@/config/site";

export function LandingPage({ videos }: { videos: FeedVideo[] }) {
  return (
    <LandingThemeProvider>
      <LandingNav />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:pt-10">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl" style={{ color: "var(--l-fg)" }}>
            <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.5rem]">
              Mira. Compra. Listo.
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-6 sm:text-base" style={{ color: "var(--l-muted)" }}>
              Videos de la gente. Si te gusta uno, lo puedes llevar.
            </p>
          </div>
          <Link
            href="/feed"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--l-accent)" }}
          >
            Ver todo
          </Link>
        </div>

        {videos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {videos.map((video) => (
              <LandingVideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        <section
          className="mt-14 rounded-3xl border px-5 py-8 text-center sm:mt-16 sm:px-8"
          style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }}
        >
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: "var(--l-fg)" }}>
            ¿Quieres subir el tuyo?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6" style={{ color: "var(--l-muted)" }}>
            Crea tu cuenta gratis y publica en un minuto.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-white"
              style={{ background: "var(--l-accent)" }}
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-medium"
              style={{ borderColor: "var(--l-border)", color: "var(--l-fg)" }}
            >
              Entrar
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8" style={{ borderColor: "var(--l-border)" }}>
        <div
          className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm sm:flex-row"
          style={{ color: "var(--l-muted)" }}
        >
          <p>© {new Date().getFullYear()} {brand.name}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/legal/terms" className="hover:opacity-80">
              Términos
            </Link>
            <Link href="/legal/privacy" className="hover:opacity-80">
              Privacidad
            </Link>
            <Link href="/play" className="hover:opacity-80">
              Videos
            </Link>
          </div>
        </div>
      </footer>
    </LandingThemeProvider>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-3xl border px-6 py-16 text-center"
      style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }}
    >
      <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--l-fg)" }}>
        Aún no hay videos
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6" style={{ color: "var(--l-muted)" }}>
        Sé el primero en publicar algo.
      </p>
      <Link
        href="/register"
        className="mt-6 inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-white"
        style={{ background: "var(--l-accent)" }}
      >
        Crear cuenta
      </Link>
    </div>
  );
}
