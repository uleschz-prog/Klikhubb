import { afterEach, describe, expect, it } from "vitest";
import {
  clearFxCache,
  mxnToUsd,
  resolveUsdMxnQuote,
  usdToMxn,
} from "@/lib/payments/fx";

afterEach(() => {
  clearFxCache();
  delete process.env.FX_USD_MXN;
  delete process.env.MP_ACCESS_TOKEN;
});

describe("usdToMxn / mxnToUsd", () => {
  it("convierte y redondea a 2 decimales en MXN", () => {
    expect(usdToMxn(100, 18.5)).toBe(1850);
    expect(usdToMxn(10, 17.123)).toBe(171.23);
  });

  it("regresa a USD con 4 decimales", () => {
    expect(mxnToUsd(1850, 18.5)).toBe(100);
    expect(mxnToUsd(90, 18.5)).toBeCloseTo(4.8649, 4);
  });
});

describe("resolveUsdMxnQuote", () => {
  it("prioriza FX_USD_MXN", async () => {
    process.env.FX_USD_MXN = "19.25";
    const quote = await resolveUsdMxnQuote({
      fetchRate: async () => 10,
      token: "TEST-x",
    });
    expect(quote.source).toBe("env");
    expect(quote.rate).toBe(19.25);
  });

  it("usa la API si no hay env y cachea el valor", async () => {
    let calls = 0;
    const fetchRate = async () => {
      calls += 1;
      return 18.4;
    };
    const first = await resolveUsdMxnQuote({ fetchRate, token: "TEST-x" });
    const second = await resolveUsdMxnQuote({ fetchRate, token: "TEST-x" });
    expect(first.source).toBe("mercadopago");
    expect(first.rate).toBe(18.4);
    expect(second.source).toBe("cache");
    expect(calls).toBe(1);
  });

  it("falla de forma clara si no hay env, API ni caché", async () => {
    await expect(
      resolveUsdMxnQuote({ fetchRate: async () => null, token: "TEST-x" }),
    ).rejects.toThrow(/tipo de cambio/i);
  });
});
