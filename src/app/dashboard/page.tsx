import { PlatformShell } from "@/components/layout/PlatformShell";
import { InviteCard } from "@/components/social/InviteCard";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { COMPENSATION_PLAN_V1 } from "@/config/compensation-plan";
import { getDbUserId } from "@/lib/auth/session";
import { loadHub } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/split";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getDbUserId();
  const hub = userId ? await loadHub(userId) : null;

  const wallet = hub?.wallet ?? { available: 0, pending: 0, lifetimeEarned: 0 };
  const holdDays = COMPENSATION_PLAN_V1.holdDays;

  return (
    <PlatformShell title="Dashboard">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Tu espacio</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">
            {hub?.displayName ?? "Dashboard"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Ganancias, puntos y las voces que suenan. Aquí se ve lo que creas y lo que cobras.
            {hub?.demo ? " Modo local: Postgres aún no acepta la conexión." : ""}
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-6 rounded-2xl border border-klik-line bg-klik-card p-5">
        <ProfileAvatarUpload name={hub?.displayName ?? "Miembro"} imageUrl={hub?.image} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <a href="/wallet" className="rounded-2xl border border-klik-line bg-klik-card p-4 transition hover:border-klik-cyan/40">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Disponible</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-klik-green">{formatMoney(wallet.available)}</p>
        </a>
        <a href="/wallet" className="rounded-2xl border border-klik-line bg-klik-card p-4 transition hover:border-klik-cyan/40">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Pendiente ({holdDays} días)</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-klik-cyan">{formatMoney(wallet.pending)}</p>
        </a>
        <div className="rounded-2xl border border-klik-line bg-klik-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Puntos</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-white">
            {(hub?.points ?? 0).toLocaleString("es-MX")}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-white/40">Toca el saldo para abrir tu monedero.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/wallet"
          className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black"
        >
          Monedero
        </a>
        <a
          href="/studio"
          className="inline-flex min-h-12 items-center rounded-full bg-klik-cyan px-6 text-sm font-bold text-klik-black"
        >
          Studio de cursos
        </a>
        <a
          href="/publish"
          className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 text-sm font-bold text-white"
        >
          Publicar video
        </a>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <InviteCard code={hub?.referralCode ?? ""} invitedCount={hub?.invitedCount ?? 0} />
        <Leaderboard rows={hub?.leaderboard ?? []} />
      </div>
    </PlatformShell>
  );
}
