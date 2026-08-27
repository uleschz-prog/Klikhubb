"use client";

import { Suspense, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PremiumRegisterForm } from "@/components/auth/PremiumRegisterForm";
import { HeroDemoVideo } from "@/components/landing/HeroDemoVideo";
import { brand } from "@/config/site";

const beats = [
  { title: "Publica", line: "Tu video abre la venta." },
  { title: "Reúne", line: "Tu gente se queda contigo." },
  { title: "Cobra", line: "El pago nace en el feed." },
];

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
        <section
          className="relative isolate min-h-[100svh] overflow-hidden"
          style={{
            backgroundImage: "url(/videos/qlyk-hero-demo.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "70% center",
          }}
        >
          <HeroDemoVideo />

          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:justify-center md:pb-24 md:pt-24">
            <p className="hero-rise font-display text-[clamp(3.4rem,12vw,7.5rem)] font-extrabold leading-[0.9] tracking-tight">
              <span className="text-klik-cyan">Q</span>lyk
            </p>

            <h1 className="hero-rise hero-rise-delay-1 mt-5 max-w-xl font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-tight text-balance sm:text-4xl md:text-5xl">
              Del video al pago.
              <span className="block bg-gradient-to-r from-klik-cyan to-klik-green bg-clip-text text-transparent">
                Sin salir del feed.
              </span>
            </h1>

            <p className="hero-rise hero-rise-delay-2 mt-4 max-w-md text-base leading-7 text-white/65 sm:text-lg">
              Publicas. Tu audiencia se queda. Cobras en el mismo clic.
            </p>

            <div className="hero-rise hero-rise-delay-3 mt-8 max-w-xl">
              <Suspense fallback={null}>
                <PremiumRegisterForm variant="hero" />
              </Suspense>
            </div>
          </div>
        </section>

        <section id="porque" className="relative border-t border-white/5 bg-klik-black">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(0,240,255,0.08),transparent_40%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:py-28">
            <motion.div {...fade}>
              <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">
                Tú creas.
                <span className="block text-klik-green">Tú cobras.</span>
              </h2>
            </motion.div>
            <motion.div {...fade} className="space-y-6 text-lg leading-8 text-white/60 md:text-xl">
              <p>Otras redes alquilan tu atención.</p>
              <p className="text-white">{brand.name} te deja dueño del feed, la academia y la venta.</p>
            </motion.div>
          </div>
        </section>

        <section id="como-funciona" className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <motion.h2
              {...fade}
              className="font-display text-3xl font-extrabold tracking-tight md:text-5xl"
            >
              Tres gestos. Un clic.
            </motion.h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {beats.map((beat, index) => (
                <motion.div
                  key={beat.title}
                  {...fade}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="border-t border-white/10 pt-6"
                >
                  <p className="font-display text-2xl font-bold text-white md:text-3xl">{beat.title}</p>
                  <p className="mt-3 text-sm leading-6 text-white/55 md:text-base">{beat.line}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="registro" className="relative overflow-hidden border-t border-white/5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,65,0.14),transparent_50%)]" />
          <motion.div
            {...fade}
            className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center md:py-32"
          >
            <p className="font-display text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold leading-none tracking-tight">
              <span className="text-klik-cyan">Q</span>lyk
            </p>
            <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Tu cuenta gratis.
            </h2>
            <p className="mt-4 max-w-md text-white/55">Tres campos. Entras al feed. Empiezas a crear.</p>
            <div className="mt-10 w-full">
              <Suspense fallback={null}>
                <PremiumRegisterForm variant="section" />
              </Suspense>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
