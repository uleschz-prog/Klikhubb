import { prisma } from "@/lib/prisma";
import { QLYK_ACADEMY_DEPTH } from "@/config/qlyk-academy";
import { isAcademyMemberActive } from "@/lib/academy/network";
import { fromCents, toCents } from "@/lib/money/cents";
import { shouldUseDemoFallback } from "@/lib/demo/store";

export type AcademyNetworkSeat = {
  id: string;
  name: string;
  username: string | null;
  active: boolean;
  createdAt: string;
};

export type AcademyNetworkLevel = {
  level: number;
  rate: number;
  members: number;
  activeMembers: number;
  users: AcademyNetworkSeat[];
};

export type AcademyNetworkSummary = {
  directs: number;
  networkSize: number;
  activeInNetwork: number;
  earnedUnilevel: number;
  pendingUnilevel: number;
  levels: AcademyNetworkLevel[];
};

const LEVEL_RATES = [0.2, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05];

export async function loadAcademyNetwork(userId: string): Promise<AcademyNetworkSummary> {
  const empty = (): AcademyNetworkSummary => ({
    directs: 0,
    networkSize: 0,
    activeInNetwork: 0,
    earnedUnilevel: 0,
    pendingUnilevel: 0,
    levels: LEVEL_RATES.map((rate, index) => ({
      level: index + 1,
      rate,
      members: 0,
      activeMembers: 0,
      users: [],
    })),
  });

  try {
  const levels: AcademyNetworkLevel[] = [];
  let frontier = [userId];
  const seen = new Set<string>([userId]);
  let networkSize = 0;
  let activeInNetwork = 0;
  let directs = 0;

  for (let level = 1; level <= QLYK_ACADEMY_DEPTH; level += 1) {
    const children = await prisma.user.findMany({
      where: { invitedById: { in: frontier } },
      select: {
        id: true,
        displayName: true,
        name: true,
        username: true,
        createdAt: true,
      },
      take: 200,
    });
    const unique = children.filter((row) => !seen.has(row.id));
    for (const row of unique) seen.add(row.id);
    const seats: AcademyNetworkSeat[] = [];
    for (const row of unique) {
      const active = await isAcademyMemberActive(prisma, row.id);
      if (active) activeInNetwork += 1;
      seats.push({
        id: row.id,
        name: row.displayName ?? row.name ?? row.username ?? "Miembro",
        username: row.username,
        active,
        createdAt: row.createdAt.toISOString(),
      });
    }
    if (level === 1) directs = seats.length;
    networkSize += seats.length;
    levels.push({
      level,
      rate: LEVEL_RATES[level - 1] ?? 0.05,
      members: seats.length,
      activeMembers: seats.filter((seat) => seat.active).length,
      users: seats.slice(0, 12),
    });
    frontier = unique.map((row) => row.id);
    if (!frontier.length) {
      for (let rest = level + 1; rest <= QLYK_ACADEMY_DEPTH; rest += 1) {
        levels.push({
          level: rest,
          rate: LEVEL_RATES[rest - 1] ?? 0.05,
          members: 0,
          activeMembers: 0,
          users: [],
        });
      }
      break;
    }
  }

  const [earned, pending] = await Promise.all([
    prisma.commission.aggregate({
      where: { beneficiaryId: userId, type: "UNILEVEL" },
      _sum: { amount: true },
    }),
    prisma.commission.aggregate({
      where: { beneficiaryId: userId, type: "UNILEVEL", status: { in: ["LOCKED", "PENDING"] } },
      _sum: { amount: true },
    }),
  ]);

  return {
    directs,
    networkSize,
    activeInNetwork,
    earnedUnilevel: fromCents(toCents(Number(earned._sum.amount ?? 0))),
    pendingUnilevel: fromCents(toCents(Number(pending._sum.amount ?? 0))),
    levels,
  };
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return empty();
  }
}
