"use client";

import { motion, useReducedMotion } from "framer-motion";
import { mockVideos } from "@/data/mock";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { WaitlistForm } from "@/components/landing/WaitlistForm";
import { LogoMark } from "@/components/brand/LogoMark";
import { brand } from "@/config/site";

const steps = [
  {
    n: "01",
    title: "Publica el momento",
    body: "Un video corto. Tu cara. Tu idea. El botón de comprar vive adentro del feed, no escondido en un link de bio.",
    accent: "text-klik-cyan border-klik-cyan/30",
  },
  {
    n: "02",
    title: "Tu gente se queda",
    body: "Quien te sigue entra a tu comunidad y a tu academia. No se evaporan en un algoritmo que no te pertenece.",
    accent: "text-white border-white/15",
  },
  {
    n: "03",
    title: "Cobra en el mismo feed",
    body: "El video vende. El pago entra. Tú recibes. Sin sacar a nadie a otra app ni pedirle que te escriba por fuera.",
    accent: "text-klik-green border-klik-green/30",
  },
];

const contrast = [
  {
    name: "Otras redes",
    points: [
      "Tú creas. Ellos cobran el anuncio.",
      "Tu audiencia no es tuya.",
      "Para vender, te sacan de la app.",
    ],
  },
  {
    name: "KlikHubb",
    highlight: true,
    points: [
      "Tú creas. Tú cobras.",
      "Tu gente se queda en tu comunidad.",
      "Un clic: del video al pago.",
    ],
  },
];

export function LandingPage() {
  const reduce = useReducedMotion();
  const fade = {
    initial: reduce ? false : { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" as const },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div className="bg-grid min-h-[100dvh] bg-klik-black text-white">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-klik-cyan/15 blur-[90px]" />
        <div className="pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-klik-green/10 blur-[100px]" />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-16">
          <div>
            <motion.div {...fade}>
              <LogoMark className="h-20 w-20 drop-shadow-[0_0_22px_rgba(0,240,255,0.45)]" />
            </motion.div>
            <motion.p
              {...fade}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-klik-cyan/30 bg-klik-cyan/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan"
            >
              Nueva red social · las primeras 1.000 cuentas
            </motion.p>
            <motion.h1
              {...fade}
              className="mt-5 font-display text-[2.35rem] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl"
            >
              Tu público. Tu dinero.{" "}
              <span className="bg-gradient-to-r from-klik-cyan to-klik-green bg-clip-text text-transparent">
                Un clic.
              </span>
            </motion.h1>
            <motion.p {...fade} className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
              KlikHubb es la red social donde el video no se queda en likes: vende, enseña y junta a tu
              gente. Publicas, tu audiencia se queda contigo y cobras sin salir del feed.
            </motion.p>
            <motion.p {...fade} className="mt-3 text-sm font-medium text-white/45">
              {brand.slogan}
            </motion.p>
            <motion.div {...fade} className="mt-8">
              <WaitlistForm />
            </motion.div>
            <motion.div {...fade} className="mt-8 grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
              {[
                ["Publica", "Video que se siente vivo"],
                ["Conecta", "Tu gente no se pierde"],
                ["Cobra", "Vendes en el mismo frame"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-display text-lg font-bold text-white md:text-2xl">{k}</p>
                  <p className="mt-1 text-[11px] leading-4 text-white/45">{v}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mx-auto w-full max-w-[300px]"
          >
            <div className="absolute -inset-6 rounded-[2.4rem] bg-gradient-to-b from-klik-cyan/20 to-klik-green/10 blur-2xl" />
            <div className="relative mx-auto h-[560px] w-[280px] rounded-[2.1rem] border border-white/15 bg-neutral-950 p-2 shadow-[0_0_80px_rgba(0,240,255,0.12)]">
              <div className="mb-2 flex items-center justify-center">
                <span className="h-4 w-20 rounded-full bg-white/10" />
              </div>
              <div className="h-[calc(100%-1.5rem)] overflow-hidden rounded-[1.65rem]">
                <VideoPlayer video={mockVideos[0]} variant="preview" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="porque" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <motion.div {...fade}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-klik-cyan">La diferencia</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
            Deja de alquilar tu audiencia
          </h2>
          <p className="mt-3 max-w-2xl text-white/55">
            En las redes de siempre eres contenido. Aquí eres dueño: del feed, de la comunidad y de la
            venta.
          </p>
        </motion.div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {contrast.map((card) => (
            <motion.article
              key={card.name}
              {...fade}
              className={`rounded-2xl border p-7 ${
                card.highlight
                  ? "border-klik-green/30 bg-klik-card"
                  : "border-white/10 bg-black/40 text-white/70"
              }`}
            >
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                  card.highlight ? "text-klik-green" : "text-white/40"
                }`}
              >
                {card.name}
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-6">
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <motion.div {...fade}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-klik-cyan">Así de simple</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">Cómo se siente entrar</h2>
          <p className="mt-3 max-w-2xl text-white/55">
            Scroll. Conexión. Pago. Sin pirámides, sin árboles, sin que nadie te reclute.
          </p>
        </motion.div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article
              key={step.n}
              {...fade}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className={`rounded-2xl border bg-klik-card p-6 ${step.accent}`}
            >
              <p className="font-display text-4xl font-extrabold opacity-80">{step.n}</p>
              <h3 className="mt-4 font-display text-2xl font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/60">{step.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="audiencias" className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
        <motion.div {...fade} className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-klik-green">Quién entra</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
            Si creas o si vienes a pertenecer
          </h2>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-2">
          <motion.article {...fade} className="rounded-2xl border border-klik-cyan/25 bg-klik-card p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-klik-cyan">Creadores</p>
            <h3 className="mt-3 font-display text-2xl font-bold">Tu talento ya no trabaja gratis</h3>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-white/65">
              <li>Publica vertical y vende curso, membresía o producto en el mismo frame.</li>
              <li>Quien compra entra solo a tu comunidad. Tu gente no se pierde.</li>
              <li>Cobras en automático. Sin pedir el pago por fuera.</li>
            </ul>
          </motion.article>
          <motion.article {...fade} className="rounded-2xl border border-klik-green/25 bg-klik-card p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-klik-green">Miembros</p>
            <h3 className="mt-3 font-display text-2xl font-bold">Aprende y compra sin que te recluten</h3>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-white/65">
              <li>Sigue a quien admiras. Entra a su grupo. Toma su academia.</li>
              <li>Si traes a un amigo, también ganas cuando él compra. Un solo gracias.</li>
              <li>Puntos, rachas y un feed que premia estar, no reclutar.</li>
            </ul>
          </motion.article>
        </div>
      </section>

      <section id="lista-espera" className="relative px-4 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,65,0.12),transparent_55%)]" />
        <motion.div
          {...fade}
          className="relative mx-auto max-w-3xl rounded-[2rem] border border-klik-green/30 bg-klik-card px-6 py-12 text-center md:px-12"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-klik-green">Tu lugar</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Los primeros perfiles definen el feed
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/55">
            No es una lista más. Es la puerta a una red social donde tu atención vale dinero — el tuyo.
            Si no pides tu lugar, alguien más ocupa tu espacio.
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <WaitlistForm variant="giant" />
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
