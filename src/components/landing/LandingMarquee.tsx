"use client";

import { useReducedMotion } from "framer-motion";

const ITEMS = [
  "Publica en minutos",
  "Cobra en MXN y USD",
  "Pago por transferencia SPEI",
  "Tu página de creador",
  "Feed y comunidad",
  "Cursos y clips juntos",
  "Retiro desde 24 h",
  "Studio con tu tablero",
  "Instálala en tu teléfono",
  "Empieza sin mensualidad",
];

export function LandingMarquee() {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <section className="border-y px-4 py-5" style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }} aria-label="Beneficios de Qlyk">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2">
          {ITEMS.map((item) => (
            <span key={item} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "var(--l-border)", color: "var(--l-fg)" }}>
              {item}
            </span>
          ))}
        </div>
      </section>
    );
  }

  const track = [...ITEMS, ...ITEMS];

  return (
    <section className="landing-marquee border-y" style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }} aria-label="Beneficios de Qlyk">
      <div className="landing-marquee-track">
        {track.map((item, index) => (
          <span key={`${item}-${index}`} className="landing-marquee-item">
            <span className="text-klik-green" aria-hidden>
              ●
            </span>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
