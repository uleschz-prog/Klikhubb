import { CommissionType, Prisma, UserStatus } from "@prisma/client";
import { PLATFORM_ADMIN } from "@/config/platform-admin";
import { prisma } from "@/lib/prisma";

export class AdminUsersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminUsersError";
  }
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  status: UserStatus;
  referralCode: string;
  createdAt: string;
  lastLoginAt: string | null;
  isAdmin: boolean;
  sponsorCode: string | null;
  invitedCount: number;
  walletAvailable: number;
  walletPending: number;
  lockedNetwork: number;
  lockedNetworkCount: number;
};

export type AdminUsersOverview = {
  users: number;
  active: number;
  suspended: number;
  lockedNetwork: number;
  lockedNetworkCount: number;
};

function isPlatformAdminUser(user: {
  email?: string | null;
  username?: string | null;
  referralCode?: string | null;
  roles?: { role: string }[];
}) {
  if (user.roles?.some((row) => row.role === "ADMIN")) return true;
  if (user.email?.toLowerCase() === PLATFORM_ADMIN.email) return true;
  if (user.username?.toLowerCase() === PLATFORM_ADMIN.username.toLowerCase()) return true;
  if (user.referralCode?.toUpperCase() === PLATFORM_ADMIN.referralCode) return true;
  return false;
}

export async function loadAdminUsersOverview(): Promise<AdminUsersOverview> {
  const [users, active, suspended, locked] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: { in: ["SUSPENDED", "BANNED"] } } }),
    prisma.commission.aggregate({
      where: { status: "LOCKED", type: CommissionType.UNILEVEL },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    users,
    active,
    suspended,
    lockedNetwork: Number(locked._sum.amount ?? 0),
    lockedNetworkCount: locked._count,
  };
}

export async function listAdminUsers(query?: string): Promise<AdminUserRow[]> {
  const q = query?.trim();
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
          { referralCode: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const rows = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      status: true,
      referralCode: true,
      createdAt: true,
      lastLoginAt: true,
      roles: { select: { role: true } },
      invitedBy: { select: { referralCode: true, username: true } },
      wallet: { select: { available: true, pending: true } },
      _count: { select: { invitedUsers: true } },
    },
  });

  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return [];

  const locked = await prisma.commission.groupBy({
    by: ["beneficiaryId"],
    where: {
      beneficiaryId: { in: ids },
      status: "LOCKED",
      type: CommissionType.UNILEVEL,
    },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const lockedMap = new Map(locked.map((row) => [row.beneficiaryId, row]));

  return rows.map((row) => {
    const hold = lockedMap.get(row.id);
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      displayName: row.displayName,
      status: row.status,
      referralCode: row.referralCode,
      createdAt: row.createdAt.toISOString(),
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      isAdmin: isPlatformAdminUser(row),
      sponsorCode: row.invitedBy?.referralCode ?? row.invitedBy?.username ?? null,
      invitedCount: row._count.invitedUsers,
      walletAvailable: Number(row.wallet?.available ?? 0),
      walletPending: Number(row.wallet?.pending ?? 0),
      lockedNetwork: Number(hold?._sum.amount ?? 0),
      lockedNetworkCount: hold?._count._all ?? 0,
    };
  });
}

export async function setAdminUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      referralCode: true,
      roles: { select: { role: true } },
    },
  });
  if (!user) throw new AdminUsersError("Usuario no encontrado.");
  if (isPlatformAdminUser(user)) {
    throw new AdminUsersError("La cuenta administradora no se puede desactivar.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  if (status === "SUSPENDED") {
    await prisma.session.deleteMany({ where: { userId } }).catch(() => undefined);
  }

  return { id: userId, status };
}
