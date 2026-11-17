"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CREATOR_PLAN_FLAT } from "@/config/compensation-plan";
import { CountUp, Magnetic, useFinePointer } from "@/components/landing/landing-motion";

const WORDS = ["tus cursos", "tus clips", "tu talento"] as const;
const FLAT_PERCENT = Math.round(CREATOR_PLAN_FLAT.creatorRate * 100);

export function LandingHero() {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const [wordIndex, setWordIndex] = useState(0);
  const [spot, setSpot] = useState({ x: 72, y: 28 });

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setWordIndex((index) => (index + 1) % WORDS.length), 2400);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <section
      className="hero-cinematic theme-media relative overflow-hidden text-white"
      onMouseMove={(event) => {
        if (!fine || reduced) return;
        const box = event.currentTarget.getBoundingClientRect();
        setSpot({
          x: ((event.clientX - box.left) / box.width) * 100,
          y: ((event.clientY - box.top) / box.height) * 100,
        });
      }}
    >
      <div className="hero-aurora" aria-hidden />
      <div className="hero-grain" aria-hidden />
      {fine && !reduced ? (
        <div
          className="hero-spotlight"
          aria-hidden
          style={{ "--spot-x": `${spot.x}%`, "--spot-y": `${spot.y}%` } as CSSProperties}
        />
      ) : null}

      <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-4 pb-16 pt-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-center lg:pb-20 lg:pt-28">
        <div className="hero-rise">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
            Qlyk · Para quienes enseñan y cobran
          </p>
          <h1 className="font-serif text-[2.55rem] font-normal leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.55rem]">
            <span className="block">Convierte</span>
            <span className="hero-word-slot block italic text-klik-green">
              {reduced ? (
                <span>tus cursos, clips y tu talento</span>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={WORDS[wordIndex]}
                    className="inline-block"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    aria-live="polite"
                  >
                    {WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              )}
            </span>
            <span className="block">en ingresos.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            Publica lo que ya sabes, reúne a tu gente en tu página y cobra en tu monedero. Empiezas
            gratis, sin pagar mensualidad, y tu contenido sigue trabajando cuando tú no estás.
          </p>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-klik-green/35 bg-klik-green/10 px-4 py-2 text-sm font-semibold text-klik-green">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-klik-green" aria-hidden />
            Hasta el <CountUp to={FLAT_PERCENT} suffix="%" className="tabular-nums" /> de cada venta, para ti
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Magnetic>
              <Link
                href="/register"
                className="cta-shimmer inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black shadow-[0_12px_30px_-12px_rgba(48,209,88,0.9)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Crea tu cuenta gratis
              </Link>
            </Magnetic>
            <Link
              href="/cursos"
              className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Explorar cursos
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <form
            action="/register"
            method="get"
            className="relative z-10 rounded-3xl border border-white/15 bg-[#0b0d0c]/92 p-6 shadow-2xl backdrop-blur-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-klik-green">Tu lugar está listo</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">Empieza en un minuto</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Abre tu cuenta, publica tu primer contenido y deja que tu conocimiento empiece a
              pagarte. No pedimos tarjeta para registrarte.
            </p>
            <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-white/55">
              Tu correo
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="mt-2 min-h-12 w-full rounded-full border border-white/15 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-klik-green"
              />
            </label>
            <button
              type="submit"
              className="cta-shimmer mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-klik-green text-sm font-bold text-klik-black transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
            >
              Quiero ser parte
            </button>
            <p className="mt-3 text-center text-sm text-white/55">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-semibold text-white underline-offset-2 hover:underline">
                Entrar
              </Link>
            </p>
          </form>

          <StudioDeviceMock />
        </div>
      </div>
    </section>
  );
}

function StudioDeviceMock() {
  return (
    <div className="hero-device-float mx-auto hidden w-full max-w-[22rem] lg:ml-auto lg:block" aria-hidden>
      <div className="rounded-[2rem] border border-white/15 bg-black/55 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <span className="text-[10px] font-semibold text-white/45">Qlyk Studio</span>
          <span className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-[#0c0f0d] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Área de creación</p>
          <p className="mt-1 font-display text-lg font-extrabold">Tu tablero</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/40">Ingreso neto</p>
              <p className="mt-1 font-display text-sm font-bold text-klik-green">••••</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/40">Ventas</p>
              <p className="mt-1 font-display text-sm font-bold">Listas</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Tu curso</p>
              <span className="rounded-full bg-klik-green px-2 py-0.5 text-[9px] font-bold text-klik-black">
                Activo
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-klik-green" />
            </div>
            <p className="mt-2 text-[10px] text-white/45">Próximos pasos en un solo lugar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
