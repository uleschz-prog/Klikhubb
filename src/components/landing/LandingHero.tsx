import Link from "next/link";
import {
  CREATOR_FLAT_PRICE_USD,
  CREATOR_PLAN_FLAT,
  CREATOR_PLAN_PAYG,
  creatorHoldLabel,
} from "@/config/compensation-plan";

const PAYG_PERCENT = Math.round(CREATOR_PLAN_PAYG.creatorRate * 100);
const FLAT_PERCENT = Math.round(CREATOR_PLAN_FLAT.creatorRate * 100);
const HOLD = creatorHoldLabel() === "24 horas" ? "24 h" : creatorHoldLabel();

const STATS = [
  {
    value: `Hasta ${FLAT_PERCENT}%`,
    label: `${PAYG_PERCENT}% sin mensualidad o ${FLAT_PERCENT}% con ${CREATOR_PLAN_FLAT.label.toLowerCase()}`,
  },
  { value: HOLD, label: "para pedir tu retiro" },
  { value: "MXN y USD", label: "precios claros" },
];

export function LandingHero() {
  return (
    <section className="hero-cinematic theme-media relative overflow-hidden text-white">
      <div className="hero-cinematic-glow" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:pb-20 lg:pt-14">
        <div className="hero-rise">
          <p className="hero-ticker mb-5 inline-flex max-w-full flex-wrap gap-x-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
            <span>Sin mensualidad: {PAYG_PERCENT}%</span>
            <span className="text-klik-green">
              {CREATOR_PLAN_FLAT.label}: {FLAT_PERCENT}%
            </span>
            <span>Retiro desde 24 h</span>
          </p>
          <h1 className="font-serif text-[2.6rem] font-normal leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            Vende tus cursos y videos.{" "}
            <span className="italic text-klik-green">Quédate hasta el {FLAT_PERCENT}%.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            Sin cuota mensual te quedas el {PAYG_PERCENT}% de cada venta aprobada. Con el{" "}
            {CREATOR_PLAN_FLAT.label.toLowerCase()} de ${CREATOR_FLAT_PRICE_USD} USD te quedas el{" "}
            {FLAT_PERCENT}%. El retiro se puede pedir después de 24 horas. Los precios se muestran en MXN y USD.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black shadow-[0_12px_30px_-12px_rgba(48,209,88,0.9)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Crea tu cuenta gratis
            </Link>
            <Link
              href="/cursos"
              className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Explorar cursos
            </Link>
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            {STATS.map((stat) => (
              <div key={stat.value} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <dt className="font-serif text-2xl text-klik-green sm:text-3xl">{stat.value}</dt>
                <dd className="mt-1 text-xs leading-5 text-white/65">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hero-rise hero-rise-delay-2 relative isolate">
          <form
            action="/register"
            method="get"
            className="relative z-10 rounded-3xl border border-white/15 bg-[#0b0d0c]/90 p-6 shadow-2xl backdrop-blur-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-klik-green">Empieza hoy</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">Crea tu cuenta gratis</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Empieza sin mensualidad y quédate el {PAYG_PERCENT}%. Cuando te convenga, pasa al{" "}
              {CREATOR_PLAN_FLAT.label.toLowerCase()} de ${CREATOR_FLAT_PRICE_USD} USD y quédate el {FLAT_PERCENT}%.
            </p>
            <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-white/55">
              Tu correo
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="mt-2 min-h-12 w-full rounded-full border border-white/15 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-klik-green"
              />
            </label>
            <button
              type="submit"
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-klik-green text-sm font-bold text-klik-black transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
            >
              Continuar
            </button>
            <p className="mt-3 text-center text-sm text-white/55">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-semibold text-white underline-offset-2 hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
