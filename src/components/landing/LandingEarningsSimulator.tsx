"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CREATOR_FLAT_PRICE_USD,
  CREATOR_PLAN_FLAT,
  CREATOR_PLAN_PAYG,
} from "@/config/compensation-plan";
import {
  ESTIMATE_PRICE_RANGE,
  ESTIMATE_SALES_RANGE,
  clampEstimatePrice,
  estimateMonthlyCreatorShare,
  priceFromUsd,
  priceToUsd,
  type EstimateCurrency,
} from "@/lib/commerce/earnings-estimate";
import { LandingReveal } from "@/components/landing/landing-motion";

function money(amount: number, currency: EstimateCurrency) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function LandingEarningsSimulator({ fxRate }: { fxRate: number }) {
  const [currency, setCurrency] = useState<EstimateCurrency>("USD");
  const [price, setPrice] = useState<number>(ESTIMATE_PRICE_RANGE.USD.defaultValue);
  const [sales, setSales] = useState<number>(ESTIMATE_SALES_RANGE.defaultValue);

  const estimate = useMemo(
    () => estimateMonthlyCreatorShare({ priceAmount: price, currency, salesPerMonth: sales, fx: fxRate }),
    [price, currency, sales, fxRate],
  );

  const barMax = Math.max(1, estimate.payg, estimate.flat, 0);
  const priceRange = ESTIMATE_PRICE_RANGE[currency];

  function switchCurrency(next: EstimateCurrency) {
    if (next === currency) return;
    const usd = priceToUsd(price, currency, fxRate);
    setCurrency(next);
    setPrice(clampEstimatePrice(priceFromUsd(usd, next, fxRate), next));
  }

  return (
    <section id="simulador" className="relative overflow-hidden px-4 py-16 sm:py-20" style={{ background: "var(--l-bg)" }} aria-labelledby="simulador-title">
      <div className="pointer-events-none absolute -right-16 top-8 hidden w-[28rem] opacity-40 lg:block" aria-hidden>
        <Image src="/landing/orb-aurora.webp" alt="" width={1280} height={720} className="h-auto w-full" sizes="28rem" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <LandingReveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-klik-green">Haz las cuentas</p>
          <h2 id="simulador-title" className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl" style={{ color: "var(--l-fg)" }}>
            ¿Cuánto te podrías quedar?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--l-muted)" }}>
            Mueve el precio de tu curso y cuántas ventas imaginas al mes. Es una estimación para comparar
            modalidades, no una promesa de resultados.
          </p>
        </LandingReveal>

        <LandingReveal className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-3xl border p-5 sm:p-6" style={{ borderColor: "var(--l-border)", background: "var(--l-surface)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold" style={{ color: "var(--l-fg)" }}>
                Precio del curso
              </p>
              <div className="flex rounded-full border p-1" style={{ borderColor: "var(--l-border)" }} role="group" aria-label="Moneda">
                {(["USD", "MXN"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => switchCurrency(code)}
                    className={`min-h-9 rounded-full px-3 text-xs font-bold ${
                      currency === code ? "bg-foreground text-background" : "text-foreground/60"
                    }`}
                    aria-pressed={currency === code}
                  >
                    {code}
                    {code === "MXN" ? " aprox." : ""}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-3 font-serif text-3xl tabular-nums" style={{ color: "var(--l-fg)" }}>
              {money(price, currency)}
            </p>
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              step={priceRange.step}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
              className="landing-slider mt-4 w-full"
              aria-label="Precio del curso"
            />

            <p className="mt-8 text-sm font-semibold" style={{ color: "var(--l-fg)" }}>
              Ventas al mes
            </p>
            <p className="mt-3 font-serif text-3xl tabular-nums" style={{ color: "var(--l-fg)" }}>
              {sales}
            </p>
            <input
              type="range"
              min={ESTIMATE_SALES_RANGE.min}
              max={ESTIMATE_SALES_RANGE.max}
              step={ESTIMATE_SALES_RANGE.step}
              value={sales}
              onChange={(event) => setSales(Number(event.target.value))}
              className="landing-slider mt-4 w-full"
              aria-label="Ventas al mes"
            />
            <p className="mt-4 text-xs leading-5" style={{ color: "var(--l-muted)" }}>
              Ventas brutas: {money(estimate.gross, currency)}
              {currency === "MXN" ? " (cambio de referencia, aproximado)." : "."}
            </p>
          </div>

          <div className="grid gap-3">
            <ResultCard
              kicker={CREATOR_PLAN_PAYG.label}
              title={`Sin mensualidad · ${Math.round(estimate.paygRate * 100)}%`}
              amount={money(estimate.payg, currency)}
              width={Math.max(0, (estimate.payg / barMax) * 100)}
              active={estimate.better === "payg"}
              hint={`Qlyk se queda el ${Math.round((1 - estimate.paygRate) * 100)}% solo cuando vendes.`}
            />
            <ResultCard
              kicker={`${CREATOR_PLAN_FLAT.label} · $${CREATOR_FLAT_PRICE_USD} USD`}
              title={`Plan mensual · ${Math.round(estimate.flatRate * 100)}% − cuota`}
              amount={money(estimate.flat, currency)}
              width={Math.max(0, (Math.max(0, estimate.flat) / barMax) * 100)}
              active={estimate.better === "flat"}
              hint={`Se resta la cuota de ${money(estimate.flatFee, currency)} al mes.`}
            />
            <p className="rounded-2xl border px-4 py-3 text-sm leading-6" style={{ borderColor: "var(--l-border)", color: "var(--l-fg)", background: "var(--l-surface)" }}>
              {estimate.better === "tie" ? (
                <>Con estas cifras, las dos modalidades te dejan casi lo mismo.</>
              ) : estimate.better === "flat" ? (
                <>
                  Con este volumen te conviene más el {CREATOR_PLAN_FLAT.label.toLowerCase()}. Suele valer la pena a
                  partir de ~USD {estimate.breakEvenUsd.toLocaleString("es-MX")} en ventas al mes.
                </>
              ) : (
                <>
                  Con este volumen te conviene más empezar sin mensualidad. El {CREATOR_PLAN_FLAT.label.toLowerCase()}{" "}
                  suele convenir si vendes más de ~USD {estimate.breakEvenUsd.toLocaleString("es-MX")} al mes.
                </>
              )}
            </p>
          </div>
        </LandingReveal>

        <p className="relative mt-6 max-w-3xl text-xs leading-5" style={{ color: "var(--l-muted)" }}>
          Estimación de lo que te quedas con Qlyk, <span className="font-semibold">antes de comisiones del procesador</span>.
          Esas comisiones, si las hay, se descuentan del importe bruto según los términos. Hoy el cobro al comprador es
          por transferencia SPEI (sin tarifa de procesador). El tipo de cambio MXN es solo de referencia.
        </p>
      </div>
    </section>
  );
}

function ResultCard({
  kicker,
  title,
  amount,
  width,
  active,
  hint,
}: {
  kicker: string;
  title: string;
  amount: string;
  width: number;
  active: boolean;
  hint: string;
}) {
  return (
    <article
      className={`rounded-3xl border p-5 ${active ? "border-klik-green/50 bg-klik-green/8" : ""}`}
      style={active ? undefined : { borderColor: "var(--l-border)", background: "var(--l-surface)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--l-muted)" }}>
            {kicker}
          </p>
          <h3 className="mt-1 font-display text-lg font-extrabold" style={{ color: "var(--l-fg)" }}>
            {title}
          </h3>
        </div>
        {active ? (
          <span className="rounded-full bg-klik-green px-2.5 py-1 text-[10px] font-bold text-klik-black">Te conviene más</span>
        ) : null}
      </div>
      <p className="mt-3 font-serif text-3xl tabular-nums text-klik-green">{amount}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10" aria-hidden>
        <div className="landing-sim-bar h-full rounded-full bg-klik-green" style={{ width: `${Math.min(100, width)}%` }} />
      </div>
      <p className="mt-2 text-xs leading-5" style={{ color: "var(--l-muted)" }}>
        {hint}
      </p>
    </article>
  );
}
