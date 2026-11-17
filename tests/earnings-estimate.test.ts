import { describe, expect, it } from "vitest";
import { CREATOR_FLAT_PRICE_USD, CREATOR_PLAN_PAYG } from "@/config/compensation-plan";
import { convertUsdToMxn } from "@/lib/commerce/display-fx";
import {
  clampEstimatePrice,
  estimateMonthlyCreatorShare,
  priceFromUsd,
  priceToUsd,
} from "@/lib/commerce/earnings-estimate";

const fx = 18.5;

describe("priceToUsd / priceFromUsd", () => {
  it("keeps USD amounts in cents", () => {
    expect(priceToUsd(49, "USD", fx)).toBe(49);
  });

  it("converts MXN to USD with the display fx", () => {
    expect(priceToUsd(1850, "MXN", fx)).toBe(100);
    expect(priceFromUsd(100, "MXN", fx)).toBe(convertUsdToMxn(100, fx));
  });
});

describe("estimateMonthlyCreatorShare", () => {
  it("gives 93% of gross on payg and 100% minus $25 on the monthly plan", () => {
    const estimate = estimateMonthlyCreatorShare({
      priceAmount: 50,
      currency: "USD",
      salesPerMonth: 10,
      fx,
    });
    expect(estimate.grossUsd).toBe(500);
    expect(estimate.paygUsd).toBe(465);
    expect(estimate.flatUsd).toBe(475);
    expect(estimate.better).toBe("flat");
    expect(estimate.breakEvenUsd).toBe(Math.round(CREATOR_FLAT_PRICE_USD / CREATOR_PLAN_PAYG.platformFeeRate));
    expect(estimate.breakEvenUsd).toBe(357);
  });

  it("prefers payg when monthly sales are below the break-even", () => {
    const estimate = estimateMonthlyCreatorShare({
      priceAmount: 50,
      currency: "USD",
      salesPerMonth: 2,
      fx,
    });
    expect(estimate.grossUsd).toBe(100);
    expect(estimate.paygUsd).toBe(93);
    expect(estimate.flatUsd).toBe(75);
    expect(estimate.better).toBe("payg");
  });

  it("can show a negative flat net if the quota is larger than sales", () => {
    const estimate = estimateMonthlyCreatorShare({
      priceAmount: 10,
      currency: "USD",
      salesPerMonth: 1,
      fx,
    });
    expect(estimate.flatUsd).toBe(-15);
    expect(estimate.better).toBe("payg");
  });

  it("converts displayed totals to MXN with display-fx", () => {
    const estimate = estimateMonthlyCreatorShare({
      priceAmount: 1850,
      currency: "MXN",
      salesPerMonth: 10,
      fx,
    });
    expect(estimate.priceUsd).toBe(100);
    expect(estimate.grossUsd).toBe(1000);
    expect(estimate.paygUsd).toBe(930);
    expect(estimate.flatUsd).toBe(975);
    expect(estimate.payg).toBe(convertUsdToMxn(930, fx));
    expect(estimate.flatFee).toBe(convertUsdToMxn(25, fx));
    expect(estimate.better).toBe("flat");
  });

  it("treats a near-equal result as a tie", () => {
    // Exact break-even is 25 / 0.07 ≈ 357.142857 USD of gross sales.
    const estimate = estimateMonthlyCreatorShare({
      priceAmount: 25 / 0.07,
      currency: "USD",
      salesPerMonth: 1,
      fx,
    });
    expect(estimate.better).toBe("tie");
  });

  it("clamps prices to the slider range", () => {
    expect(clampEstimatePrice(1, "USD")).toBe(5);
    expect(clampEstimatePrice(9999, "MXN")).toBe(5999);
  });
});
