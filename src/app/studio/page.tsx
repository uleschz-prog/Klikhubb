import { redirect } from "next/navigation";
import { StudioDashboard } from "@/components/studio/StudioDashboard";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { loadCreatorStudio } from "@/lib/commerce/creator-studio";
import { resolveDisplayFxUsdMxn } from "@/lib/commerce/display-fx";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const session = await getSession();
  const userId = (await getDbUserId()) ?? session?.user?.id ?? null;
  if (!userId) redirect("/login?callbackUrl=/studio");

  const data = await loadCreatorStudio(userId);
  if (data.displayName === "Creador" && session?.user?.name) {
    data.displayName = session.user.name;
    data.imageUrl = session.user.image ?? data.imageUrl;
  }

  return <StudioDashboard data={data} fxRate={resolveDisplayFxUsdMxn()} />;
}
