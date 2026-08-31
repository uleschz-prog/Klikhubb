import { CommissionType, LedgerType, Prisma } from "@prisma/client";
import { COMPENSATION_PLAN_V1 } from "@/config/compensation-plan";
import { PLATFORM_ADMIN } from "@/config/platform-admin";
import { joinMembershipCommunity } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/money/cents";
import { splitSaleCommissions } from "@/lib/commerce/split";

export class CommerceError extends Error {
  constructor(
    message: string,
    public readonly code: "ALREADY_OWNED" | "PRODUCT_UNAVAILABLE" | "SELF_PURCHASE" | "USER_NOT_FOUND",
  ) {
    super(message);
    this.name = "CommerceError";
  }
}

function money(cents: number): Prisma.Decimal {
  return new Prisma.Decimal((cents / 100).toFixed(4));
}

export type SettledOrder = {
  orderId: string;
  productTitle: string;
  total: number;
  currency: string;
  lines: {
    type: string;
    level: number;
    amountCents: number;
    beneficiaryId: string;
  }[];
};

async function settledFromProviderRef(
  tx: Prisma.TransactionClient,
  provider: string,
  providerRef: string,
): Promise<SettledOrder | null> {
  const payment = await tx.payment.findUnique({
    where: { provider_providerRef: { provider, providerRef } },
    include: {
      order: {
        include: {
          items: { include: { product: { select: { title: true } } }, take: 1 },
          commissions: true,
        },
      },
    },
  });
  const order = payment?.order;
  if (!order) return null;
  return {
    orderId: order.id,
    productTitle: order.items[0]?.product.title ?? "Producto",
    total: Number(order.total),
    currency: order.currency.trim(),
    lines: order.commissions.map((line) => ({
      type: line.type,
      level: line.level,
      amountCents: toCents(Number(line.amount)),
      beneficiaryId: line.beneficiaryId,
    })),
  };
}

/**
 * Marca una venta como pagada y escribe el 85/10/5 + wallet + enrollment
 * en la misma transacción. Stripe (o el provider demo) solo llama esto
 * después de confirmar el cargo.
 * El 10% de plataforma se acredita a Qlykadmin.
 */
export async function settlePaidOrder(input: {
  buyerId: string;
  productId: string;
  provider: string;
  providerRef: string;
  /** Renovación de suscripción: no bloquea por enrollment existente ni duplica acceso. */
  renewal?: boolean;
}): Promise<SettledOrder> {
  return prisma.$transaction(async (tx) => {
    const replayed = await settledFromProviderRef(tx, input.provider, input.providerRef);
    if (replayed) return replayed;

    if (!input.renewal) {
      const owned = await tx.enrollment.findUnique({
        where: { userId_productId: { userId: input.buyerId, productId: input.productId } },
      });
      if (owned?.status === "ACTIVE") {
        throw new CommerceError("Ya tienes este producto.", "ALREADY_OWNED");
      }
    }

    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product || product.status !== "ACTIVE") {
      throw new CommerceError("Este producto no está disponible.", "PRODUCT_UNAVAILABLE");
    }
    if (product.creatorId === input.buyerId) {
      throw new CommerceError("No puedes comprar tu propio producto.", "SELF_PURCHASE");
    }

    const buyer = await tx.user.findUnique({ where: { id: input.buyerId } });
    if (!buyer) {
      throw new CommerceError("Usuario no encontrado.", "USER_NOT_FOUND");
    }

    const currency = product.currency.trim();
    const saleAmount = Number(product.price);
    const saleCents = toCents(saleAmount);
    const platform =
      (await tx.user.findFirst({
        where: {
          OR: [
            { email: PLATFORM_ADMIN.email },
            { username: { equals: PLATFORM_ADMIN.username, mode: "insensitive" } },
            { referralCode: { equals: PLATFORM_ADMIN.referralCode, mode: "insensitive" } },
          ],
        },
      })) ??
      (await tx.user.findFirst({
        where: { email: "platform@klikhubb.internal" },
      }));

    // Si el comprador no tiene invitación, cuelga de Qlykadmin (usuario raíz).
    if (!buyer.invitedById) {
      if (platform && platform.id !== input.buyerId) {
        await tx.user.update({
          where: { id: input.buyerId },
          data: { invitedById: platform.id },
        });
        buyer.invitedById = platform.id;
      }
    }

    // El 5% es para un amigo real. Si el invitador es Qlykadmin, split lo
    // ignora y el creador se queda 90% + plataforma 10%.
    const lines = splitSaleCommissions({
      saleAmount,
      creatorId: product.creatorId,
      inviterId: buyer.invitedById,
      platformUserId: platform?.id ?? null,
    });

    const now = new Date();
    const availableAt = new Date(now.getTime() + COMPENSATION_PLAN_V1.holdDays * 86_400_000);
    const platformFeeCents = lines.find((line) => line.type === "PLATFORM_FEE")?.amountCents ?? 0;
    const affiliateId = lines.find((line) => line.type === "INVITE")?.beneficiaryId ?? null;

    const order = await tx.order.create({
      data: {
        buyerId: input.buyerId,
        sellerId: product.creatorId,
        affiliateId,
        status: "PAID",
        subtotal: money(saleCents),
        fees: money(platformFeeCents),
        total: money(saleCents),
        currency,
        paidAt: now,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            unitPrice: money(saleCents),
            total: money(saleCents),
          },
        },
        payments: {
          create: {
            provider: input.provider,
            providerRef: input.providerRef,
            amount: money(saleCents),
            currency,
            status: "SUCCEEDED",
          },
        },
      },
    });

    if (!input.renewal) {
      await tx.enrollment.create({
        data: {
          userId: input.buyerId,
          productId: product.id,
          orderId: order.id,
          status: "ACTIVE",
        },
      });
    } else {
      const existingEnrollment = await tx.enrollment.findUnique({
        where: { userId_productId: { userId: input.buyerId, productId: product.id } },
      });
      if (existingEnrollment) {
        await tx.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: "ACTIVE", orderId: order.id },
        });
      } else {
        await tx.enrollment.create({
          data: {
            userId: input.buyerId,
            productId: product.id,
            orderId: order.id,
            status: "ACTIVE",
          },
        });
      }
    }

    if (product.type === "MEMBERSHIP") {
      await joinMembershipCommunity(
        tx,
        {
          id: product.id,
          slug: product.slug,
          title: product.title,
          description: product.description,
          creatorId: product.creatorId,
        },
        input.buyerId,
      );
    }

    for (const line of lines) {
      if (line.amountCents <= 0) continue;

      if (line.type === "PLATFORM_FEE") {
        if (platform) {
          await creditWallet(tx, {
            userId: platform.id,
            cents: line.amountCents,
            type: LedgerType.FEE,
            destination: "available",
            orderId: order.id,
            note: "Fee de plataforma Qlyk",
          });
        }
        continue;
      }

      const commission = await tx.commission.create({
        data: {
          orderId: order.id,
          beneficiaryId: line.beneficiaryId,
          sourceUserId: line.sourceUserId,
          type: line.type === "CREATOR_SALE" ? CommissionType.CREATOR_SALE : CommissionType.DIRECT,
          level: line.level,
          rate: new Prisma.Decimal(line.rate.toFixed(6)),
          amount: money(line.amountCents),
          currency,
          status: "LOCKED",
          availableAt,
        },
      });

      await creditWallet(tx, {
        userId: line.beneficiaryId,
        cents: line.amountCents,
        type: line.type === "CREATOR_SALE" ? LedgerType.SALE : LedgerType.COMMISSION,
        destination: "pending",
        orderId: order.id,
        commissionId: commission.id,
        note: line.type === "CREATOR_SALE" ? "Venta de tu producto" : "Invitación",
      });
    }

    const points = Math.max(10, Math.round(saleAmount / 10));
    const stats = await tx.userStats.upsert({
      where: { userId: input.buyerId },
      create: { userId: input.buyerId, points },
      update: { points: { increment: points } },
    });
    await tx.pointLedger.create({
      data: {
        userId: input.buyerId,
        delta: points,
        balanceAfter: stats.points,
        reason: "PURCHASE",
        refType: "order",
        refId: order.id,
      },
    });

    await tx.userStats.upsert({
      where: { userId: product.creatorId },
      create: { userId: product.creatorId, totalSales: money(saleCents) },
      update: { totalSales: { increment: money(saleCents) } },
    });

    return {
      orderId: order.id,
      productTitle: product.title,
      total: saleAmount,
      currency,
      lines: lines.map((line) => ({
        type: line.type,
        level: line.level,
        amountCents: line.amountCents,
        beneficiaryId: line.beneficiaryId,
      })),
    };
  });
}

async function creditWallet(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    cents: number;
    type: LedgerType;
    destination: "pending" | "available";
    orderId: string;
    commissionId?: string;
    note?: string;
  },
) {
  const amount = money(input.cents);
  const toPending = input.destination === "pending";
  const wallet = await tx.wallet.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      pending: toPending ? amount : 0,
      available: toPending ? 0 : amount,
      lifetimeEarned: amount,
    },
    update: toPending
      ? {
          pending: { increment: amount },
          lifetimeEarned: { increment: amount },
        }
      : {
          available: { increment: amount },
          lifetimeEarned: { increment: amount },
        },
  });

  const balanceAfter = Number(wallet.available) + Number(wallet.pending);
  await tx.walletLedger.create({
    data: {
      userId: input.userId,
      amount,
      balanceAfter: new Prisma.Decimal(balanceAfter.toFixed(4)),
      type: input.type,
      commissionId: input.commissionId,
      orderId: input.orderId,
      note: input.note,
    },
  });
}
