import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { getPaymentInstructions } from "@/config/payment-instructions";
import { prisma } from "@/lib/prisma";
import { settlePaidOrder } from "@/lib/commerce/settle-order";
import { revokeCourseAccessForRefund } from "@/lib/commerce/refunds";

export class ManualPaymentError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "INVALID_STATE"
      | "FORBIDDEN"
      | "ALREADY_PENDING"
      | "NOT_CONFIGURED",
  ) {
    super(message);
    this.name = "ManualPaymentError";
  }
}

export type ManualPaymentRow = {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  proofUrl: string | null;
  proofNote: string | null;
  reviewerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  buyer: {
    id: string;
    email: string | null;
    displayName: string | null;
    username: string | null;
  };
  product: {
    id: string;
    slug: string;
    title: string;
  };
  orderId: string | null;
};

function generateReference() {
  return `QLYK-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createManualPaymentRequest(input: {
  buyerId: string;
  productId: string;
  amount: number;
  currency: string;
}) {
  const instructions = getPaymentInstructions();
  if (!instructions) {
    throw new ManualPaymentError("Pagos manuales no configurados.", "NOT_CONFIGURED");
  }

  const existing = await prisma.manualPaymentRequest.findFirst({
    where: {
      buyerId: input.buyerId,
      productId: input.productId,
      status: { in: ["PENDING", "PROOF_SUBMITTED"] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return {
      requestId: existing.id,
      reference: existing.reference,
      amount: Number(existing.amount),
      currency: existing.currency.trim(),
      status: existing.status,
      instructions,
    };
  }

  let reference = generateReference();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const row = await prisma.manualPaymentRequest.create({
        data: {
          reference,
          buyerId: input.buyerId,
          productId: input.productId,
          amount: new Prisma.Decimal(input.amount.toFixed(4)),
          currency: input.currency.trim().toUpperCase().slice(0, 3),
        },
      });
      return {
        requestId: row.id,
        reference: row.reference,
        amount: Number(row.amount),
        currency: row.currency.trim(),
        status: row.status,
        instructions,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        reference = generateReference();
        continue;
      }
      throw error;
    }
  }

  throw new ManualPaymentError("No se pudo crear la solicitud de pago.", "INVALID_STATE");
}

export async function submitManualPaymentProof(input: {
  requestId: string;
  buyerId: string;
  proofUrl?: string | null;
  proofNote?: string | null;
}) {
  const proofUrl = input.proofUrl?.trim() || null;
  const proofNote = input.proofNote?.trim() || null;
  if (!proofUrl && !proofNote) {
    throw new ManualPaymentError("Adjunta un comprobante o escribe una nota.", "INVALID_STATE");
  }

  const row = await prisma.manualPaymentRequest.findUnique({ where: { id: input.requestId } });
  if (!row) throw new ManualPaymentError("Solicitud no encontrada.", "NOT_FOUND");
  if (row.buyerId !== input.buyerId) throw new ManualPaymentError("No autorizado.", "FORBIDDEN");
  if (row.status === "APPROVED") {
    return { requestId: row.id, status: row.status, orderId: row.orderId };
  }
  if (row.status === "REJECTED") {
    throw new ManualPaymentError("Esta solicitud fue rechazada. Crea una nueva compra.", "INVALID_STATE");
  }

  const updated = await prisma.manualPaymentRequest.update({
    where: { id: row.id },
    data: {
      proofUrl,
      proofNote,
      status: "PROOF_SUBMITTED",
    },
  });

  return { requestId: updated.id, status: updated.status, orderId: updated.orderId };
}

export async function listPendingManualPayments(): Promise<ManualPaymentRow[]> {
  const rows = await prisma.manualPaymentRequest.findMany({
    where: { status: { in: ["PENDING", "PROOF_SUBMITTED"] } },
    orderBy: { createdAt: "asc" },
    include: {
      buyer: { select: { id: true, email: true, displayName: true, username: true } },
      product: { select: { id: true, slug: true, title: true } },
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
    reviewerNote: row.reviewerNote,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    buyer: row.buyer,
    product: row.product,
    orderId: row.orderId,
  }));
}

export async function approveManualPayment(input: {
  requestId: string;
  reviewerId: string;
  note?: string;
}) {
  const row = await prisma.manualPaymentRequest.findUnique({
    where: { id: input.requestId },
    include: { product: { select: { id: true, title: true } } },
  });
  if (!row) throw new ManualPaymentError("Solicitud no encontrada.", "NOT_FOUND");
  if (row.status === "APPROVED" && row.orderId) {
    return { orderId: row.orderId, reference: row.reference, alreadyApproved: true };
  }
  if (row.status === "REJECTED") {
    throw new ManualPaymentError("Esta solicitud ya fue rechazada.", "INVALID_STATE");
  }

  const settled = await settlePaidOrder({
    buyerId: row.buyerId,
    productId: row.productId,
    provider: "manual",
    providerRef: row.reference,
  });

  await prisma.manualPaymentRequest.update({
    where: { id: row.id },
    data: {
      status: "APPROVED",
      orderId: settled.orderId,
      reviewedAt: new Date(),
      reviewedById: input.reviewerId,
      reviewerNote: input.note?.trim() || null,
    },
  });

  return { orderId: settled.orderId, reference: row.reference, alreadyApproved: false };
}

export async function rejectManualPayment(input: {
  requestId: string;
  reviewerId: string;
  note: string;
}) {
  const note = input.note.trim();
  if (!note) throw new ManualPaymentError("Escribe el motivo del rechazo.", "INVALID_STATE");

  const row = await prisma.manualPaymentRequest.findUnique({ where: { id: input.requestId } });
  if (!row) throw new ManualPaymentError("Solicitud no encontrada.", "NOT_FOUND");
  if (row.status === "APPROVED") {
    throw new ManualPaymentError("No puedes rechazar un pago ya aprobado.", "INVALID_STATE");
  }
  if (row.status === "REJECTED") {
    return { requestId: row.id, status: row.status };
  }

  const updated = await prisma.manualPaymentRequest.update({
    where: { id: row.id },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedById: input.reviewerId,
      reviewerNote: note,
    },
  });

  return { requestId: updated.id, status: updated.status };
}

export async function revokeManualPaymentAccess(input: {
  requestId: string;
  reviewerId: string;
  note: string;
}) {
  const row = await prisma.manualPaymentRequest.findUnique({ where: { id: input.requestId } });
  if (!row?.orderId) throw new ManualPaymentError("Esta solicitud no tiene orden pagada.", "INVALID_STATE");

  await revokeCourseAccessForRefund({
    buyerId: row.buyerId,
    productId: row.productId,
    orderId: row.orderId,
    note: input.note,
  });

  await prisma.manualPaymentRequest.update({
    where: { id: row.id },
    data: {
      reviewerNote: input.note.trim(),
      reviewedAt: new Date(),
      reviewedById: input.reviewerId,
    },
  });

  return { ok: true as const, orderId: row.orderId };
}
