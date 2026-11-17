"use client";

import { CountUp, LandingReveal } from "@/components/landing/landing-motion";

const STEPS = [
  {
    n: "01",
    title: "Crea",
    body: "Arma tu perfil y tu primer curso o clip. En minutos tienes algo listo para mostrar, no un proyecto eterno.",
  },
  {
    n: "02",
    title: "Publica",
    body: "Tu contenido vive en el feed, en el catálogo y en tu página de creador. Tu gente te encuentra y se queda cerca.",
  },
  {
    n: "03",
    title: "Cobra",
    body: "Quien compra paga por transferencia SPEI. El importe llega a tu monedero y, a las 24 horas, puedes pedir tu retiro.",
  },
];

export function LandingHowItWorks() {
  return (
    <section className="px-4 py-16 sm:py-20" style={{ background: "var(--l-bg)" }} aria-labelledby="como-funciona-title">
      <div className="mx-auto max-w-6xl">
        <LandingReveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-klik-green">Simple, de verdad</p>
          <h2 id="como-funciona-title" className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl" style={{ color: "var(--l-fg)" }}>
            Cómo funciona
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 sm:text-base" style={{ color: "var(--l-muted)" }}>
            Tres pasos para pasar de una idea en la cabeza a un ingreso en tu monedero.
          </p>
        </LandingReveal>

        <div className="relative mt-10 grid gap-6 md:grid-cols-3">
          <div className="how-connector" aria-hidden />
          {STEPS.map((step, index) => (
            <LandingReveal key={step.n} delay={index * 0.1}>
              <article className="relative rounded-3xl border p-6" style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }}>
                <p className="font-serif text-3xl text-klik-green">{step.n}</p>
                <h3 className="mt-3 font-display text-2xl font-extrabold" style={{ color: "var(--l-fg)" }}>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--l-muted)" }}>
                  {step.n === "03" ? (
                    <>
                      Quien compra paga por transferencia SPEI. El importe llega a tu monedero y, a las{" "}
                      <CountUp to={24} className="font-semibold tabular-nums" /> horas, puedes pedir tu retiro.
                    </>
                  ) : (
                    step.body
                  )}
                </p>
              </article>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
