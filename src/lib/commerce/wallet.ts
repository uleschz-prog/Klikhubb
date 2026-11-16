import { LedgerType, Prisma } from "@prisma/client";
import { COMPENSATION_PLAN_V1, creatorHoldLabel, creatorHoldMs } from "@/config/compensation-plan";
import { prisma } from "@/lib/prisma";
import { fromCents } from "@/lib/money/cents";
import {
  demoLoadWalletView,
  demoReleaseMature,
  demoRequestPayout,
  shouldUseDemoFallback,
} from "@/lib/demo/store";
import { MIN_PAYOUT_CENTS, WalletError } from "@/lib/commerce/wallet-core";

export { MIN_PAYOUT_CENTS, WalletError };

function asMoney(value: Prisma.Decimal | number): Prisma.Decimal {
  return new Prisma.Decimal(Number(value).toFixed(4));
}

export type WalletHold = {
  id: string;
  amount: number;
  availableAt: string;
  kind: "sale" | "hold";
  productTitle: string;
};

export type WalletMovement = {
  id: string;
  amount: number;
  balanceAfter: number;
  type: LedgerType | string;
  note: string | null;
  createdAt: string;
};

export type WalletPayoutRow = {
  id: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
};

export type WalletView = {
  available: number;
  pending: number;
  lifetimeEarned: number;
  currency: string;
  holdDays: number;
  holdLabel: string;
  minPayout: number;
  nextReleaseAt: string | null;
  holds: WalletHold[];
  ledger: WalletMovement[];
  payouts: WalletPayoutRow[];
  demo: boolean;
  mpPayoutEmail: string | null;
  usdtTrc20Address: string | null;
};

export type ReleaseResult = {
  released: number;
  amount: number;
};

export function formatWalletDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
}

export function ledgerLabel(type: string): string {
  switch (type) {
    case "SALE":
      return "Venta";
    case "COMMISSION":
      return "Ajuste";
    case "FEE":
      return "Plataforma";
    case "PAYOUT":
      return "Retiro";
    case "REFUND":
      return "Reembolso";
    case "CLAWBACK":
      return "Ajuste";
    case "ADJUSTMENT":
      return "Liberado";
    default:
      return type;
  }
}

export async function releaseMatureCommissions(userId?: string): Promise<ReleaseResult> {
  try {
    return await releaseInDb(userId);
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return demoReleaseMature(userId);
  }
}

export async function forceReleaseCommissions(input?: {
  userId?: string;
  unilevelOnly?: boolean;
}): Promise<ReleaseResult> {
  try {
    await prisma.commission.updateMany({
      where: {
        status: "LOCKED",
        ...(input?.userId ? { beneficiaryId: input.userId } : {}),
        ...(input?.unilevelOnly ? { type: "UNILEVEL" } : {}),
      },
      data: { availableAt: new Date() },
    });

    let released = 0;
    let amount = 0;
    for (let i = 0; i < 8; i += 1) {
      const batch = await releaseInDb(input?.userId);
      released += batch.released;
      amount += batch.amount;
      if (batch.released === 0) break;
    }
    return { released, amount };
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return demoReleaseMature(input?.userId);
  }
}

export async function loadWalletView(userId: string): Promise<WalletView> {
  try {
    await releaseInDb(userId);
    return await readWalletView(userId);
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return demoLoadWalletView(userId);
  }
}

export async function requestPayout(
  userId: string,
  amount?: number,
  method?: "mercadopago" | "usdt" | "manual",
) {
  try {
    await releaseInDb(userId);
    const { requestCreatorPayout } = await import("@/lib/commerce/payouts");
    return await requestCreatorPayout(userId, amount, method);
  } catch (error) {
    if (error instanceof WalletError) throw error;
    if (!shouldUseDemoFallback(error)) throw error;
  }

  try {
    return await demoRequestPayout(userId, amount);
  } catch (error) {
    throw toWalletError(error);
  }
}

function toWalletError(error: unknown): WalletError {
  if (error instanceof WalletError) return error;
  const code =
    error && typeof error === "object" && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : "No se pudo solicitar el retiro.";
  if (code === "MINIMUM" || code === "INSUFFICIENT" || code === "USER_NOT_FOUND" || code === "DESTINATION_REQUIRED") {
    return new WalletError(message, code);
  }
  if (message === "USER_NOT_FOUND") {
    return new WalletError("Aún no tienes monedero. Primero vende o invita.", "USER_NOT_FOUND");
  }
  throw error instanceof Error ? error : new Error(message);
}

async function releaseInDb(userId?: string): Promise<ReleaseResult> {
  const now = new Date();
  const holdMs = creatorHoldMs();

  const locked = await prisma.commission.findMany({
    where: {
      status: "LOCKED",
      ...(userId ? { beneficiaryId: userId } : {}),
    },
    select: { id: true, createdAt: true, availableAt: true },
    take: 400,
  });
  for (const row of locked) {
    const dueAt = new Date(row.createdAt.getTime() + holdMs);
    if (row.availableAt && row.availableAt.getTime() > dueAt.getTime()) {
      await prisma.commission.update({
        where: { id: row.id },
        data: { availableAt: dueAt },
      });
    }
  }

  const due = await prisma.commission.findMany({
    where: {
      status: "LOCKED",
      availableAt: { lte: now },
      ...(userId ? { beneficiaryId: userId } : {}),
    },
    orderBy: { availableAt: "asc" },
    take: 400,
  });

  let released = 0;
  let amount = 0;

  for (const row of due) {
    const moved = await prisma.$transaction(async (tx) => {
      const claimed = await tx.commission.updateMany({
        where: { id: row.id, status: "LOCKED" },
        data: { status: "APPROVED" },
      });
      if (claimed.count !== 1) return 0;

      const wallet = await tx.wallet.findUnique({ where: { userId: row.beneficiaryId } });
      if (!wallet) return 0;

      const move = DecimalMin(asMoney(wallet.pending), asMoney(row.amount));
      if (move.lte(0)) return 0;

      const updated = await tx.wallet.update({
        where: { userId: row.beneficiaryId },
        data: {
          pending: { decrement: move },
          available: { increment: move },
        },
      });

      await tx.walletLedger.create({
        data: {
          userId: row.beneficiaryId,
          amount: move,
          balanceAfter: asMoney(Number(updated.available) + Number(updated.pending)),
          type: LedgerType.ADJUSTMENT,
          commissionId: row.id,
          orderId: row.orderId,
          note: `Hold de ${creatorHoldLabel()} terminado`,
        },
      });

      return Number(move);
    });

    if (moved > 0) {
      released += 1;
      amount += moved;
    }
  }

  const pendingWallets = userId
    ? []
    : await prisma.wallet.findMany({
        where: { pending: { gt: 0 } },
        select: { userId: true },
        take: 400,
      });
  const userIds = userId
    ? [userId]
    : Array.from(new Set([...due.map((row) => row.beneficiaryId), ...pendingWallets.map((row) => row.userId)]));

  for (const id of userIds) {
    amount += await reconcileUnlockedPending(id);
  }

  return { released, amount };
}

async function reconcileUnlockedPending(userId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const [wallet, locked] = await Promise.all([
      tx.wallet.findUnique({ where: { userId } }),
      tx.commission.aggregate({
        where: { beneficiaryId: userId, status: "LOCKED" },
        _sum: { amount: true },
      }),
    ]);
    if (!wallet) return 0;

    const excess = asMoney(wallet.pending).minus(asMoney(locked._sum.amount ?? 0));
    if (excess.lte(0.0001)) return 0;

    const updated = await tx.wallet.update({
      where: { userId },
      data: {
        pending: { decrement: excess },
        available: { increment: excess },
      },
    });

    await tx.walletLedger.create({
      data: {
        userId,
        amount: excess,
        balanceAfter: asMoney(Number(updated.available) + Number(updated.pending)),
        type: LedgerType.ADJUSTMENT,
        note: "Saldo sin hold (fee u origen directo)",
      },
    });

    return Number(excess);
  });
}

function DecimalMin(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
  return a.lte(b) ? a : b;
}

async function readWalletView(userId: string): Promise<WalletView> {
  const [wallet, holds, ledger, payouts] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.commission.findMany({
      where: { beneficiaryId: userId, status: "LOCKED" },
      orderBy: { availableAt: "asc" },
      take: 40,
      include: {
        order: {
          include: {
            items: { include: { product: { select: { title: true } } }, take: 1 },
          },
        },
      },
    }),
    prisma.walletLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const mappedHolds: WalletHold[] = holds.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    availableAt: (row.availableAt ?? row.createdAt).toISOString(),
    kind: row.type === "CREATOR_SALE" ? "sale" : "hold",
    productTitle: row.order.items[0]?.product.title ?? "Venta",
  }));

  return {
    available: Number(wallet?.available ?? 0),
    pending: Number(wallet?.pending ?? 0),
    lifetimeEarned: Number(wallet?.lifetimeEarned ?? 0),
    currency: wallet?.currency.trim() || "USD",
    holdDays: COMPENSATION_PLAN_V1.holdDays,
    holdLabel: creatorHoldLabel(),
    minPayout: fromCents(MIN_PAYOUT_CENTS),
    nextReleaseAt: mappedHolds[0]?.availableAt ?? null,
    holds: mappedHolds,
    ledger: ledger.map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      balanceAfter: Number(row.balanceAfter),
      type: row.type,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    })),
    payouts: payouts.map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      status: row.status,
      method: row.method,
      createdAt: row.createdAt.toISOString(),
    })),
    demo: false,
    mpPayoutEmail: wallet?.mpPayoutEmail ?? null,
    usdtTrc20Address: wallet?.usdtTrc20Address ?? null,
  };
}
