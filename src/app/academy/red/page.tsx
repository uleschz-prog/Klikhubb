import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { AcademyHubNav } from "@/components/academy/AcademyHubNav";
import { AcademyNetworkPanel } from "@/components/academy/AcademyNetworkPanel";
import { AcademySubscribeButton } from "@/components/academy/AcademySubscribeButton";
import { getDbUserId } from "@/lib/auth/session";
import { loadAcademySnapshot } from "@/lib/academy/membership";
import { loadAcademyNetwork } from "@/lib/academy/network-tree";

export const dynamic = "force-dynamic";

export default async function AcademyNetworkPage() {
  const userId = await getDbUserId();
  if (!userId) redirect(`/login?callbackUrl=${encodeURIComponent("/academy/red")}`);

  const snapshot = await loadAcademySnapshot(userId);
  const network = await loadAcademyNetwork(userId);

  return (
    <PlatformShell title="Red Academy">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Qlyk Academy</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Tu red de 8 niveles</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/55">
        Ganas el 60% de las mensualidades de quienes invitaste, en profundidad 8. Solo cobran miembros con Academy
        activa. El resto se queda en Qlyk.
      </p>
      <AcademyHubNav />
      {!snapshot?.active ? (
        <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <p className="font-semibold text-amber-100">Para cobrar, tu membresía tiene que estar activa.</p>
          <div className="mt-4">
            <AcademySubscribeButton label="Activar Qlyk Academy" />
          </div>
        </div>
      ) : null}
      {snapshot ? (
        <AcademyNetworkPanel
          inviteUrl={snapshot.inviteUrl}
          referralCode={snapshot.referralCode}
          network={network}
        />
      ) : null}
    </PlatformShell>
  );
}
