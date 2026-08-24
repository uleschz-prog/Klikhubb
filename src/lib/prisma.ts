import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** True only when Vercel/local provided a real DATABASE_URL (before any build fallback). */
export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  // Prisma lee env("DATABASE_URL") al instanciar el cliente. Sin esto el build
  // de Vercel revienta en /api/auth/[...nextauth] aunque nadie consulte la DB.
  process.env.DATABASE_URL =
    "postgresql://klikhubb:klikhubb@127.0.0.1:5432/klikhubb?schema=public";
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
