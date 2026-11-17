"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CopyCourseLink } from "@/components/studio/CopyCourseLink";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  evolutionMilestone,
  filterStudioSales,
  summarizeStudioSales,
  type CreatorStudioView,
  type StudioProductCard,
  type StudioRangeDays,
} from "@/lib/commerce/creator-studio-view";
import { convertUsdToMxn, formatCatalogPrice } from "@/lib/commerce/display-fx";
import { formatMoney } from "@/lib/commerce/split";

const STATUS_LABEL: Record<StudioProductCard["status"], string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  ARCHIVED: "Archivado",
};

const STATUS_TABS: { id: "all" | StudioProductCard["status"]; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "DRAFT", label: "Borradores" },
  { id: "ACTIVE", label: "Activos" },
  { id: "PAUSED", label: "Pausados" },
];

function moneyLabel(amountUsd: number, currency: "USD" | "MXN", fx: number, hidden: boolean) {
  if (hidden) return "••••";
  if (currency === "MXN") {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      currencyDisplay: "code",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertUsdToMxn(amountUsd, fx));
  }
  return formatMoney(amountUsd, "USD");
}

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 4l16 16" strokeLinecap="round" />
      <path d="M9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.1-.9M6.1 6.6C4.2 7.9 3 10 3 10s3.6 7 9 7c1.4 0 2.7-.3 3.8-.9M10.7 6.1A8.7 8.7 0 0 1 12 6c5.4 0 9 7 9 7a15.6 15.6 0 0 1-3.3 3.7" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function StudioDashboard({ data, fxRate }: { data: CreatorStudioView; fxRate: number }) {
  const [range, setRange] = useState<StudioRangeDays>(30);
  const [productId, setProductId] = useState<string>("all");
  const [currency, setCurrency] = useState<"USD" | "MXN">("USD");
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState<"all" | StudioProductCard["status"]>("all");

  const filteredSales = useMemo(
    () => filterStudioSales(data.sales, range, productId),
    [data.sales, range, productId],
  );
  const kpis = useMemo(() => summarizeStudioSales(filteredSales), [filteredSales]);
  const milestone = evolutionMilestone(data.lifetimeEarnedUsd);
  const visibleProducts = data.products.filter((product) => (tab === "all" ? product.status !== "ARCHIVED" : product.status === tab));
  const currentStep = !data.onboarding.hasProfile
    ? "profile"
    : !data.onboarding.hasProduct
      ? "product"
      : !data.onboarding.hasShareLink
        ? "share"
        : !data.onboarding.hasSale
          ? "sale"
          : "done";

  const stepCopy = {
    profile: {
      title: "Completa tu perfil",
      body: "Pon tu foto y tu nombre para que quienes compran sepan quién publica.",
      href: "/dashboard#perfil",
      cta: "Ir a tu perfil",
    },
    product: {
      title: "Publica tu primer producto",
      body: "Crea un curso o un video. Puedes dejarlo en borrador y publicarlo cuando esté listo.",
      href: "/studio/new",
      cta: "Crear curso",
    },
    share: {
      title: "Comparte tu enlace",
      body: data.onboarding.shareSlug
        ? "Tu curso ya tiene una ficha pública. Copia el enlace y compártelo."
        : "Cuando un curso esté activo, aquí vas a copiar el enlace de la ficha.",
      href: data.onboarding.shareSlug ? `/c/${data.onboarding.shareSlug}` : "/studio/new",
      cta: data.onboarding.shareSlug ? "Ver ficha" : "Publicar un curso",
    },
    sale: {
      title: "Consigue tu primera venta",
      body: "El 93% de cada venta aprobada es tuyo. Puedes pedir el retiro después de 24 horas.",
      href: "/wallet",
      cta: "Ver monedero",
    },
    done: {
      title: "Ya diste los primeros pasos",
      body: "Sigue publicando y revisa tu monedero cuando el saldo esté disponible.",
      href: "/studio/new",
      cta: "Crear otro curso",
    },
  }[currentStep];

  return (
    <div className="studio-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/45">Área de creación</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">Hola, {data.displayName}</h1>
          <p className="mt-1 text-sm text-foreground/55">Tu tablero para crear, vender y cobrar en Qlyk.</p>
        </div>
        <Link
          href="/studio/new"
          className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
        >
          Crear producto
        </Link>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <article className="rounded-3xl border border-klik-line bg-klik-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">Próximos pasos</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{data.onboarding.percent}% completado</p>
            </div>
            <div
              className="h-2 w-40 overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-label="Avance de los próximos pasos"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={data.onboarding.percent}
            >
              <div className="h-full rounded-full bg-klik-green" style={{ width: `${data.onboarding.percent}%` }} />
            </div>
          </div>
          <ol className="mt-5 space-y-2">
            {[
              { done: data.onboarding.hasProfile, label: "Perfil completo" },
              { done: data.onboarding.hasProduct, label: "Primer producto publicado" },
              { done: data.onboarding.hasShareLink, label: "Compartir enlace" },
              { done: data.onboarding.hasSale, label: "Primera venta" },
            ].map((step) => (
              <li key={step.label} className="flex min-h-11 items-center gap-3 rounded-2xl bg-foreground/5 px-3 text-sm">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    step.done ? "bg-klik-green text-klik-black" : "border border-foreground/20 text-foreground/40"
                  }`}
                >
                  {step.done ? "✓" : ""}
                </span>
                <span className={step.done ? "text-foreground" : "text-foreground/65"}>{step.label}</span>
              </li>
            ))}
          </ol>
        </article>

        <aside className="flex flex-col justify-between rounded-3xl border border-klik-line bg-gradient-to-br from-klik-green/15 via-klik-card to-klik-cyan/10 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">Siguiente acción</p>
            <h2 className="mt-2 font-display text-xl font-extrabold">{stepCopy.title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/65">{stepCopy.body}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {currentStep === "share" && data.onboarding.shareSlug ? <CopyCourseLink slug={data.onboarding.shareSlug} /> : null}
            <Link
              href={stepCopy.href}
              className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
            >
              {stepCopy.cta}
            </Link>
          </div>
        </aside>
      </section>

      <section id="ventas" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="studio-product">
            Producto
          </label>
          <select
            id="studio-product"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="min-h-11 rounded-full border border-klik-line bg-klik-card px-4 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
          >
            <option value="all">Todos los productos</option>
            {data.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
          <div className="inline-flex rounded-full border border-klik-line p-1">
            {(["USD", "MXN"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={`min-h-9 rounded-full px-3 text-xs font-bold ${
                  currency === code ? "bg-klik-green text-klik-black" : "text-foreground/60"
                }`}
                aria-pressed={currency === code}
              >
                {code}
                {code === "MXN" ? " aprox." : ""}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-full border border-klik-line p-1">
            {([7, 30, 90] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRange(days)}
                className={`min-h-9 rounded-full px-3 text-xs font-bold ${
                  range === days ? "bg-foreground text-background" : "text-foreground/60"
                }`}
                aria-pressed={range === days}
              >
                {days} días
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setHidden((value) => !value)}
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-klik-line px-3 text-sm font-semibold text-foreground/70 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
            aria-pressed={hidden}
            aria-label={hidden ? "Mostrar montos" : "Ocultar montos"}
          >
            <EyeIcon off={hidden} />
            {hidden ? "Mostrar" : "Ocultar"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-3xl border border-klik-line bg-klik-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">Ingreso neto</p>
            <p className="mt-3 font-display text-3xl font-extrabold text-klik-green">{moneyLabel(kpis.netIncomeUsd, currency, fxRate, hidden)}</p>
            <p className="mt-2 text-xs text-foreground/50">
              Tu parte después de la comisión de Qlyk, en los últimos {range} días.
              {currency === "MXN" ? " Cambio de referencia, aproximado." : ""}
            </p>
          </article>
          <article className="rounded-3xl border border-klik-line bg-klik-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">Ventas aprobadas</p>
            <p className="mt-3 font-display text-3xl font-extrabold">{hidden ? "••••" : kpis.approvedCount}</p>
            <p className="mt-2 text-xs text-foreground/50">Pedidos pagados en el periodo elegido.</p>
          </article>
          <article className="rounded-3xl border border-klik-line bg-gradient-to-br from-klik-green/10 to-klik-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">Mi evolución</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="font-display text-lg font-bold">
                Hacia {moneyLabel(milestone.target, currency, fxRate, false)}
              </p>
              {milestone.badge ? (
                <span className="rounded-full bg-klik-green px-2 py-1 text-[11px] font-bold text-klik-black">
                  Logro {milestone.badge}
                </span>
              ) : (
                <span className="rounded-full bg-foreground/8 px-2 py-1 text-[11px] font-bold text-foreground/55">Primer logro a USD 100</span>
              )}
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-label="Avance hacia el siguiente logro"
              aria-valuenow={milestone.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-klik-green" style={{ width: `${milestone.percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-foreground/50">
              Llevas {moneyLabel(milestone.current, currency, fxRate, hidden)} ganados en total.
            </p>
          </article>
        </div>
      </section>

      <section id="productos" className="scroll-mt-24">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold">Mis productos</h2>
          <div className="flex flex-wrap gap-1 rounded-full border border-klik-line p-1">
            {STATUS_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`min-h-9 rounded-full px-3 text-xs font-bold ${
                  tab === item.id ? "bg-foreground text-background" : "text-foreground/60"
                }`}
                aria-pressed={tab === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {visibleProducts.length === 0 && tab !== "all" ? (
          <EmptyState
            title={`No hay ${STATUS_TABS.find((item) => item.id === tab)?.label.toLowerCase() ?? "productos"}`}
            body="Cambia de pestaña o crea un curso nuevo."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/studio/new"
              className="flex min-h-[16rem] flex-col items-center justify-center rounded-3xl border border-dashed border-klik-line bg-klik-card/50 p-5 text-center transition hover:-translate-y-1 hover:border-klik-green/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-klik-green text-2xl font-bold text-klik-black">
                +
              </span>
              <p className="mt-3 font-display text-lg font-bold">Crear producto</p>
              <p className="mt-1 text-xs text-foreground/50">Un curso, membresía o archivo digital.</p>
            </Link>

            {visibleProducts.length === 0 ? (
              <div className="sm:col-span-1 xl:col-span-3">
                <EmptyState
                  title="Todavía no tienes productos"
                  body="Crea tu primer curso, súbelo cuando esté listo y compártelo."
                />
              </div>
            ) : (
              visibleProducts.map((product) => {
                const price = formatCatalogPrice(product.price, product.currency, fxRate);
                return (
                  <article key={product.id} className="overflow-hidden rounded-3xl border border-klik-line bg-klik-card transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-klik-green/25 via-klik-card to-klik-cyan/20">
                      {product.coverUrl ? (
                        <RemoteImage src={product.coverUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center font-display text-3xl font-extrabold text-foreground/25">
                          {product.title.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          product.status === "ACTIVE"
                            ? "bg-klik-green text-klik-black"
                            : product.status === "DRAFT"
                              ? "bg-black/70 text-white"
                              : "bg-amber-400 text-klik-black"
                        }`}
                      >
                        {STATUS_LABEL[product.status]}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 font-display text-base font-bold">{product.title}</h3>
                      <p className="mt-1 text-xs text-foreground/50">
                        {price.primary}
                        {price.secondary ? ` · ${price.secondary}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-foreground/40">
                        {product.moduleCount} {product.moduleCount === 1 ? "módulo" : "módulos"} · {product.lessonCount}{" "}
                        {product.lessonCount === 1 ? "lección" : "lecciones"}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/studio/${product.slug}`}
                          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-klik-cyan px-3 text-sm font-bold text-klik-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-cyan"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/c/${product.slug}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-klik-line px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
                        >
                          Ficha
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </section>
    </div>
  );
}
