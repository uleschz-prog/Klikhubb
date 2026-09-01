import { prisma } from "@/lib/prisma";

export type RevokeAccessResult = {
  revoked: boolean;
  buyerId: string | null;
  productId: string | null;
  orderId: string | null;
  enrollmentId: string | null;
};

/** Quita acceso al curso/producto tras un reembolso manual. Idempotente. */
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
