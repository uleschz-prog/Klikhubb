"use client";

import Link from "next/link";
import {
  CREATOR_FLAT_PRICE_USD,
  CREATOR_PLAN_FLAT,
  CREATOR_PLAN_PAYG,
  flatBreakEvenMonthlySalesUsd,
} from "@/config/compensation-plan";
import { CountUp, LandingReveal, Magnetic } from "@/components/landing/landing-motion";

const PAYG_PERCENT = Math.round(CREATOR_PLAN_PAYG.creatorRate * 100);
const FLAT_PERCENT = Math.round(CREATOR_PLAN_FLAT.creatorRate * 100);
const FEE_PERCENT = Math.round(CREATOR_PLAN_PAYG.platformFeeRate * 100);
const BREAK_EVEN = flatBreakEvenMonthlySalesUsd();

export function LandingPlanCompare() {
  return (
    <section className="px-4 py-16 sm:py-20" style={{ background: "var(--l-bg)" }} aria-labelledby="planes-creador-title" id="planes">
      <div className="mx-auto max-w-6xl">
        <LandingReveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-klik-green">Modalidades</p>
          <h2 id="planes-creador-title" className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl" style={{ color: "var(--l-fg)" }}>
            Elige cómo te cobra Qlyk
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--l-muted)" }}>
            Empiezas sin cuota. Si más adelante vendes con frecuencia, el {CREATOR_PLAN_FLAT.label.toLowerCase()} puede
            convenirte. El cambio se hace en tu cuenta; cada venta usa la modalidad activa en ese momento.
          </p>
        </LandingReveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <LandingReveal>
            <article className="h-full rounded-3xl border p-6 sm:p-7" style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--l-muted)" }}>
                {CREATOR_PLAN_PAYG.label}
              </p>
              <p className="mt-2 font-serif text-5xl tabular-nums text-klik-green">
                <CountUp to={PAYG_PERCENT} suffix="%" />
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--l-fg)" }}>
                para ti, sin mensualidad
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: "var(--l-muted)" }}>
                Qlyk se queda el {FEE_PERCENT}% solo cuando vendes. Ideal para comenzar y probar sin compromiso de cuota.
              </p>
            </article>
          </LandingReveal>

          <LandingReveal delay={0.08}>
            <article className="landing-bento h-full rounded-3xl border border-klik-green/40 bg-klik-green/8 p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-klik-green">
                {CREATOR_PLAN_FLAT.label} · ${CREATOR_FLAT_PRICE_USD} USD / {CREATOR_PLAN_FLAT.periodDays} días
              </p>
              <p className="mt-2 font-serif text-5xl tabular-nums text-klik-green">
                <CountUp to={FLAT_PERCENT} suffix="%" />
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--l-fg)" }}>
                para ti, con el periodo activo
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: "var(--l-muted)" }}>
                Mientras está activo, Qlyk no cobra comisión por venta. Conviene si vendes más de ~USD{" "}
                {BREAK_EVEN.toLocaleString("es-MX")} al mes.
              </p>
            </article>
          </LandingReveal>
        </div>

        <LandingReveal className="mt-7">
          <Magnetic>
            <Link href="/dashboard#plan" className="btn-primary inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold">
              Ver modalidades en tu cuenta
            </Link>
          </Magnetic>
        </LandingReveal>
      </div>
    </section>
  );
}
