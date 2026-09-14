import { BUYER_REFUND_WINDOW_HOURS, buyerRefundDeadline, isWithinBuyerRefundWindow } from "@/config/refund-policy";
import { prisma } from "@/lib/prisma";

export type BuyerOrderRow = {
  kind: "manual" | "order";
  id: string;
  orderId: string | null;
  reference: string | null;
  status: string;
  statusLabel: string;
  amount: number;
  currency: string;
  productTitle: string;
  productSlug: string | null;
  createdAt: string;
  proofUrl: string | null;
  reviewerNote: string | null;
  canRequestRefund: boolean;
  refundUntil: string | null;
  accessActive: boolean;
};

function manualStatusLabel(status: string, orderStatus?: string | null) {
  if (orderStatus === "REFUNDED") return "Reembolsado · acceso revocado";
  switch (status) {
    case "PENDING":
      return "Esperando tu transferencia";
    case "PROOF_SUBMITTED":
      return "Comprobante en revisión";
    case "APPROVED":
      return "Pago confirmado · acceso activo";
    case "REJECTED":
      return "Pago rechazado";
    default:
      return status;
  }
}

function refundMeta(paidAt: Date | null | undefined, orderStatus: string | null | undefined) {
  if (orderStatus !== "PAID" || !paidAt || !isWithinBuyerRefundWindow(paidAt)) {
    return { canRequestRefund: false, refundUntil: null as string | null };
  }
  return { canRequestRefund: true, refundUntil: buyerRefundDeadline(paidAt).toISOString() };
}

export async function listBuyerPurchases(buyerId: string): Promise<BuyerOrderRow[]> {
  const [manual, orders] = await Promise.all([
    prisma.manualPaymentRequest.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        product: { select: { title: true, slug: true } },
        order: { select: { id: true, status: true, paidAt: true, createdAt: true } },
      },
    }),
    prisma.order.findMany({
      where: { buyerId, status: { in: ["PAID", "REFUNDED", "CHARGEBACK"] } },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        items: { include: { product: { select: { title: true, slug: true } } }, take: 1 },
        payments: { take: 1 },
        manualPayment: true,
      },
    }),
  ]);

  const manualRows: BuyerOrderRow[] = manual.map((row) => {
    const paidAt = row.order?.paidAt ?? row.order?.createdAt ?? null;
    const refund = refundMeta(paidAt, row.order?.status ?? null);
    return {
      kind: "manual",
      id: row.id,
      orderId: row.orderId,
      reference: row.reference,
      status: row.order?.status === "REFUNDED" ? "REFUNDED" : row.status,
      statusLabel: manualStatusLabel(row.status, row.order?.status),
      amount: Number(row.amount),
      currency: row.currency.trim(),
      productTitle: row.product.title,
      productSlug: row.product.slug,
      createdAt: row.createdAt.toISOString(),
      proofUrl: row.proofUrl,
      reviewerNote: row.reviewerNote,
      canRequestRefund: refund.canRequestRefund,
      refundUntil: refund.refundUntil,
      accessActive: row.status === "APPROVED" && row.order?.status !== "REFUNDED",
    };
  });

  const coveredOrderIds = new Set(manual.filter((row) => row.orderId).map((row) => row.orderId as string));

  const orderRows: BuyerOrderRow[] = orders
    .filter((order) => !coveredOrderIds.has(order.id) && !order.manualPayment)
    .map((order) => {
      const paidAt = order.paidAt ?? order.createdAt;
      const refund = refundMeta(paidAt, order.status);
      return {
        kind: "order" as const,
        id: order.id,
        orderId: order.id,
        reference: order.payments[0]?.providerRef ?? order.id.slice(0, 8),
        status: order.status,
        statusLabel:
          order.status === "PAID"
            ? order.payments[0]?.provider === "stripe"
              ? "Pagado con tarjeta · acceso activo"
              : "Pagado · acceso activo"
            : order.status === "REFUNDED"
              ? "Reembolsado · acceso revocado"
              : order.status,
        amount: Number(order.total),
        currency: order.currency.trim(),
        productTitle: order.items[0]?.product.title ?? "Producto",
        productSlug: order.items[0]?.product.slug ?? null,
        createdAt: order.createdAt.toISOString(),
        proofUrl: null,
        reviewerNote: null,
        canRequestRefund: refund.canRequestRefund,
        refundUntil: refund.refundUntil,
        accessActive: order.status === "PAID",
      };
    });

  return [...manualRows, ...orderRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export { BUYER_REFUND_WINDOW_HOURS };
