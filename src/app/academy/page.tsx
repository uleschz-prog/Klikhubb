import { PlatformShell } from "@/components/layout/PlatformShell";
import { AcademyHubNav } from "@/components/academy/AcademyHubNav";
import { AcademySubscribeButton } from "@/components/academy/AcademySubscribeButton";
import { getDbUserId } from "@/lib/auth/session";
import { ensureAcademyProduct } from "@/lib/academy/product";
import { loadAcademySnapshot } from "@/lib/academy/membership";
import { QLYK_ACADEMY_PRICE_USD } from "@/config/qlyk-academy";
import { formatMoney } from "@/lib/commerce/split";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AcademyHubPage() {
  const userId = await getDbUserId();
  await ensureAcademyProduct().catch(() => undefined);
  const snapshot = await loadAcademySnapshot(userId);

  return (
    <PlatformShell title="Qlyk Academy">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Nuevo modelo de negocio</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Qlyk Academy</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
        Estudio de IA para crear video, imagen, Notebook LM y agentes autónomos. Cuota de{" "}
        {formatMoney(QLYK_ACADEMY_PRICE_USD)} al mes con acceso ilimitado mientras estés activo. Invita alumnos y ganas
        el 60% de sus mensualidades en 8 niveles.
      </p>
      <AcademyHubNav />

      {snapshot?.active ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-klik-line bg-klik-card p-5 sm:col-span-2">
            <p className="text-[11px] uppercase tracking-wider text-klik-green">Membresía activa</p>
            <p className="mt-2 font-display text-3xl font-extrabold">Acceso ilimitado</p>
            <p className="mt-1 text-sm text-white/50">
              {snapshot.complimentary
                ? "Cuenta administradora · sin mensualidad"
                : snapshot.periodEnd
                  ? `Vigente hasta ${new Date(snapshot.periodEnd).toLocaleDateString("es-MX")}`
                  : "Usa el estudio sin límite mientras sigas activo"}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/academy/studio"
                className="inline-flex min-h-11 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black"
              >
                Abrir estudio
              </Link>
              <Link
                href="/academy/red"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold"
              >
                Ver mi red
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-klik-line bg-klik-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-white/40">Invitación</p>
            <p className="mt-2 font-display text-2xl font-extrabold">{snapshot.referralCode}</p>
            <p className="mt-2 text-xs text-white/45">Nivel 1 cobra 20% de cada alumno que invites.</p>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-3xl border border-klik-line bg-gradient-to-br from-klik-card to-klik-black p-6">
          <p className="font-display text-2xl font-extrabold">USD 50 / mes</p>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Entras al estudio con acceso ilimitado y puedes construir una red de 8 niveles. Qlyk se queda el 40%. El 60%
            restante se reparte en tu upline activo.
          </p>
          <div className="mt-6">
            {userId ? (
              <AcademySubscribeButton />
            ) : (
              <Link
                href="/register?next=/academy"
                className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black"
              >
                Crear cuenta y unirme
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <ToolCard title="Imagen IA" detail="Incluida en tu mensualidad" />
        <ToolCard title="Video IA" detail="Incluida en tu mensualidad" />
        <ToolCard title="Notebook LM" detail="Incluida en tu mensualidad" />
        <ToolCard title="Agentes autónomos" detail="Incluidos en tu mensualidad" />
      </section>
    </PlatformShell>
  );
}

function ToolCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card p-5">
      <p className="font-display text-xl font-bold">{title}</p>
      <p className="mt-1 text-sm text-white/50">{detail}</p>
    </div>
  );
}
