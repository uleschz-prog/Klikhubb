import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { RoleCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Toda cuenta puede publicar y comprar: sin distinción creador/miembro. */
const DEFAULT_ROLES: RoleCode[] = ["CREATOR", "STUDENT"];

export async function registerUser(input: {
  email: string;
  username: string;
  password: string;
  displayName: string;
  locale?: string;
  timezone?: string;
  referralCode?: string | null;
}) {
  const email = input.email.toLowerCase();
  const username = input.username.toLowerCase();
  const displayName = input.displayName.trim();

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new Error("EMAIL_TAKEN");
  }

  const existingUsername = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (existingUsername) {
    throw new Error("USERNAME_TAKEN");
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const locale = input.locale?.trim().slice(0, 10) || "es";
  const timezone = input.timezone?.trim().slice(0, 64) || "UTC";
  const { resolveSponsorId } = await import("@/lib/auth/referral");
  const invitedById = await resolveSponsorId(prisma, input.referralCode);

  const user = await prisma.user.create({
    data: {
      email,
      name: displayName,
      displayName,
      username,
      hashedPassword,
      locale,
      timezone,
      status: "ACTIVE",
      referralCode: randomBytes(4).toString("hex").toUpperCase(),
      invitedById,
      roles: { create: DEFAULT_ROLES.map((role) => ({ role })) },
      wallet: { create: {} },
      stats: { create: {} },
    },
  });

  return { id: user.id, email: user.email, username: user.username };
}
