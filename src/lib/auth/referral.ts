export const REF_COOKIE = "qlyk_ref";
export const REF_COOKIE_MAX_AGE = 60 * 24 * 60 * 60;

export function normalizeReferralCode(value?: string | null) {
  const code = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  if (code.length < 4 || code.length > 32) return null;
  return code;
}

export async function resolveSponsorId(
  db: { user: { findFirst: typeof import("@prisma/client").PrismaClient.prototype.user.findFirst } },
  referralCode: string | null | undefined,
  excludeUserId?: string,
) {
  const code = referralCode?.trim().toUpperCase();
  if (!code) return null;
  const sponsor = await db.user.findFirst({
    where: { referralCode: { equals: code, mode: "insensitive" } },
    select: { id: true },
  });
  if (!sponsor) return null;
  if (excludeUserId && sponsor.id === excludeUserId) return null;
  return sponsor.id;
}
