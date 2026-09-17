import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/config/site";
import { isPlatformAdminIdentity } from "@/config/platform-admin";
import { QLYK_ACADEMY_SLUG } from "@/config/qlyk-academy";
import { isAcademyMemberActive } from "@/lib/academy/network";
import { academyInvitePath } from "@/lib/academy/referral";
import { shouldUseDemoFallback } from "@/lib/demo/store";
import { ensureAcademyProduct } from "@/lib/academy/product";

const ADMIN_ACADEMY_UNTIL = new Date("2099-12-31T00:00:00.000Z");

export type AcademySnapshot = {
  active: boolean;
  complimentary: boolean;
  periodEnd: string | null;
  referralCode: string;
  inviteUrl: string;
  invitePath: string;
};

export async function ensureOperatorAcademyMembership(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, referralCode: true },
  });
  if (!isPlatformAdminIdentity(user)) return false;

  const product = await ensureAcademyProduct();
  const enrollment = await prisma.enrollment.upsert({
    where: { userId_productId: { userId, productId: product.id } },
    update: { status: "ACTIVE" },
    create: { userId, productId: product.id, status: "ACTIVE" },
  });

  const existing = await prisma.productSubscription.findUnique({
    where: { userId_productId: { userId, productId: product.id } },
    select: { id: true, stripeSubscriptionId: true },
  });

  if (existing) {
    await prisma.productSubscription.update({
      where: { id: existing.id },
      data: {
        status: "active",
        currentPeriodEnd: ADMIN_ACADEMY_UNTIL,
        enrollmentId: enrollment.id,
      },
    });
    return true;
  }

  try {
    await prisma.productSubscription.create({
      data: {
        userId,
        productId: product.id,
        enrollmentId: enrollment.id,
        stripeSubscriptionId: `academy_comp_${userId}`,
        status: "active",
        currentPeriodEnd: ADMIN_ACADEMY_UNTIL,
      },
    });
  } catch (error) {
    console.error("academy complimentary subscription", error);
    await prisma.productSubscription.updateMany({
      where: { userId, productId: product.id },
      data: {
        status: "active",
        currentPeriodEnd: ADMIN_ACADEMY_UNTIL,
        enrollmentId: enrollment.id,
      },
    });
  }

  return true;
}

export async function loadAcademySnapshot(userId: string | null): Promise<AcademySnapshot | null> {
  if (!userId) return null;
  try {
    await ensureOperatorAcademyMembership(userId).catch((error) => {
      console.error("academy complimentary membership", error);
      return false;
    });
    const [user, active, product] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true, email: true, username: true },
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
      complimentary: isPlatformAdminIdentity(user),
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
  await ensureOperatorAcademyMembership(userId).catch((error) => {
    console.error("academy complimentary membership", error);
    return false;
  });
  const active = await isAcademyMemberActive(prisma, userId);
  if (!active) {
    throw new Error("ACADEMY_INACTIVE");
  }
  return true;
}
