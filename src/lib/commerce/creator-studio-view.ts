export const STUDIO_RANGE_DAYS = [7, 30, 90] as const;
export type StudioRangeDays = (typeof STUDIO_RANGE_DAYS)[number];

export type StudioProductCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  type: string;
  lessonCount: number;
  moduleCount: number;
  coverUrl: string | null;
  updatedAt: string;
};

export type StudioSale = {
  id: string;
  paidAt: string;
  productIds: string[];
  netUsd: number;
  grossUsd: number;
};

export type StudioOnboarding = {
  hasProfile: boolean;
  hasProduct: boolean;
  hasShareLink: boolean;
  hasSale: boolean;
  done: number;
  total: number;
  percent: number;
  shareSlug: string | null;
};

export type CreatorStudioView = {
  displayName: string;
  username: string | null;
  imageUrl: string | null;
  products: StudioProductCard[];
  sales: StudioSale[];
  lifetimeEarnedUsd: number;
  onboarding: StudioOnboarding;
  videoCount: number;
};

export function filterStudioSales(
  sales: StudioSale[],
  days: StudioRangeDays,
  productId: string | "all" = "all",
  now = Date.now(),
): StudioSale[] {
  const since = now - days * 24 * 60 * 60 * 1000;
  return sales.filter((sale) => {
    const at = new Date(sale.paidAt).getTime();
    if (!Number.isFinite(at) || at < since) return false;
    if (productId !== "all" && !sale.productIds.includes(productId)) return false;
    return true;
  });
}

export function summarizeStudioSales(sales: StudioSale[]) {
  return {
    netIncomeUsd: sales.reduce((sum, sale) => sum + sale.netUsd, 0),
    approvedCount: sales.length,
  };
}

export function buildStudioOnboarding(flags: {
  hasProfile: boolean;
  hasProduct: boolean;
  hasShareLink: boolean;
  hasSale: boolean;
}): Omit<StudioOnboarding, "shareSlug"> {
  const steps = [flags.hasProfile, flags.hasProduct, flags.hasShareLink, flags.hasSale];
  const done = steps.filter(Boolean).length;
  return { ...flags, done, total: steps.length, percent: Math.round((done / steps.length) * 100) };
}

export function evolutionMilestone(lifetimeUsd: number) {
  const targets = [100, 1_000, 10_000];
  const target = targets.find((value) => lifetimeUsd < value) ?? targets[targets.length - 1];
  const percent = Math.min(100, Math.round((Math.max(0, lifetimeUsd) / target) * 100));
  const badge =
    lifetimeUsd >= 10_000 ? "10k" : lifetimeUsd >= 1_000 ? "1k" : lifetimeUsd >= 100 ? "100" : null;
  return { target, current: Math.max(0, lifetimeUsd), percent, badge };
}
