"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PremiumRegisterForm } from "@/components/auth/PremiumRegisterForm";
import { HeroDemoVideo } from "@/components/landing/HeroDemoVideo";

export function LandingPage() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fade = {
    initial: reduce || !mounted ? false : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" as const },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div className="min-h-[100dvh] bg-klik-black text-white">
      <Navbar transparent />

      <main>
        <section id="registro" className="relative isolate min-h-[100svh] overflow-hidden bg-klik-black">
          <HeroDemoVideo />

          <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-6xl items-center gap-10 px-4 pb-16 pt-28 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12 md:pb-24 md:pt-24">
            <div className="flex flex-col justify-center">
              <p className="hero-rise font-display text-[clamp(3.4rem,11vw,7rem)] font-extrabold leading-[0.9] tracking-tight">
                <span className="text-klik-cyan">Q</span>lyk
              </p>

              <h1 className="hero-rise hero-rise-delay-1 mt-5 max-w-xl font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-tight text-balance sm:text-4xl md:text-5xl">
                Videos como TikTok.
                <span className="block bg-gradient-to-r from-klik-cyan to-klik-green bg-clip-text text-transparent">
                  Dinero como tu banco.
                </span>
              </h1>

              <p className="hero-rise hero-rise-delay-2 mt-4 max-w-md text-base leading-7 text-white/70 sm:text-lg">
                Desliza clips, compra en un toque y mira tu saldo en Cuenta.
              </p>

              <div className="hero-rise hero-rise-delay-3 mt-6 flex flex-wrap gap-3">
                <Link
                  href="/play"
                  className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black"
                >
                  Abrir Inicio
                </Link>
                <Link
                  href="/feed"
                  className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 text-sm font-bold text-white"
                >
                  Ir a Tienda
                </Link>
              </div>
            </div>

            <div className="hero-rise hero-rise-delay-3 w-full md:justify-self-end md:max-w-md">
              <Suspense fallback={null}>
                <PremiumRegisterForm variant="hero" />
              </Suspense>
            </div>
          </div>
        </section>

        <section id="como" className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-24">
            <motion.h2 {...fade} className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Tres pantallas. Nada más.
            </motion.h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Inicio",
                  line: "Clips verticales. Desliza, like, sigue. Como TikTok.",
                  href: "/play",
                },
                {
                  title: "Tienda",
                  line: "Mismo feed, pero con comprar. Un botón verde y listo.",
                  href: "/feed",
                },
                {
                  title: "Cuenta",
                  line: "Tu saldo, compras y publicar. Como la app de tu banco.",
                  href: "/dashboard",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  {...fade}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="border-t border-white/10 pt-6"
                >
                  <p className="font-display text-2xl font-bold text-white">{item.title}</p>
                  <p className="mt-3 text-sm leading-6 text-white/55">{item.line}</p>
                  <Link href={item.href} className="mt-4 inline-block text-sm font-semibold text-klik-cyan hover:underline">
                    Abrir →
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
