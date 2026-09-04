import { randomBytes } from "crypto";
import { CreatorBillingPlan, CreatorPlanInvoiceStatus, Prisma } from "@prisma/client";
import {
  CREATOR_FLAT_PRICE_USD,
  CREATOR_PLAN_FLAT,
  CREATOR_PLAN_PAYG,
  ratesForCreatorPlan,
  resolveEffectiveCreatorPlan,
  addFlatPeriod,
  type CreatorPlanCode,
} from "@/lib/commerce/creator-plans";
import { getPaymentInstructions } from "@/config/payment-instructions";
import { prisma } from "@/lib/prisma";

export class CreatorPlanError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "INVALID_STATE"
      | "FORBIDDEN"
      | "NOT_CONFIGURED"
      | "ALREADY_PENDING",
  ) {
    super(message);
    this.name = "CreatorPlanError";
  }
}

function generateReference() {
  return `PLAN-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function toPlanCode(value: CreatorBillingPlan | string | null | undefined): CreatorPlanCode {
  return value === "FLAT" || value === "flat" ? "flat" : "payg";
}

export type CreatorPlanSnapshot = {
  preferredPlan: CreatorPlanCode;
  effectivePlan: CreatorPlanCode;
  planUntil: string | null;
  flatActive: boolean;
  payg: typeof CREATOR_PLAN_PAYG;
  flat: typeof CREATOR_PLAN_FLAT;
  pendingInvoice: {
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    proofUrl: string | null;
    proofNote: string | null;
    createdAt: string;
  } | null;
  instructions: ReturnType<typeof getPaymentInstructions>;
};

export async function getCreatorPlanSnapshot(userId: string): Promise<CreatorPlanSnapshot> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creatorPlan: true, creatorPlanUntil: true },
  });
  if (!user) throw new CreatorPlanError("Usuario no encontrado.", "NOT_FOUND");

  const preferredPlan = toPlanCode(user.creatorPlan);
  const effectivePlan = resolveEffectiveCreatorPlan({
    preferredPlan,
    planUntil: user.creatorPlanUntil,
  });
  const pending = await prisma.creatorPlanInvoice.findFirst({
    where: { userId, status: { in: ["PENDING", "PROOF_SUBMITTED"] } },
    orderBy: { createdAt: "desc" },
  });

  return {
    preferredPlan,
    effectivePlan,
    planUntil: user.creatorPlanUntil?.toISOString() ?? null,
    flatActive: effectivePlan === "flat",
    payg: CREATOR_PLAN_PAYG,
    flat: CREATOR_PLAN_FLAT,
    pendingInvoice: pending
      ? {
          id: pending.id,
          reference: pending.reference,
          amount: Number(pending.amount),
          currency: pending.currency.trim(),
          status: pending.status,
          proofUrl: pending.proofUrl,
          proofNote: pending.proofNote,
          createdAt: pending.createdAt.toISOString(),
        }
      : null,
    instructions: getPaymentInstructions(),
  };
}

export async function switchCreatorPlan(input: {
  userId: string;
  plan: CreatorPlanCode;
}): Promise<CreatorPlanSnapshot> {
  if (input.plan === "payg") {
    await prisma.user.update({
      where: { id: input.userId },
      data: { creatorPlan: CreatorBillingPlan.PAYG },
    });
    // Cancela facturas SPEI pendientes del plan mensual.
    await prisma.creatorPlanInvoice.updateMany({
      where: { userId: input.userId, status: { in: ["PENDING", "PROOF_SUBMITTED"] } },
      data: { status: CreatorPlanInvoiceStatus.CANCELED },
    });
    return getCreatorPlanSnapshot(input.userId);
  }

  await prisma.user.update({
    where: { id: input.userId },
    data: { creatorPlan: CreatorBillingPlan.FLAT },
  });

  const snapshot = await getCreatorPlanSnapshot(input.userId);
  if (snapshot.flatActive) return snapshot;

  // Sin periodo activo: crea (o reutiliza) factura SPEI de $25.
  await ensureFlatInvoice(input.userId);
  return getCreatorPlanSnapshot(input.userId);
}

export async function ensureFlatInvoice(userId: string) {
  const existing = await prisma.creatorPlanInvoice.findFirst({
    where: { userId, status: { in: ["PENDING", "PROOF_SUBMITTED"] } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  let reference = generateReference();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.creatorPlanInvoice.create({
        data: {
          reference,
          userId,
          amount: new Prisma.Decimal(CREATOR_FLAT_PRICE_USD.toFixed(4)),
          currency: "USD",
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        reference = generateReference();
        continue;
      }
      throw error;
    }
  }
  throw new CreatorPlanError("No se pudo crear la factura del plan.", "INVALID_STATE");
}

export async function submitCreatorPlanProof(input: {
  userId: string;
  invoiceId: string;
  proofUrl?: string | null;
  proofNote?: string | null;
}) {
  const note = input.proofNote?.trim() || null;
  const url = input.proofUrl?.trim() || null;
  if (!note && !url) {
    throw new CreatorPlanError("Adjunta un comprobante o escribe una nota.", "INVALID_STATE");
  }

  const row = await prisma.creatorPlanInvoice.findUnique({ where: { id: input.invoiceId } });
  if (!row) throw new CreatorPlanError("Factura no encontrada.", "NOT_FOUND");
  if (row.userId !== input.userId) throw new CreatorPlanError("No autorizado.", "FORBIDDEN");
  if (row.status === "PAID") throw new CreatorPlanError("Esta factura ya está pagada.", "INVALID_STATE");
  if (row.status === "REJECTED" || row.status === "CANCELED") {
    throw new CreatorPlanError("Esta factura ya no admite comprobante. Genera una nueva.", "INVALID_STATE");
  }

  await prisma.creatorPlanInvoice.update({
    where: { id: row.id },
    data: {
      status: CreatorPlanInvoiceStatus.PROOF_SUBMITTED,
      proofUrl: url,
      proofNote: note,
    },
  });

  return getCreatorPlanSnapshot(input.userId);
}

export async function listPendingCreatorPlanInvoices() {
  const rows = await prisma.creatorPlanInvoice.findMany({
    where: { status: { in: ["PENDING", "PROOF_SUBMITTED"] } },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, email: true, displayName: true, username: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    amount: Number(row.amount),
    currency: row.currency.trim(),
    status: row.status,
    proofUrl: row.proofUrl,
    proofNote: row.proofNote,
    createdAt: row.createdAt.toISOString(),
    user: row.user,
  }));
}

export async function approveCreatorPlanInvoice(input: {
  invoiceId: string;
  reviewerId: string;
  note?: string | null;
}) {
  const row = await prisma.creatorPlanInvoice.findUnique({ where: { id: input.invoiceId } });
  if (!row) throw new CreatorPlanError("Factura no encontrada.", "NOT_FOUND");
  if (row.status === "PAID") return getCreatorPlanSnapshot(row.userId);
  if (row.status === "REJECTED" || row.status === "CANCELED") {
    throw new CreatorPlanError("No puedes aprobar una factura cancelada o rechazada.", "INVALID_STATE");
  }

  const user = await prisma.user.findUnique({
    where: { id: row.userId },
    select: { creatorPlanUntil: true },
  });
  if (!user) throw new CreatorPlanError("Usuario no encontrado.", "NOT_FOUND");

  const now = new Date();
  const base =
    user.creatorPlanUntil && user.creatorPlanUntil.getTime() > now.getTime()
      ? user.creatorPlanUntil
      : now;
  const periodStart = base;
  const periodEnd = addFlatPeriod(base);

  await prisma.$transaction(async (tx) => {
    await tx.creatorPlanInvoice.update({
      where: { id: row.id },
      data: {
        status: CreatorPlanInvoiceStatus.PAID,
        reviewedAt: now,
        reviewedById: input.reviewerId,
        reviewerNote: input.note?.trim() || null,
        paidAt: now,
        periodStart,
        periodEnd,
      },
    });
    await tx.user.update({
      where: { id: row.userId },
      data: {
        creatorPlan: CreatorBillingPlan.FLAT,
        creatorPlanUntil: periodEnd,
      },
    });
    // Cierra otras facturas abiertas del mismo usuario.
    await tx.creatorPlanInvoice.updateMany({
      where: {
        userId: row.userId,
        id: { not: row.id },
        status: { in: ["PENDING", "PROOF_SUBMITTED"] },
      },
      data: { status: CreatorPlanInvoiceStatus.CANCELED },
    });
  });

  return getCreatorPlanSnapshot(row.userId);
}

export async function rejectCreatorPlanInvoice(input: {
  invoiceId: string;
  reviewerId: string;
  note: string;
}) {
  const note = input.note.trim();
  if (!note) throw new CreatorPlanError("Escribe el motivo del rechazo.", "INVALID_STATE");

  const row = await prisma.creatorPlanInvoice.findUnique({ where: { id: input.invoiceId } });
  if (!row) throw new CreatorPlanError("Factura no encontrada.", "NOT_FOUND");
  if (row.status === "PAID") {
    throw new CreatorPlanError("No puedes rechazar una factura ya pagada.", "INVALID_STATE");
  }

  await prisma.creatorPlanInvoice.update({
    where: { id: row.id },
    data: {
      status: CreatorPlanInvoiceStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedById: input.reviewerId,
      reviewerNote: note,
    },
  });

  return { ok: true };
}

/** Resuelve las tasas de comisión según el plan efectivo del vendedor. */
export async function getSellerCommissionPlan(sellerId: string) {
  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { creatorPlan: true, creatorPlanUntil: true },
  });
  const effective = resolveEffectiveCreatorPlan({
    preferredPlan: user?.creatorPlan,
    planUntil: user?.creatorPlanUntil,
  });
  return ratesForCreatorPlan(effective);
}
