import { prisma } from "@/lib/prisma";
import { applyRemotePayoutStatus, syncMercadoPagoPayout } from "@/lib/commerce/payouts";

export type AdminPayoutRow = {
  id: string;
  amount: number;
  amountMxn: number | null;
  fxRate: number | null;
  currency: string;
  method: string;
  status: string;
  destination: string | null;
  mpPayoutId: string | null;
  failureNote: string | null;
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
    where: { status: { in: ["PENDING", "PROCESSING"] } },
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
    amountMxn: row.amountMxn != null ? Number(row.amountMxn) : null,
    fxRate: row.fxRate != null ? Number(row.fxRate) : null,
    currency: row.currency.trim(),
    method: row.method,
    status: row.status,
    destination: row.destination,
    mpPayoutId: row.mpPayoutId,
    failureNote: row.failureNote,
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
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new AdminPayoutError("Retiro no encontrado.", "NOT_FOUND");
  if (payout.status !== "PENDING" && payout.status !== "PROCESSING") {
    throw new AdminPayoutError("Este retiro ya no está pendiente.", "INVALID_STATE");
  }

  const result = await applyRemotePayoutStatus(payoutId, "COMPLETED", "admin", {
    detail: note?.trim() || "Marcado pagado por operaciones.",
  });
  if (result.ignored && result.status !== "COMPLETED") {
    throw new AdminPayoutError("Este retiro ya no está pendiente.", "INVALID_STATE");
  }

  if (note?.trim()) {
    await prisma.payout.update({
      where: { id: payoutId },
      data: { failureNote: note.trim() },
    });
  }

  const latest = await prisma.payout.findUnique({ where: { id: payoutId } });
  return latest!;
}

export async function rejectManualPayout(payoutId: string, note: string) {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new AdminPayoutError("Retiro no encontrado.", "NOT_FOUND");
  if (payout.status !== "PENDING" && payout.status !== "PROCESSING") {
    throw new AdminPayoutError("Este retiro ya no está pendiente.", "INVALID_STATE");
  }

  const result = await applyRemotePayoutStatus(
    payoutId,
    "FAILED",
    "admin",
    { detail: note.trim() || "Retiro rechazado por operaciones." },
  );
  if (result.ignored && result.status !== "FAILED") {
    throw new AdminPayoutError("Este retiro ya no está pendiente.", "INVALID_STATE");
  }

  const latest = await prisma.payout.findUnique({ where: { id: payoutId } });
  return latest!;
}

export async function syncAdminPayout(payoutId: string) {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new AdminPayoutError("Retiro no encontrado.", "NOT_FOUND");
  if (!payout.mpPayoutId) {
    throw new AdminPayoutError("Este retiro aún no tiene identificador de Mercado Pago.", "INVALID_STATE");
  }
  await syncMercadoPagoPayout(payoutId, "admin");
  const latest = await prisma.payout.findUnique({ where: { id: payoutId } });
  return latest!;
}
