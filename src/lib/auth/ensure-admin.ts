import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLATFORM_ADMIN, platformAdminPassword } from "@/config/platform-admin";
import { prisma as defaultPrisma } from "@/lib/prisma";

export async function ensurePlatformAdmin(db: PrismaClient = defaultPrisma) {
  const password = platformAdminPassword();
  const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
  const existing =
    (await db.user.findUnique({ where: { email: PLATFORM_ADMIN.email } })) ??
    (await db.user.findFirst({
      where: { username: { equals: PLATFORM_ADMIN.username, mode: "insensitive" } },
    }));

  if (existing) {
    const codeTaken = await db.user.findFirst({
      where: {
        referralCode: { equals: PLATFORM_ADMIN.referralCode, mode: "insensitive" },
        NOT: { id: existing.id },
      },
      select: { id: true },
    });

    await db.user.update({
      where: { id: existing.id },
      data: {
        email: PLATFORM_ADMIN.email,
        username: PLATFORM_ADMIN.username,
        displayName: PLATFORM_ADMIN.displayName,
        name: PLATFORM_ADMIN.displayName,
        ...(hashedPassword && process.env.PLATFORM_ADMIN_PASSWORD?.trim() ? { hashedPassword } : {}),
        status: "ACTIVE",
        referralCode: codeTaken ? existing.referralCode : PLATFORM_ADMIN.referralCode,
      },
    });

    for (const role of ["ADMIN", "CREATOR"] as const) {
      await db.userRole.upsert({
        where: { userId_role: { userId: existing.id, role } },
        update: {},
        create: { userId: existing.id, role },
      });
    }

    await db.wallet.upsert({
      where: { userId: existing.id },
      update: {},
      create: { userId: existing.id },
    });

    await db.userStats.upsert({
      where: { userId: existing.id },
      update: {},
      create: { userId: existing.id },
    });

    await attachOrphansToAdmin(db, existing.id);
    return db.user.findUniqueOrThrow({ where: { id: existing.id } });
  }

  if (!hashedPassword) {
    throw new Error("PLATFORM_ADMIN_PASSWORD is required to create the admin user.");
  }

  const created = await db.user.create({
    data: {
      email: PLATFORM_ADMIN.email,
      username: PLATFORM_ADMIN.username,
      displayName: PLATFORM_ADMIN.displayName,
      name: PLATFORM_ADMIN.displayName,
      hashedPassword,
      status: "ACTIVE",
      referralCode: PLATFORM_ADMIN.referralCode,
      roles: { create: [{ role: "ADMIN" }, { role: "CREATOR" }] },
      wallet: { create: {} },
      stats: { create: {} },
    },
  });

  await attachOrphansToAdmin(db, created.id);
  return created;
}

async function attachOrphansToAdmin(db: PrismaClient, adminId: string) {
  await db.user.updateMany({
    where: {
      invitedById: null,
      id: { not: adminId },
      email: { not: "platform@klikhubb.internal" },
    },
    data: { invitedById: adminId },
  });
}

export async function findDefaultInviterId(db: PrismaClient = defaultPrisma) {
  const admin = await db.user.findFirst({
    where: {
      OR: [
        { username: { equals: PLATFORM_ADMIN.username, mode: "insensitive" } },
        { referralCode: { equals: PLATFORM_ADMIN.referralCode, mode: "insensitive" } },
        { email: PLATFORM_ADMIN.email },
      ],
    },
    select: { id: true },
  });
  return admin?.id;
}
