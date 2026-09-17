import { prisma } from "@/lib/prisma";
import { PLATFORM_ADMIN } from "@/config/platform-admin";
import {
  QLYK_ACADEMY_PERIOD_DAYS,
  QLYK_ACADEMY_PRICE_USD,
  QLYK_ACADEMY_SLUG,
  QLYK_ACADEMY_TITLE,
} from "@/config/qlyk-academy";

export async function ensureAcademyProduct() {
  const admin =
    (await prisma.user.findFirst({
      where: {
        OR: [
          { email: PLATFORM_ADMIN.email },
          { username: { equals: PLATFORM_ADMIN.username, mode: "insensitive" } },
          { referralCode: { equals: PLATFORM_ADMIN.referralCode, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    })) ?? (await prisma.user.findFirst({ where: { email: "platform@klikhubb.internal" }, select: { id: true } }));

  if (!admin) {
    throw new Error("PLATFORM_ADMIN_MISSING");
  }

  const description =
    "Estudio de IA de Qlyk: video, imagen, Notebook LM y agentes autónomos. USD 50 al mes con acceso ilimitado mientras estés activo.";

  return prisma.product.upsert({
    where: { slug: QLYK_ACADEMY_SLUG },
    update: {
      title: QLYK_ACADEMY_TITLE,
      description,
      price: QLYK_ACADEMY_PRICE_USD,
      currency: "USD",
      type: "MEMBERSHIP",
      billing: "MONTHLY",
      status: "ACTIVE",
      affiliateRate: 0,
    },
    create: {
      creatorId: admin.id,
      slug: QLYK_ACADEMY_SLUG,
      title: QLYK_ACADEMY_TITLE,
      description,
      price: QLYK_ACADEMY_PRICE_USD,
      currency: "USD",
      type: "MEMBERSHIP",
      billing: "MONTHLY",
      status: "ACTIVE",
      affiliateRate: 0,
    },
  });
}

export function academyPeriodEnd(from = new Date()) {
  return new Date(from.getTime() + QLYK_ACADEMY_PERIOD_DAYS * 24 * 60 * 60 * 1000);
}
