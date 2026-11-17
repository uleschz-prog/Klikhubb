"use client";

import { LandingReveal } from "@/components/landing/landing-motion";

const PEOPLE = [
  { title: "Coaches", body: "Empaca tu método en un curso y síguele hablando a tu gente en el feed." },
  { title: "Maestros", body: "Convierte una clase que ya das en un producto que se puede comprar a cualquier hora." },
  { title: "Creadores", body: "Pasa del like a la venta: publica clips, enlaza tu curso y cobra en el mismo lugar." },
  { title: "Expertos", body: "Si tu cabeza ya resuelve problemas ajenos, aquí puedes cobrarlo con claridad." },
  { title: "Networkers", body: "Comparte lo que sabes, reúne a tu red y deja que ellos compren sin salir de Qlyk." },
];

export function LandingAudience() {
  return (
    <section className="px-4 py-16 sm:py-20" style={{ background: "var(--l-bg)" }} aria-labelledby="para-quien-title">
      <div className="mx-auto max-w-6xl">
        <LandingReveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-klik-green">Si esto te describe, es para ti</p>
          <h2 id="para-quien-title" className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl" style={{ color: "var(--l-fg)" }}>
            Para quién es Qlyk
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--l-muted)" }}>
            No hace falta ser una marca enorme. Hace falta tener algo que enseñar y ganas de cobarlo en serio.
          </p>
        </LandingReveal>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PEOPLE.map((person, index) => (
            <LandingReveal key={person.title} delay={index * 0.06}>
              <article className="landing-bento h-full rounded-3xl border p-5" style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }}>
                <h3 className="font-display text-lg font-extrabold" style={{ color: "var(--l-fg)" }}>
                  {person.title}
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--l-muted)" }}>
                  {person.body}
                </p>
              </article>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
