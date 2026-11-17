import Link from "next/link";
import {
  CREATOR_FLAT_PRICE_USD,
  CREATOR_PLAN_FLAT,
  CREATOR_PLAN_PAYG,
  flatBreakEvenMonthlySalesUsd,
} from "@/config/compensation-plan";

const PAYG_PERCENT = Math.round(CREATOR_PLAN_PAYG.creatorRate * 100);
const FLAT_PERCENT = Math.round(CREATOR_PLAN_FLAT.creatorRate * 100);
const BREAK_EVEN = flatBreakEvenMonthlySalesUsd();

export function LandingPlanCompare() {
  return (
    <section
      className="border-b px-4 py-10 sm:py-12"
      style={{ borderColor: "var(--l-border)", background: "var(--l-bg, var(--app-bg, transparent))" }}
      aria-labelledby="planes-creador-title"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-klik-green">Tú eliges cómo cobrar</p>
          <h2 id="planes-creador-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.75rem]" style={{ color: "var(--l-fg)" }}>
            Hasta el {FLAT_PERCENT}%, con o sin mensualidad
          </h2>
          <p className="mt-2 text-sm leading-6 sm:text-[15px]" style={{ color: "var(--l-muted)" }}>
            El {CREATOR_PLAN_FLAT.label.toLowerCase()} conviene si vendes más de ~USD {BREAK_EVEN.toLocaleString("es-MX")} al mes
            (la cuota de ${CREATOR_FLAT_PRICE_USD} USD se compara con el {Math.round(CREATOR_PLAN_PAYG.platformFeeRate * 100)}% por venta).
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <article
            className="rounded-3xl border p-5 sm:p-6"
            style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--l-muted)" }}>
              {CREATOR_PLAN_PAYG.shortLabel}
            </p>
            <h3 className="mt-1 font-display text-xl font-extrabold" style={{ color: "var(--l-fg)" }}>
              Sin mensualidad {PAYG_PERCENT}%
            </h3>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--l-muted)" }}>
              {CREATOR_PLAN_PAYG.description} Empiezas gratis y solo pagas cuando vendes.
            </p>
          </article>

          <article className="rounded-3xl border border-klik-green/40 bg-klik-green/8 p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-klik-green">
              {CREATOR_PLAN_FLAT.shortLabel}
            </p>
            <h3 className="mt-1 font-display text-xl font-extrabold" style={{ color: "var(--l-fg)" }}>
              {CREATOR_PLAN_FLAT.label} {FLAT_PERCENT}% · ${CREATOR_FLAT_PRICE_USD}/mes
            </h3>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--l-muted)" }}>
              {CREATOR_PLAN_FLAT.description} Conviene si vendes más de ~USD {BREAK_EVEN.toLocaleString("es-MX")} al mes.
            </p>
          </article>
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard#plan"
            className="btn-primary inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold"
          >
            Ver planes en tu cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}
