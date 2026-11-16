import { PlatformShell } from "@/components/layout/PlatformShell";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import {
  AccountAdminSection,
  AccountCreateSection,
  AccountHome,
  AccountSettingsCard,
} from "@/components/dashboard/AccountHome";
import {
  buildCreatorLaunchChecklist,
  CreatorLaunchChecklist,
  loadCreatorLaunchProgress,
} from "@/components/dashboard/CreatorLaunchChecklist";
import { CreatorPlanCard } from "@/components/dashboard/CreatorPlanCard";
import { CreatorOnboarding } from "@/components/onboarding/CreatorOnboarding";
import { creatorHoldLabel } from "@/config/compensation-plan";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { listBuyerPurchases } from "@/lib/commerce/buyer-orders";
import { getCreatorPlanSnapshot } from "@/lib/commerce/creator-plan-billing";
import { loadHub, listMyCourses } from "@/lib/commerce/catalog";
import { resolveDisplayFxUsdMxn } from "@/lib/commerce/display-fx";
import { unreadNotificationCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

async function safeCount(promise: Promise<number | { length: number }>): Promise<number> {
  try {
    const value = await promise;
    return typeof value === "number" ? value : value.length;
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const session = await getSession();
  // Sin Postgres local, getDbUserId() no resuelve; usamos el id de la sesión (store demo).
  const userId = (await getDbUserId()) ?? session?.user?.id ?? null;
  const isAdmin = session?.user?.roles?.includes("ADMIN") ?? false;
  const hub = userId ? await loadHub(userId) : null;
  const launchProgress = userId ? await loadCreatorLaunchProgress(userId).catch(() => null) : null;
  const launchItems = launchProgress ? buildCreatorLaunchChecklist(launchProgress) : [];
  const planSnapshot = userId ? await getCreatorPlanSnapshot(userId).catch(() => null) : null;

  const [purchaseCount, courseCount, unreadAvisos] = userId
    ? await Promise.all([
        safeCount(listBuyerPurchases(userId)),
        safeCount(listMyCourses(userId)),
        safeCount(unreadNotificationCount(userId)),
      ])
    : [0, 0, 0];

  const wallet = hub?.wallet ?? { available: 0, pending: 0, lifetimeEarned: 0 };
  const holdLabel = creatorHoldLabel();
  const displayName = hub?.displayName ?? "Tu cuenta";
  const fxRate = resolveDisplayFxUsdMxn();

  return (
    <PlatformShell title="Cuenta">
      <div className="space-y-6">
        {launchProgress ? (
          <CreatorOnboarding
            progress={{
              hasProfile: launchProgress.hasAvatar,
              hasClip: launchProgress.hasShopVideo || launchProgress.hasPlayVideo,
              hasCourse: launchProgress.hasCourse,
            }}
          />
        ) : null}

        <AccountHome
          displayName={displayName}
          username={hub?.username ?? null}
          imageUrl={hub?.image ?? null}
          wallet={wallet}
          holdLabel={holdLabel}
          fxRate={fxRate}
          purchaseCount={purchaseCount}
          courseCount={courseCount}
          unreadAvisos={unreadAvisos}
        />

        <AccountSettingsCard displayName={displayName} imageUrl={hub?.image ?? null} />

        {launchItems.length ? <CreatorLaunchChecklist items={launchItems} /> : null}

        <AccountCreateSection>
          <CreatorPlanCard initial={planSnapshot} />
        </AccountCreateSection>

        {isAdmin ? <AccountAdminSection /> : null}

        <section className="dash-rise dash-rise-5">
          <Leaderboard rows={hub?.leaderboard ?? []} />
        </section>
      </div>
    </PlatformShell>
  );
}
