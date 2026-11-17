import Link from "next/link";

const STATS = [
  { value: "93%", label: "para ti en cada venta" },
  { value: "24 h", label: "para pedir tu retiro" },
  { value: "MXN y USD", label: "precios claros" },
];

export function LandingHero() {
  return (
    <section className="hero-cinematic theme-media relative overflow-hidden text-white">
      <div className="hero-cinematic-glow" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:pb-20 lg:pt-14">
        <div className="hero-rise">
          <p className="hero-ticker mb-5 inline-flex max-w-full flex-wrap gap-x-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
            <span>Sin cuota mensual</span>
            <span className="text-klik-green">93% para el creador</span>
            <span>Retiro desde 24 h</span>
          </p>
          <h1 className="font-serif text-[2.6rem] font-normal leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            Vende tus cursos y videos.{" "}
            <span className="italic text-klik-green">Quédate el 93%.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            En Qlyk publicas un clip o armas un curso, lo pones a la venta y cobras en tu monedero. El retiro se puede pedir después de 24 horas. Los precios se muestran en MXN y USD.
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
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <dt className="font-serif text-2xl text-klik-green sm:text-3xl">{stat.value}</dt>
                <dd className="mt-1 text-xs text-white/65">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hero-rise hero-rise-delay-2 relative">
          <div className="hero-mock" aria-hidden>
            <div className="hero-mock-card">
              <div className="h-28 rounded-2xl bg-gradient-to-br from-klik-green/80 via-emerald-700 to-klik-cyan/40" />
              <div className="mt-4 h-3 w-2/3 rounded-full bg-white/25" />
              <div className="mt-2 h-3 w-1/3 rounded-full bg-white/15" />
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Tu parte</div>
                  <div className="font-serif text-3xl text-klik-green">93%</div>
                </div>
                <div className="rounded-full bg-klik-green px-3 py-1 text-[11px] font-bold text-klik-black">A la venta</div>
              </div>
            </div>
          </div>
          <form
            action="/register"
            method="get"
            className="relative rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-klik-green">Empieza hoy</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">Crea tu cuenta gratis</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Sin mensualidad. Publicas cuando quieras y te quedas el 93% de cada venta aprobada.
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
