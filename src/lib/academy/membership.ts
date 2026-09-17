import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/config/site";
import { QLYK_ACADEMY_SLUG } from "@/config/qlyk-academy";
import { isAcademyMemberActive } from "@/lib/academy/network";
import { academyInvitePath } from "@/lib/academy/referral";
import { shouldUseDemoFallback } from "@/lib/demo/store";

export type AcademySnapshot = {
  active: boolean;
  periodEnd: string | null;
  referralCode: string;
  inviteUrl: string;
  invitePath: string;
};

export async function loadAcademySnapshot(userId: string | null): Promise<AcademySnapshot | null> {
  if (!userId) return null;
  try {
    const [user, active, product] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      }),
      isAcademyMemberActive(prisma, userId),
      prisma.product.findUnique({
        where: { slug: QLYK_ACADEMY_SLUG },
        select: { id: true },
      }),
    ]);
    if (!user) return null;

    let periodEnd: string | null = null;
    if (product) {
      const sub = await prisma.productSubscription.findUnique({
        where: { userId_productId: { userId, productId: product.id } },
        select: { currentPeriodEnd: true, status: true },
      });
      periodEnd = sub?.currentPeriodEnd?.toISOString() ?? null;
    }

    const invitePath = academyInvitePath(user.referralCode);
    return {
      active,
      periodEnd,
      referralCode: user.referralCode,
      invitePath,
      inviteUrl: `${siteUrl()}${invitePath}`,
    };
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return null;
  }
}

export async function requireAcademyMember(userId: string) {
  const active = await isAcademyMemberActive(prisma, userId);
  if (!active) {
    throw new Error("ACADEMY_INACTIVE");
  }
  return true;
}
