"use client";

import { LandingReveal } from "@/components/landing/landing-motion";

const BENEFITS = [
  {
    title: "Cobra mientras duermes",
    body: "Tu curso o clip sigue a la venta cuando tú no estás. Quien paga accede, y tu parte llega al monedero.",
    source: "Cursos, catálogo y monedero",
    icon: "moon",
    wide: true,
  },
  {
    title: "Tu audiencia es tuya",
    body: "Tienes página de creador, feed y comunidad para que tu gente te siga aquí, no en un algoritmo prestado.",
    source: "Perfil, feed y comunidad",
    icon: "people",
  },
  {
    title: "Publica hoy, no en seis meses",
    body: "El Studio te deja armar un curso o un clip y sacarlo en minutos. Menos espera, más obra en el mundo.",
    source: "Studio y Publicar",
    icon: "bolt",
  },
  {
    title: "Precios claros en MXN y USD",
    body: "Tus clientes ven el precio en las dos monedas. Tú no tienes que hacer la cuenta a mano.",
    source: "Precios con tipo de cambio de referencia",
    icon: "coins",
  },
  {
    title: "El dinero vuelve a ti",
    body: "A las 24 horas de una venta aprobada puedes pedir el retiro desde tu monedero. Hoy el cobro al comprador es por transferencia SPEI.",
    source: "Monedero y checkout SPEI",
    icon: "wallet",
    wide: true,
  },
  {
    title: "Qlyk en tu pantalla de inicio",
    body: "Instálala en el teléfono como una app y entra a publicar o revisar tu cuenta sin buscarla en el navegador.",
    source: "PWA instalable",
    icon: "phone",
  },
  {
    title: "Empiezas sin pagar renta",
    body: "Abrir tu cuenta es gratis y puedes vender sin cuota mensual. Solo cuando vendes, se aplica la comisión de la modalidad que elijas.",
    source: "Registro gratis y plan sin mensualidad",
    icon: "gift",
  },
  {
    title: "Un tablero que te habla claro",
    body: "En el Studio ves tus productos, tus ventas y los siguientes pasos. Sabes cómo vas, sin adivinar.",
    source: "Studio: ingresos, ventas y productos",
    icon: "chart",
  },
] as const;

const ICON_PATHS: Record<(typeof BENEFITS)[number]["icon"], string> = {
  moon: "M14 3.5A7.5 7.5 0 1 0 20.5 14 6 6 0 0 1 14 3.5Z",
  people: "M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8.5 0a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 17.5 11ZM4 19v-1a4 4 0 0 1 8 0v1M15 18v-1a3.8 3.8 0 0 1 2.5-3.6",
  bolt: "M13 2 4 14h7l-1 8 10-13h-7l0-7Z",
  coins: "M8 8a6 6 0 1 0 0 8h8a6 6 0 1 0 0-8H8Zm0 0a6 6 0 0 1 0 8",
  wallet: "M4 7h16v12H4V7Zm16 5h-4a1.5 1.5 0 0 0 0 3h4M4 7l2.2-3h11.6L20 7",
  phone: "M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 16h4",
  gift: "M4 10h16v10H4V10Zm0 0V8h16v2M12 8V20M12 8c0-3-2-4-4-4S6 6.5 8 8m4 0c0-3 2-4 4-4s2 2.5 0 4",
  chart: "M4 19h16M6 16v-4m5 4V7m5 9v-6",
};

function BenefitIcon({ name }: { name: (typeof BENEFITS)[number]["icon"] }) {
  return (
    <span className="benefit-icon" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d={ICON_PATHS[name]} />
      </svg>
    </span>
  );
}

export function LandingBenefits() {
  return (
    <section className="px-4 py-16 sm:py-20" style={{ background: "var(--l-bg)" }} aria-labelledby="beneficios-title">
      <div className="mx-auto max-w-6xl">
        <LandingReveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-klik-green">Lo que sí puedes vivir aquí</p>
          <h2 id="beneficios-title" className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl" style={{ color: "var(--l-fg)" }}>
            Libertad para crear. Orden para cobrar.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--l-muted)" }}>
            Cada bloque es algo que Qlyk ya hace. Nada de promesas que el producto no cumple.
          </p>
        </LandingReveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((item, index) => (
            <LandingReveal key={item.title} delay={index * 0.05} className={"wide" in item && item.wide ? "lg:col-span-2" : ""}>
              <article className="landing-bento h-full rounded-3xl border p-6" style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }}>
                <BenefitIcon name={item.icon} />
                <h3 className="mt-4 font-display text-xl font-extrabold" style={{ color: "var(--l-fg)" }}>
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--l-muted)" }}>
                  {item.body}
                </p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-klik-green">{item.source}</p>
              </article>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
