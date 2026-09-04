"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PremiumRegisterForm } from "@/components/auth/PremiumRegisterForm";
import { HeroDemoVideo } from "@/components/landing/HeroDemoVideo";
import { brand } from "@/config/site";

const beats = [
  {
    title: "Publica",
    line: "Un clip vertical con oferta. Tu audiencia compra sin cambiar de app.",
  },
  {
    title: "Se queda",
    line: "Tras pagar entra a tu academia y comunidad. No se va a Hotmart ni a WhatsApp.",
  },
  {
    title: "Cobras",
    line: "88% para ti con el plan por venta (7% plataforma + 5% invitación). O $25/mes sin comisión por venta.",
  },
];

const proofs = [
  { label: "Del video al curso", value: "1 clic" },
  { label: "Por venta (o $25/mes)", value: "7%" },
  { label: "Hold anti-fraude", value: "14 días" },
  { label: "Registro", value: "Gratis" },
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
          id="registro"
          className="relative isolate min-h-[100svh] overflow-hidden bg-klik-black"
        >
          <HeroDemoVideo />

          <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-6xl items-center gap-10 px-4 pb-16 pt-28 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12 md:pb-24 md:pt-24">
            <div className="flex flex-col justify-center">
              <p className="hero-rise font-display text-[clamp(3.4rem,11vw,7rem)] font-extrabold leading-[0.9] tracking-tight">
                <span className="text-klik-cyan">Q</span>lyk
              </p>

              <h1 className="hero-rise hero-rise-delay-1 mt-5 max-w-xl font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-tight text-balance sm:text-4xl md:text-5xl">
                Del video al pago.
                <span className="block bg-gradient-to-r from-klik-cyan to-klik-green bg-clip-text text-transparent">
                  Sin salir del feed.
                </span>
              </h1>

              <p className="hero-rise hero-rise-delay-2 mt-4 max-w-md text-base leading-7 text-white/70 sm:text-lg">
                Tu cuenta gratis. Publicas, tu audiencia se queda y cobras en el mismo clic.
              </p>

              <p className="hero-rise hero-rise-delay-3 mt-6 text-sm text-white/45">
                ¿Solo quieres comprar?{" "}
                <Link href="/feed" className="font-semibold text-klik-cyan hover:underline">
                  Entra al feed Tienda
                </Link>
              </p>
            </div>

            <div className="hero-rise hero-rise-delay-3 w-full md:justify-self-end md:max-w-md">
              <Suspense fallback={null}>
                <PremiumRegisterForm variant="hero" />
              </Suspense>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 bg-klik-black">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-white/5 md:grid-cols-4">
            {proofs.map((item) => (
              <div key={item.label} className="bg-klik-black px-5 py-8 text-center md:py-10">
                <p className="font-display text-2xl font-extrabold text-klik-green md:text-3xl">{item.value}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/40">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="porque" className="relative border-t border-white/5 bg-klik-black">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(0,240,255,0.08),transparent_40%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:py-28">
            <motion.div {...fade}>
              <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">
                Lo que los gigantes
                <span className="block text-klik-green">te quitan.</span>
              </h2>
            </motion.div>
            <motion.div {...fade} className="space-y-6 text-lg leading-8 text-white/60 md:text-xl">
              <p>
                TikTok te da alcance y te manda a pagar afuera. Hotmart te cobra comisión y te saca del
                contenido. Gumroad vende, pero no retiene audiencia.
              </p>
              <p className="text-white">
                {brand.name} une feed + academia + comunidad + monedero. Tu gente compra y se queda
                contigo.
              </p>
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

        <section id="dinero" className="border-t border-white/5 bg-[radial-gradient(circle_at_80%_20%,rgba(0,255,65,0.08),transparent_45%)]">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <motion.div {...fade} className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Confianza</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
                Cómo llega el dinero.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/60 md:text-lg">
                El comprador transfiere por SPEI con una referencia única y sube comprobante. Cuando
                confirmamos el pago, el acceso se abre y el monedero del creador se actualiza. Hold de 14
                días por si hay reembolso. Luego retiras a tu banco.
              </p>
            </motion.div>
            <motion.ol {...fade} className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                "Transferencia SPEI con referencia QLYK",
                "Confirmación y acceso a la academia",
                "7% por venta o $25/mes · retiro manual",
              ].map((step, index) => (
                <li key={step} className="border-l border-klik-cyan/40 pl-5">
                  <p className="font-display text-sm font-bold text-klik-cyan">0{index + 1}</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{step}</p>
                </li>
              ))}
            </motion.ol>
            <motion.div {...fade} className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black"
              >
                Ver cursos en el feed
              </Link>
              <Link
                href="/legal/terms"
                className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white/80"
              >
                Términos y pagos
              </Link>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
