import { PlatformShell } from "@/components/layout/PlatformShell";
import { InviteCard } from "@/components/social/InviteCard";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth/session";
import { loadHub } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/split";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session?.user?.id;
  const hub = userId ? await loadHub(userId) : null;

  const wallet = hub?.wallet ?? { available: 0, pending: 0, lifetimeEarned: 0 };

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

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Disponible", value: formatMoney(wallet.available), color: "text-klik-green" },
          { label: "Pendiente (14 días)", value: formatMoney(wallet.pending), color: "text-klik-cyan" },
          { label: "Puntos", value: (hub?.points ?? 0).toLocaleString("es-MX"), color: "text-white" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-klik-line bg-klik-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-white/40">{stat.label}</p>
            <p className={`mt-2 font-display text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <a
          href="/publish"
          className="inline-flex min-h-12 items-center rounded-full bg-klik-cyan px-6 text-sm font-bold text-klik-black"
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
