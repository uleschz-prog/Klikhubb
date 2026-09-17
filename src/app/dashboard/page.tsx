import { PlatformShell } from "@/components/layout/PlatformShell";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import {
  buildCreatorLaunchChecklist,
  CreatorLaunchChecklist,
  loadCreatorLaunchProgress,
} from "@/components/dashboard/CreatorLaunchChecklist";
import { CreatorPlanCard } from "@/components/dashboard/CreatorPlanCard";
import { creatorHoldLabel } from "@/config/compensation-plan";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { getCreatorPlanSnapshot } from "@/lib/commerce/creator-plan-billing";
import { loadHub } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/split";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getDbUserId();
  const session = await getSession();
  const isAdmin = session?.user?.roles?.includes("ADMIN") ?? false;
  const hub = userId ? await loadHub(userId) : null;
  const launchProgress = userId ? await loadCreatorLaunchProgress(userId) : null;
  const launchItems = launchProgress ? buildCreatorLaunchChecklist(launchProgress) : [];
  const planSnapshot = userId ? await getCreatorPlanSnapshot(userId).catch(() => null) : null;

  const wallet = hub?.wallet ?? { available: 0, pending: 0, lifetimeEarned: 0 };
  const holdLabel = creatorHoldLabel();

  return (
    <PlatformShell title="Cuenta">
      <div className="space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/50">Hola</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
              {hub?.displayName ?? "Tu cuenta"}
            </h1>
            {hub?.username ? (
              <Link href={`/u/${hub.username}`} className="mt-2 inline-block text-sm text-klik-cyan hover:underline">
                Ver perfil @{hub.username}
              </Link>
            ) : null}
          </div>
          <LogoutButton />
        </header>

        <section className="rounded-3xl border border-klik-line bg-gradient-to-br from-klik-card to-klik-black p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Tu dinero</p>
          <p className="mt-3 font-display text-4xl font-extrabold text-klik-green">{formatMoney(wallet.available)}</p>
          <p className="mt-1 text-sm text-white/50">Disponible para retirar</p>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
            <span className="text-white/55">En espera ({holdLabel})</span>
            <span className="font-semibold text-klik-cyan">{formatMoney(wallet.pending)}</span>
          </div>
          <Link
            href="/wallet"
            className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-klik-green text-sm font-bold text-klik-black"
          >
            Abrir monedero
          </Link>
          <p className="mt-3 text-center text-xs text-white/40">
            Vincula Stripe en el monedero para recibir tus retiros.
          </p>
        </section>

        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Accesos</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/orders" className="rounded-2xl border border-klik-line bg-klik-card p-4 transition hover:border-klik-cyan/40">
              <p className="font-display text-lg font-bold">Compras</p>
              <p className="mt-1 text-xs text-white/45">Pedidos y cursos</p>
            </Link>
            <Link href="/academy" className="rounded-2xl border border-klik-line bg-klik-card p-4 transition hover:border-klik-cyan/40">
              <p className="font-display text-lg font-bold">Qlyk Academy</p>
              <p className="mt-1 text-xs text-white/45">IA, red y USD 50/mes</p>
            </Link>
            <Link href="/academy/cursos" className="rounded-2xl border border-klik-line bg-klik-card p-4 transition hover:border-klik-cyan/40">
              <p className="font-display text-lg font-bold">Mis cursos</p>
              <p className="mt-1 text-xs text-white/45">Lo que ya tienes</p>
            </Link>
            <Link href="/publish" className="rounded-2xl border border-klik-line bg-klik-card p-4 transition hover:border-klik-cyan/40">
              <p className="font-display text-lg font-bold">Publicar</p>
              <p className="mt-1 text-xs text-white/45">Sube un video</p>
            </Link>
            <Link href="/notifications" className="rounded-2xl border border-klik-line bg-klik-card p-4 transition hover:border-klik-cyan/40">
              <p className="font-display text-lg font-bold">Avisos</p>
              <p className="mt-1 text-xs text-white/45">Notificaciones</p>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-klik-line bg-klik-card p-5">
          <ProfileAvatarUpload name={hub?.displayName ?? "Miembro"} imageUrl={hub?.image} />
        </section>

        {launchItems.length ? <CreatorLaunchChecklist items={launchItems} /> : null}

        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Crear</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/studio"
              className="inline-flex min-h-12 items-center rounded-full bg-klik-cyan px-6 text-sm font-bold text-klik-black"
            >
              Crear curso
            </Link>
            <Link
              href="/publish"
              className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 text-sm font-bold text-white"
            >
              Publicar video
            </Link>
          </div>
          <div className="mt-4">
            <CreatorPlanCard initial={planSnapshot} />
          </div>
        </section>

        {isAdmin ? (
          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm">
            <p className="font-semibold text-amber-200">Admin</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/admin/users" className="text-klik-cyan hover:underline">
                Usuarios y red
              </Link>
              <Link href="/admin/setup" className="text-klik-cyan hover:underline">
                Setup
              </Link>
              <Link href="/admin/payments" className="text-klik-cyan hover:underline">
                Pagos
              </Link>
              <Link href="/admin/creator-plans" className="text-klik-cyan hover:underline">
                Planes
              </Link>
              <Link href="/admin/payouts" className="text-klik-cyan hover:underline">
                Retiros
              </Link>
            </div>
          </section>
        ) : null}

        <section>
          <Leaderboard rows={hub?.leaderboard ?? []} />
        </section>
      </div>
    </PlatformShell>
  );
}
