import { prisma } from "@/lib/prisma";

export type BuyerOrderRow = {
  kind: "manual" | "order";
  id: string;
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
};

function manualStatusLabel(status: string) {
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

export async function listBuyerPurchases(buyerId: string): Promise<BuyerOrderRow[]> {
  const [manual, orders] = await Promise.all([
    prisma.manualPaymentRequest.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { product: { select: { title: true, slug: true } } },
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

  const manualRows: BuyerOrderRow[] = manual.map((row) => ({
    kind: "manual",
    id: row.id,
    reference: row.reference,
    status: row.status,
    statusLabel: manualStatusLabel(row.status),
    amount: Number(row.amount),
    currency: row.currency.trim(),
    productTitle: row.product.title,
    productSlug: row.product.slug,
    createdAt: row.createdAt.toISOString(),
    proofUrl: row.proofUrl,
    reviewerNote: row.reviewerNote,
  }));

  const coveredOrderIds = new Set(manual.filter((row) => row.orderId).map((row) => row.orderId as string));

  const orderRows: BuyerOrderRow[] = orders
    .filter((order) => !coveredOrderIds.has(order.id) && !order.manualPayment)
    .map((order) => ({
      kind: "order",
      id: order.id,
      reference: order.payments[0]?.providerRef ?? order.id.slice(0, 8),
      status: order.status,
      statusLabel:
        order.status === "PAID"
          ? "Pagado · acceso activo"
          : order.status === "REFUNDED"
            ? "Reembolsado"
            : order.status,
      amount: Number(order.total),
      currency: order.currency.trim(),
      productTitle: order.items[0]?.product.title ?? "Producto",
      productSlug: order.items[0]?.product.slug ?? null,
      createdAt: order.createdAt.toISOString(),
      proofUrl: null,
      reviewerNote: null,
    }));

  return [...manualRows, ...orderRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
