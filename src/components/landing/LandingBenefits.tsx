"use client";

import { LandingReveal } from "@/components/landing/landing-motion";

const BENEFITS = [
  {
    title: "Cobra mientras duermes",
    body: "Tu curso o clip sigue a la venta cuando tú no estás. Quien paga accede, y tu parte llega al monedero.",
    source: "Cursos, catálogo y monedero",
    wide: true,
  },
  {
    title: "Tu audiencia es tuya",
    body: "Tienes página de creador, feed y comunidad para que tu gente te siga aquí, no en un algoritmo prestado.",
    source: "Perfil, feed y comunidad",
  },
  {
    title: "Publica hoy, no en seis meses",
    body: "El Studio te deja armar un curso o un clip y sacarlo en minutos. Menos espera, más obra en el mundo.",
    source: "Studio y Publicar",
  },
  {
    title: "Precios claros en MXN y USD",
    body: "Tus clientes ven el precio en las dos monedas. Tú no tienes que hacer la cuenta a mano.",
    source: "Precios con tipo de cambio de referencia",
  },
  {
    title: "El dinero vuelve a ti",
    body: "A las 24 horas de una venta aprobada puedes pedir el retiro desde tu monedero. Hoy el cobro al comprador es por transferencia SPEI.",
    source: "Monedero y checkout SPEI",
    wide: true,
  },
  {
    title: "Qlyk en tu pantalla de inicio",
    body: "Instálala en el teléfono como una app y entra a publicar o revisar tu cuenta sin buscarla en el navegador.",
    source: "PWA instalable",
  },
  {
    title: "Empiezas sin pagar renta",
    body: "Abrir tu cuenta es gratis y puedes vender sin cuota mensual. Solo cuando vendes, se aplica la comisión de la modalidad que elijas.",
    source: "Registro gratis y plan sin mensualidad",
  },
  {
    title: "Un tablero que te habla claro",
    body: "En el Studio ves tus productos, tus ventas y los siguientes pasos. Sabes cómo vas, sin adivinar.",
    source: "Studio: ingresos, ventas y productos",
  },
];

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
            <LandingReveal key={item.title} delay={index * 0.05} className={item.wide ? "lg:col-span-2" : ""}>
              <article className="landing-bento h-full rounded-3xl border p-6" style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }}>
                <h3 className="font-display text-xl font-extrabold" style={{ color: "var(--l-fg)" }}>
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
