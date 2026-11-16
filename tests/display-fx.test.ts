import { describe, expect, it } from "vitest";
import {
  DEFAULT_DISPLAY_FX_USD_MXN,
  convertUsdToMxn,
  formatCatalogPrice,
  resolveDisplayFxUsdMxn,
} from "@/lib/commerce/display-fx";

describe("display FX (solo visualización)", () => {
  it("usa 18.5 cuando FX_USD_MXN falta o es inválido", () => {
    expect(resolveDisplayFxUsdMxn(undefined)).toBe(DEFAULT_DISPLAY_FX_USD_MXN);
    expect(resolveDisplayFxUsdMxn("")).toBe(DEFAULT_DISPLAY_FX_USD_MXN);
    expect(resolveDisplayFxUsdMxn("no")).toBe(DEFAULT_DISPLAY_FX_USD_MXN);
    expect(resolveDisplayFxUsdMxn("-1")).toBe(DEFAULT_DISPLAY_FX_USD_MXN);
  });

  it("respeta un FX explícito", () => {
    expect(resolveDisplayFxUsdMxn("20")).toBe(20);
  });

  it("convierte USD a MXN con el fallback 18.5", () => {
    expect(convertUsdToMxn(49, 18.5)).toBe(906.5);
    expect(convertUsdToMxn(10, 18.5)).toBe(185);
  });

  it("muestra MXN primero y USD como secundario aproximado", () => {
    const price = formatCatalogPrice(49, "USD", 18.5);
    expect(price.approximate).toBe(true);
    expect(price.primary).toMatch(/906/);
    expect(price.secondary).toMatch(/49/);
    expect(price.originalCurrency).toBe("USD");
  });

  it("no convierte ni marca aprox. si ya es MXN", () => {
    const price = formatCatalogPrice(199, "MXN", 18.5);
    expect(price.approximate).toBe(false);
    expect(price.secondary).toBeNull();
    expect(price.amountMxn).toBe(199);
  });
});
