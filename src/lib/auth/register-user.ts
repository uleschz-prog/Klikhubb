import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { RoleCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const INTENT_ROLES: Record<"CREATOR" | "ENTREPRENEUR" | "BOTH", RoleCode[]> = {
  CREATOR: ["CREATOR", "STUDENT"],
  ENTREPRENEUR: ["STUDENT"],
  BOTH: ["CREATOR", "STUDENT"],
};

export async function registerUser(input: {
  email: string;
  username: string;
  password: string;
  displayName: string;
  intent: "CREATOR" | "ENTREPRENEUR" | "BOTH";
  locale?: string;
  timezone?: string;
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
  const roles = INTENT_ROLES[input.intent];
  const locale = input.locale?.trim().slice(0, 10) || "es";
  const timezone = input.timezone?.trim().slice(0, 64) || "UTC";

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
      // Columna legacy única; ya no se usa como referido.
      referralCode: randomBytes(4).toString("hex").toUpperCase(),
      invitedById: null,
      roles: { create: roles.map((role) => ({ role })) },
      wallet: { create: {} },
      stats: { create: {} },
    },
  });

  return { id: user.id, email: user.email, username: user.username };
}
