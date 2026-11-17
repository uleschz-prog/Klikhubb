"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { convertUsdToMxn } from "@/lib/commerce/display-fx";
import { ParallaxLayer, useDesktopMedia } from "@/components/landing/landing-motion";

const TOASTS = [
  { title: "Nueva venta", detail: "Alguien compró tu curso" },
  { title: "Nuevo alumno", detail: "Se abrió el acceso al contenido" },
  { title: "Retiro solicitado", detail: "Pedido desde tu monedero" },
] as const;

export function LandingHeroMocks({ fxRate }: { fxRate: number }) {
  const desktop = useDesktopMedia();
  if (!desktop) return null;

  return (
    <div className="relative grid grid-cols-[minmax(7.5rem,0.72fr)_minmax(0,1fr)] items-end gap-3 pb-8">
      <ParallaxLayer offset={28}>
        <CoursePhoneMock fxRate={fxRate} />
      </ParallaxLayer>
      <ParallaxLayer offset={16} className="relative">
        <StudioDeviceMock />
        <DemoToastStack />
      </ParallaxLayer>
    </div>
  );
}

function StudioDeviceMock() {
  const reduced = useReducedMotion();

  return (
    <div className="hero-device-float w-full" aria-hidden>
      <div className="rounded-[2rem] border border-white/15 bg-black/55 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <span className="text-[10px] font-semibold text-white/45">Qlyk Studio</span>
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">
            Ejemplo
          </span>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-[#0c0f0d] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Área de creación</p>
          <p className="mt-1 font-display text-lg font-extrabold">Tu tablero</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/40">Ingreso neto</p>
              <p className="mt-1 font-display text-sm font-bold text-klik-green">••••</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/40">Ventas</p>
              <p className="mt-1 font-display text-sm font-bold">Listas</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">Actividad</p>
              <span className="text-[9px] text-white/35">ilustración</span>
            </div>
            <StudioSparkline reduced={Boolean(reduced)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StudioSparkline({ reduced }: { reduced: boolean }) {
  const line =
    "M0 52 C 18 48, 28 36, 42 38 S 70 22, 88 26 118 12, 140 16 160 8, 180 10";
  const area = `${line} L 180 64 L 0 64 Z`;

  return (
    <svg viewBox="0 0 180 64" className="mt-2 h-16 w-full" role="img" aria-label="Gráfico de ejemplo">
      <defs>
        <linearGradient id="hero-chart-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#30D158" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#30D158" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hero-chart-fill)" className={reduced ? "" : "hero-chart-area"} />
      <path
        d={line}
        fill="none"
        stroke="#30D158"
        strokeWidth="2.4"
        strokeLinecap="round"
        pathLength={1}
        className={reduced ? "" : "hero-chart-line"}
      />
    </svg>
  );
}

function CoursePhoneMock({ fxRate }: { fxRate: number }) {
  const mxn = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(convertUsdToMxn(20, fxRate));

  return (
    <div className="hero-device-float mx-auto w-[9.5rem]" aria-hidden>
      <div className="rounded-[1.6rem] border border-white/15 bg-black/70 p-1.5 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.9)]">
        <div className="overflow-hidden rounded-[1.25rem] bg-[#0c0f0d]">
          <div className="flex items-center justify-between px-3 pt-2 text-[8px] text-white/40">
            <span>Qlyk</span>
            <span className="rounded-full border border-white/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em]">
              Ejemplo
            </span>
          </div>
          <div className="relative mt-2">
            <Image
              src="/landing/course-cover.webp"
              alt=""
              width={720}
              height={960}
              className="h-28 w-full object-cover"
              sizes="10rem"
            />
            <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-klik-green text-klik-black shadow-lg">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M8 6.5v11l9-5.5-9-5.5Z" />
              </svg>
            </span>
          </div>
          <div className="px-2.5 pb-3 pt-2">
            <p className="text-[10px] font-bold leading-tight text-white">Tu curso</p>
            <p className="mt-0.5 text-[8px] text-white/45">Clip + ficha de venta</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-[9px] font-semibold text-klik-green">
                {mxn}
                <span className="block text-[7px] font-medium text-white/40">USD 20 · aprox.</span>
              </p>
              <span className="rounded-full bg-klik-green px-2 py-0.5 text-[7px] font-bold text-klik-black">Comprar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoToastStack() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setIndex((value) => (value + 1) % TOASTS.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced]);

  const items = reduced ? TOASTS : [TOASTS[index]];

  return (
    <div className="pointer-events-none absolute -bottom-2 -right-2 z-20 w-40 sm:-right-5">
      <p className="mb-1 text-right text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">Ejemplo</p>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((toast) => (
            <motion.div
              key={toast.title}
              initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-white/15 bg-[#0c0f0d]/90 p-2.5 shadow-xl backdrop-blur-xl"
            >
              <p className="text-[10px] font-bold text-white">{toast.title}</p>
              <p className="mt-0.5 text-[9px] leading-4 text-white/55">{toast.detail}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
