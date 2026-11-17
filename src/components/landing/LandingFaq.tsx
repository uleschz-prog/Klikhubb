"use client";

import {
  CREATOR_FLAT_PRICE_USD,
  CREATOR_PLAN_FLAT,
  CREATOR_PLAN_PAYG,
} from "@/config/compensation-plan";
import { LandingReveal } from "@/components/landing/landing-motion";

const PAYG_PERCENT = Math.round(CREATOR_PLAN_PAYG.creatorRate * 100);
const FLAT_PERCENT = Math.round(CREATOR_PLAN_FLAT.creatorRate * 100);
const FEE_PERCENT = Math.round(CREATOR_PLAN_PAYG.platformFeeRate * 100);

const FAQS = [
  {
    q: "¿Cuánto me quedo de cada venta?",
    a: `Sin mensualidad te quedas el ${PAYG_PERCENT}% de cada venta aprobada (Qlyk se queda el ${FEE_PERCENT}%). Con el ${CREATOR_PLAN_FLAT.label.toLowerCase()} de $${CREATOR_FLAT_PRICE_USD} USD te quedas el ${FLAT_PERCENT}% mientras el periodo esté activo. Cada venta usa la modalidad que tengas en ese momento.`,
  },
  {
    q: "¿Tengo que pagar para abrir mi cuenta?",
    a: "No. Crear tu cuenta es gratis y no pedimos tarjeta para registrarte. Puedes publicar y vender con la modalidad sin mensualidad desde el primer día.",
  },
  {
    q: "¿Cómo pagan quienes compran?",
    a: "Hoy el pago es por transferencia SPEI: la persona transfiere, sube su comprobante y Qlyk confirma el pago para abrir el acceso al curso o al contenido.",
  },
  {
    q: "¿Cuándo puedo retirar lo que vendí?",
    a: "Puedes pedir el retiro desde tu monedero después de 24 horas, que es la misma ventana en la que el comprador puede solicitar una devolución. Qlyk procesa el retiro a tu cuenta.",
  },
  {
    q: "¿Qué puedo vender?",
    a: "Cursos y clips de video. Los publicas desde el Studio o desde Publicar, y se pueden ver en el catálogo, el feed y tu página de creador.",
  },
  {
    q: "¿Funciona en el teléfono?",
    a: "Sí. Qlyk es una web que puedes instalar en la pantalla de inicio y usar como una app (PWA), para publicar o revisar tu cuenta desde el celular.",
  },
  {
    q: "¿En qué monedas se muestran los precios?",
    a: "Los precios se muestran en MXN y USD. El tipo de cambio es de referencia, para que quien compra vea una cifra clara en las dos monedas.",
  },
];

export function LandingFaq() {
  return (
    <section className="px-4 py-16 sm:py-20" style={{ background: "var(--l-bg)" }} aria-labelledby="faq-title">
      <div className="mx-auto max-w-3xl">
        <LandingReveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-klik-green">Antes de dar el paso</p>
          <h2 id="faq-title" className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl" style={{ color: "var(--l-fg)" }}>
            Preguntas reales, respuestas claras
          </h2>
        </LandingReveal>

        <div className="mt-8 divide-y rounded-3xl border px-5" style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }}>
          {FAQS.map((item) => (
            <details key={item.q} className="landing-faq group py-1">
              <summary className="cursor-pointer list-none py-4 font-display text-base font-bold outline-none transition hover:text-klik-green focus-visible:text-klik-green" style={{ color: "var(--l-fg)" }}>
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="landing-faq-icon text-klik-green" aria-hidden>
                    +
                  </span>
                </span>
              </summary>
              <p className="pb-4 text-sm leading-6" style={{ color: "var(--l-muted)" }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
