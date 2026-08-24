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
  password: string;
  displayName: string;
  intent: "CREATOR" | "ENTREPRENEUR" | "BOTH";
  referralCode?: string;
}) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  let invitedById: string | undefined;
  const code = input.referralCode?.trim().toUpperCase();
  if (code) {
    const inviter = await prisma.user.findFirst({
      where: { referralCode: { equals: code, mode: "insensitive" } },
    });
    if (!inviter) {
      throw new Error("INVALID_REFERRAL");
    }
    invitedById = inviter.id;
  }

  const username = await uniqueUsername(input.displayName);
  const hashedPassword = await bcrypt.hash(input.password, 12);
  const roles = INTENT_ROLES[input.intent];

  const user = await prisma.user.create({
    data: {
      email,
      name: input.displayName,
      displayName: input.displayName,
      username,
      hashedPassword,
      status: "ACTIVE",
      referralCode: randomBytes(4).toString("hex").toUpperCase(),
      invitedById,
      roles: { create: roles.map((role) => ({ role })) },
    },
  });

  return { id: user.id, email: user.email, username: user.username, referralCode: user.referralCode };
}

async function uniqueUsername(displayName: string) {
  const base =
    displayName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 16) || "klik";
  for (let i = 0; i < 8; i += 1) {
    const candidate = i === 0 ? base : `${base}${i + 1}`;
    const taken = await prisma.user.findUnique({ where: { username: candidate } });
    if (!taken) return candidate;
  }
  return `${base}${randomBytes(2).toString("hex")}`;
}
