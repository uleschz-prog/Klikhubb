import { describe, expect, it } from "vitest";
import { flatBreakEvenMonthlySalesUsd } from "@/config/compensation-plan";
import {
  buildStudioOnboarding,
  evolutionMilestone,
  filterStudioSales,
  studioPlanFromCode,
  studioPlanShareCopy,
  summarizeStudioSales,
  type StudioSale,
} from "@/lib/commerce/creator-studio-view";

const now = Date.parse("2026-11-17T12:00:00.000Z");

function sale(daysAgo: number, netUsd: number, productIds: string[]): StudioSale {
  return {
    id: `s-${daysAgo}-${netUsd}`,
    paidAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    productIds,
    netUsd,
    grossUsd: netUsd / 0.93,
  };
}

const sales = [
  sale(2, 46.5, ["p1"]),
  sale(10, 93, ["p2"]),
  sale(40, 20, ["p1"]),
];

describe("filterStudioSales", () => {
  it("keeps sales inside the selected window", () => {
    expect(filterStudioSales(sales, 7, "all", now)).toHaveLength(1);
    expect(filterStudioSales(sales, 30, "all", now)).toHaveLength(2);
    expect(filterStudioSales(sales, 90, "all", now)).toHaveLength(3);
  });

  it("filters by product", () => {
    const rows = filterStudioSales(sales, 90, "p1", now);
    expect(rows).toHaveLength(2);
    expect(summarizeStudioSales(rows)).toEqual({ netIncomeUsd: 66.5, approvedCount: 2 });
  });
});

describe("buildStudioOnboarding", () => {
  it("computes percent from real flags", () => {
    expect(buildStudioOnboarding({ hasProfile: true, hasProduct: true, hasShareLink: false, hasSale: false })).toMatchObject({
      done: 2,
      total: 4,
      percent: 50,
    });
  });
});

describe("evolutionMilestone", () => {
  it("aims at the first 100, then 1k", () => {
    expect(evolutionMilestone(0).target).toBe(100);
    expect(evolutionMilestone(50).percent).toBe(50);
    expect(evolutionMilestone(100).target).toBe(1000);
    expect(evolutionMilestone(100).badge).toBe("100");
    expect(evolutionMilestone(1000).badge).toBe("1k");
  });
});

describe("studioPlanShareCopy", () => {
  it("describes PAYG as 93% and Flat as 100%", () => {
    const payg = studioPlanShareCopy(studioPlanFromCode("payg"));
    const flat = studioPlanShareCopy(studioPlanFromCode("flat"));
    expect(payg.shortLabel).toBe("Tu parte: 93%");
    expect(payg.kpiHelp).toContain("93%");
    expect(payg.kpiHelp).toContain("sin mensualidad");
    expect(flat.shortLabel).toBe("100% (Plan mensual)");
    expect(flat.kpiHelp).toContain("100%");
    expect(flat.kpiHelp).toContain("Plan mensual");
  });
});

describe("flatBreakEvenMonthlySalesUsd", () => {
  it("is 25 divided by the 7% fee, rounded", () => {
    expect(flatBreakEvenMonthlySalesUsd()).toBe(Math.round(25 / 0.07));
    expect(flatBreakEvenMonthlySalesUsd()).toBe(357);
  });
});
