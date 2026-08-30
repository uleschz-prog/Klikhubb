import { prisma } from "@/lib/prisma";

export type AdminPayoutRow = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    username: string | null;
  };
};

export async function listPendingManualPayouts(): Promise<AdminPayoutRow[]> {
  const rows = await prisma.payout.findMany({
    where: { status: "PENDING", method: "manual" },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, email: true, displayName: true, username: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    currency: row.currency.trim(),
    method: row.method,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    user: row.user,
  }));
}

export class AdminPayoutError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "INVALID_STATE",
  ) {
    super(message);
    this.name = "AdminPayoutError";
  }
}

export async function completeManualPayout(payoutId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const payout = await tx.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new AdminPayoutError("Retiro no encontrado.", "NOT_FOUND");
    if (payout.status !== "PENDING" || payout.method !== "manual") {
      throw new AdminPayoutError("Este retiro ya no está pendiente.", "INVALID_STATE");
    }

    return tx.payout.update({
      where: { id: payoutId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        failureNote: note?.trim() || null,
      },
    });
  });
}

export async function rejectManualPayout(payoutId: string, note: string) {
  return prisma.$transaction(async (tx) => {
    const payout = await tx.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new AdminPayoutError("Retiro no encontrado.", "NOT_FOUND");
    if (payout.status !== "PENDING" || payout.method !== "manual") {
      throw new AdminPayoutError("Este retiro ya no está pendiente.", "INVALID_STATE");
    }

    const wallet = await tx.wallet.findUnique({ where: { userId: payout.userId } });
    if (wallet) {
      const updated = await tx.wallet.update({
        where: { userId: payout.userId },
        data: { available: { increment: payout.amount } },
      });

      await tx.walletLedger.create({
        data: {
          userId: payout.userId,
          amount: payout.amount,
          balanceAfter: updated.available.plus(updated.pending),
          type: "ADJUSTMENT",
          payoutId: payout.id,
          note: note.trim() || "Retiro rechazado. Saldo restaurado.",
        },
      });
    }

    return tx.payout.update({
      where: { id: payoutId },
      data: {
        status: "FAILED",
        failureNote: note.trim() || "Retiro rechazado por operaciones.",
      },
    });
  });
}
