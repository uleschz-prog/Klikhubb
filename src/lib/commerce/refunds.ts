import { CommissionStatus, LedgerType, Prisma } from "@prisma/client";
import { BUYER_REFUND_WINDOW_HOURS, isWithinBuyerRefundWindow } from "@/config/refund-policy";
import { getStripe, isStripeEnabled } from "@/lib/commerce/stripe";
import { fromCents, toCents } from "@/lib/money/cents";
import { prisma } from "@/lib/prisma";
import { notifyAndEmail } from "@/lib/notifications";

export class RefundError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "WINDOW_CLOSED"
      | "ALREADY_REFUNDED"
      | "NO_ACCESS"
      | "STRIPE_FAILED",
  ) {
    super(message);
    this.name = "RefundError";
  }
}

export type RevokeAccessResult = {
  revoked: boolean;
  buyerId: string | null;
  productId: string | null;
  orderId: string | null;
  enrollmentId: string | null;
};

function money(cents: number): Prisma.Decimal {
  return new Prisma.Decimal(fromCents(cents).toFixed(4));
}

/** Quita acceso al curso/producto tras un reembolso. Idempotente. */
export async function revokeCourseAccessForRefund(input: {
  buyerId: string;
  productId: string;
  orderId?: string | null;
  note?: string;
}): Promise<RevokeAccessResult> {
  await prisma.$transaction(async (tx) => {
    if (input.orderId) {
      await tx.order.updateMany({
        where: { id: input.orderId, status: "PAID" },
        data: { status: "REFUNDED" },
      });
      await tx.payment.updateMany({
        where: { orderId: input.orderId, status: "SUCCEEDED" },
        data: { status: "REFUNDED" },
      });
      await clawbackOrderEarnings(tx, input.orderId);
    }

    const enrollment = await tx.enrollment.findUnique({
      where: { userId_productId: { userId: input.buyerId, productId: input.productId } },
    });

    if (enrollment && enrollment.status !== "REVOKED") {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "REVOKED" },
      });
    }

    const community = await tx.community.findFirst({
      where: { productId: input.productId },
      select: { id: true },
    });
    if (community) {
      const removed = await tx.communityMember.deleteMany({
        where: { communityId: community.id, userId: input.buyerId, role: "MEMBER" },
      });
      if (removed.count > 0) {
        await tx.community.update({
          where: { id: community.id },
          data: { memberCount: { decrement: removed.count } },
        });
      }
    }
  });

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_productId: { userId: input.buyerId, productId: input.productId } },
  });

  return {
    revoked: enrollment?.status === "REVOKED",
    buyerId: input.buyerId,
    productId: input.productId,
    orderId: input.orderId ?? null,
    enrollmentId: enrollment?.id ?? null,
  };
}

async function clawbackOrderEarnings(tx: Prisma.TransactionClient, orderId: string) {
  const already = await tx.walletLedger.findFirst({
    where: { orderId, type: { in: [LedgerType.CLAWBACK, LedgerType.REFUND] } },
    select: { id: true },
  });
  if (already) return;

  const commissions = await tx.commission.findMany({
    where: { orderId, status: { not: CommissionStatus.CLAWED_BACK } },
  });

  for (const commission of commissions) {
    await debitWallet(tx, {
      userId: commission.beneficiaryId,
      cents: toCents(Number(commission.amount)),
      type: LedgerType.CLAWBACK,
      orderId,
      commissionId: commission.id,
      note: "Devolución del comprador (24 h)",
    });
    await tx.commission.update({
      where: { id: commission.id },
      data: { status: CommissionStatus.CLAWED_BACK },
    });
  }

  const feeRows = await tx.walletLedger.findMany({
    where: { orderId, type: LedgerType.FEE },
  });
  for (const row of feeRows) {
    const cents = toCents(Number(row.amount));
    if (cents <= 0) continue;
    await debitWallet(tx, {
      userId: row.userId,
      cents,
      type: LedgerType.REFUND,
      orderId,
      note: "Devolución: tarifa de plataforma",
    });
  }
}

async function debitWallet(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    cents: number;
    type: LedgerType;
    orderId: string;
    commissionId?: string;
    note: string;
  },
) {
  if (input.cents <= 0) return;
  const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
  if (!wallet) return;

  const pending = toCents(Number(wallet.pending));
  const available = toCents(Number(wallet.available));
  const fromPending = Math.min(pending, input.cents);
  const fromAvailable = Math.min(available, input.cents - fromPending);
  const taken = fromPending + fromAvailable;
  if (taken <= 0) return;

  const lifetime = toCents(Number(wallet.lifetimeEarned));
  const updated = await tx.wallet.update({
    where: { userId: input.userId },
    data: {
      pending: { decrement: money(fromPending) },
      available: { decrement: money(fromAvailable) },
      lifetimeEarned: { decrement: money(Math.min(lifetime, taken)) },
    },
  });

  await tx.walletLedger.create({
    data: {
      userId: input.userId,
      amount: money(taken).negated(),
      balanceAfter: new Prisma.Decimal((Number(updated.available) + Number(updated.pending)).toFixed(4)),
      type: input.type,
      commissionId: input.commissionId,
      orderId: input.orderId,
      note: input.note,
    },
  });
}

async function refundStripeCharge(providerRef: string, orderId: string) {
  if (!isStripeEnabled()) return;
  if (!providerRef.startsWith("cs_") && !providerRef.startsWith("pi_")) return;

  const stripe = getStripe();
  let paymentIntentId = providerRef.startsWith("pi_") ? providerRef : null;

  if (providerRef.startsWith("cs_")) {
    const session = await stripe.checkout.sessions.retrieve(providerRef);
    const intent = session.payment_intent;
    paymentIntentId = typeof intent === "string" ? intent : intent?.id ?? null;
  }

  if (!paymentIntentId) return;

  try {
    await stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { idempotencyKey: `qlyk_refund_${orderId}` },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/already been refunded|has already been refunded/i.test(message)) return;
    throw new RefundError(
      "Stripe no pudo devolver el cargo. Inténtalo de nuevo o escribe a soporte.",
      "STRIPE_FAILED",
    );
  }
}

export async function requestBuyerCourseRefund(buyerId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { take: 1, include: { product: { select: { id: true, title: true, slug: true, type: true } } } },
      payments: { take: 1 },
    },
  });

  if (!order) throw new RefundError("No encontramos este pedido.", "NOT_FOUND");
  if (order.buyerId !== buyerId) throw new RefundError("Este pedido no es tuyo.", "FORBIDDEN");
  if (order.status === "REFUNDED") {
    throw new RefundError("Este pedido ya fue reembolsado.", "ALREADY_REFUNDED");
  }
  if (order.status !== "PAID") {
    throw new RefundError("Este pedido no se puede reembolsar.", "NO_ACCESS");
  }

  const product = order.items[0]?.product;
  if (!product) throw new RefundError("Este pedido no tiene curso.", "NOT_FOUND");

  const paidAt = order.paidAt ?? order.createdAt;
  if (!isWithinBuyerRefundWindow(paidAt)) {
    throw new RefundError(
      `La devolución se pide dentro de las ${BUYER_REFUND_WINDOW_HOURS} horas posteriores a la compra.`,
      "WINDOW_CLOSED",
    );
  }

  const payment = order.payments[0];
  if (payment?.provider === "stripe" && payment.providerRef) {
    await refundStripeCharge(payment.providerRef, order.id);
  }

  const result = await revokeCourseAccessForRefund({
    buyerId,
    productId: product.id,
    orderId: order.id,
    note: "Devolución solicitada por el comprador (24 h)",
  });

  await prisma.manualPaymentRequest.updateMany({
    where: { orderId: order.id },
    data: {
      reviewerNote: "Devolución pedida por el comprador en las primeras 24 h. Reembolsar SPEI si aplica.",
    },
  });

  await notifyAndEmail({
    userId: buyerId,
    type: "SYSTEM",
    title: "Devolución aceptada",
    body:
      payment?.provider === "stripe"
        ? `Reembolsamos «${product.title}». Stripe devuelve el cargo a tu tarjeta. Ya no tienes acceso al curso.`
        : `Aceptamos la devolución de «${product.title}». Si pagaste por SPEI, Qlyk te transfiere de vuelta. Ya no tienes acceso al curso.`,
    href: "/orders",
    emailSubject: `Qlyk · Devolución de ${product.title}`,
  });

  if (order.sellerId) {
    await notifyAndEmail({
      userId: order.sellerId,
      type: "SYSTEM",
      title: "Devolución de una venta",
      body: `El comprador pidió la devolución de «${product.title}» dentro de las 24 horas. El acceso se revocó y el importe se descontó del monedero.`,
      href: "/wallet",
      emailSubject: `Qlyk · Devolución de ${product.title}`,
    });
  }

  return {
    ...result,
    ok: true as const,
    productTitle: product.title,
    mode: payment?.provider === "stripe" ? ("stripe" as const) : ("manual" as const),
  };
}

export async function handleStripeChargeRefunded(paymentIntentId: string | null) {
  if (!paymentIntentId) return { ignored: true as const };

  const stripe = getStripe();
  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
  const sessionId = sessions.data[0]?.id;
  const payment = sessionId
    ? await prisma.payment.findUnique({
        where: { provider_providerRef: { provider: "stripe", providerRef: sessionId } },
        include: { order: { include: { items: { take: 1 } } } },
      })
    : await prisma.payment.findFirst({
        where: { provider: "stripe", providerRef: paymentIntentId },
        include: { order: { include: { items: { take: 1 } } } },
      });

  if (!payment?.order) return { ignored: true as const };
  if (payment.order.status === "REFUNDED") return { ok: true as const, already: true as const };

  const productId = payment.order.items[0]?.productId;
  if (!productId) return { ignored: true as const };

  await revokeCourseAccessForRefund({
    buyerId: payment.order.buyerId,
    productId,
    orderId: payment.order.id,
    note: "Reembolso Stripe",
  });
  return { ok: true as const, already: false as const };
}
