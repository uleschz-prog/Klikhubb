import { allocateByRates, toCents } from "@/lib/money/cents";
import { QLYK_ACADEMY_RATES } from "@/config/qlyk-academy";
import type { CommissionLine } from "@/lib/commerce/split";

export type AcademyUplineSeat = {
  userId: string;
  level: number;
  active: boolean;
};

/**
 * Reparte USD 50 (u otro monto) de Qlyk Academy.
 * Los asientos inactivos o vacíos se suman a Qlyk (40% + residual).
 */
export function splitAcademyMembership(input: {
  saleAmount: number;
  buyerId: string;
  upline: AcademyUplineSeat[];
  platformUserId: string;
}): CommissionLine[] {
  const saleCents = toCents(input.saleAmount);
  const rates = [QLYK_ACADEMY_RATES.platform, ...QLYK_ACADEMY_RATES.levels];
  const parts = allocateByRates(saleCents, rates);

  const platformCents = parts[0] ?? 0;
  const lines: CommissionLine[] = [];
  let residual = 0;

  QLYK_ACADEMY_RATES.levels.forEach((_, index) => {
    const level = index + 1;
    const cents = parts[index + 1] ?? 0;
    const seat = input.upline.find((item) => item.level === level);
    if (seat?.active && cents > 0) {
      lines.push({
        beneficiaryId: seat.userId,
        sourceUserId: input.buyerId,
        type: "UNILEVEL",
        level,
        rate: QLYK_ACADEMY_RATES.levels[index],
        amountCents: cents,
      });
      return;
    }
    residual += cents;
  });

  lines.unshift({
    beneficiaryId: input.platformUserId,
    sourceUserId: input.buyerId,
    type: "PLATFORM_FEE",
    level: 0,
    rate: QLYK_ACADEMY_RATES.platform,
    amountCents: platformCents + residual,
  });

  return lines;
}
