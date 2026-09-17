import type { Prisma } from "@prisma/client";
import { QLYK_ACADEMY_DEPTH, QLYK_ACADEMY_SLUG } from "@/config/qlyk-academy";
import type { AcademyUplineSeat } from "@/lib/academy/split";

type Db = Prisma.TransactionClient | typeof import("@/lib/prisma").prisma;

export async function resolveSponsorId(
  db: { user: { findFirst: typeof import("@prisma/client").PrismaClient.prototype.user.findFirst } },
  referralCode: string | null | undefined,
  excludeUserId?: string,
) {
  const code = referralCode?.trim().toUpperCase();
  if (!code) return null;
  const sponsor = await db.user.findFirst({
    where: { referralCode: { equals: code, mode: "insensitive" } },
    select: { id: true },
  });
  if (!sponsor) return null;
  if (excludeUserId && sponsor.id === excludeUserId) return null;
  return sponsor.id;
}

export async function walkAcademyUpline(
  db: Db,
  buyerId: string,
): Promise<AcademyUplineSeat[]> {
  const seats: AcademyUplineSeat[] = [];
  const seen = new Set<string>([buyerId]);
  let cursor = await db.user.findUnique({
    where: { id: buyerId },
    select: { invitedById: true },
  });

  for (let level = 1; level <= QLYK_ACADEMY_DEPTH; level += 1) {
    const parentId = cursor?.invitedById;
    if (!parentId || seen.has(parentId)) break;
    seen.add(parentId);
    const parent = await db.user.findUnique({
      where: { id: parentId },
      select: { id: true, invitedById: true, status: true },
    });
    if (!parent || parent.status !== "ACTIVE") {
      cursor = parent;
      continue;
    }
    const active = await isAcademyMemberActive(db, parent.id);
    seats.push({ userId: parent.id, level, active });
    cursor = parent;
  }

  return seats;
}

export async function isAcademyMemberActive(db: Db, userId: string) {
  const now = new Date();
  const enrollment = await db.enrollment.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      product: { slug: QLYK_ACADEMY_SLUG },
    },
    select: {
      id: true,
      subscriptions: {
        where: { status: { in: ["active", "trialing", "demo"] } },
        select: { currentPeriodEnd: true, status: true },
        take: 1,
      },
    },
  });
  if (!enrollment) return false;
  const sub = enrollment.subscriptions[0];
  if (!sub) return true;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < now) return false;
  return true;
}
