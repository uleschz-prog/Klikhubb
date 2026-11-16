/**
 * Tipo de cambio solo para *mostrar* precios en MXN.
 * No se usa para cobrar ni asentar ventas.
 *
 * - Lee `FX_USD_MXN` si es un número > 0.
 * - Si falta, usa 18.5 y marca el precio como aproximado.
 *
 * El PR #56 (Mercado Pago Checkout Pro) puede reutilizar esta API
 * (`resolveDisplayFxUsdMxn`, `formatCatalogPrice`) y sustituir solo
 * la fuente del tipo de cambio (caché / API) sin tocar la UI.
 */
export const DEFAULT_DISPLAY_FX_USD_MXN = 18.5;

export function resolveDisplayFxUsdMxn(raw = process.env.FX_USD_MXN): number {
  const value = Number(raw);
  if (Number.isFinite(value) && value > 0) return value;
  return DEFAULT_DISPLAY_FX_USD_MXN;
}

export function isDefaultDisplayFx(fx: number): boolean {
  return fx === DEFAULT_DISPLAY_FX_USD_MXN;
}

/** Convierte un monto USD a MXN redondeando a centavos. */
export function convertUsdToMxn(usd: number, fx = resolveDisplayFxUsdMxn()): number {
  const usdCents = Math.round(usd * 100);
  return Math.round(usdCents * fx) / 100;
}

function formatAmount(amount: number, currency: string, fractionDigits?: number): string {
  const digits =
    fractionDigits ?? (Math.abs(amount - Math.round(amount)) < 0.005 ? 0 : 2);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export type CatalogPrice = {
  /** Precio principal, siempre en MXN. */
  primary: string;
  /** Precio original en USD, o null si ya estaba en MXN. */
  secondary: string | null;
  /** True cuando el MXN se estimó con FX (incluye el fallback 18.5). */
  approximate: boolean;
  amountMxn: number;
  amountOriginal: number;
  originalCurrency: string;
  fx: number;
};

/**
 * Formatea un precio de catálogo: MXN primero, USD pequeño y “aprox.”
 * si hubo conversión. Si la moneda ya es MXN, no se convierte.
 */
export function formatCatalogPrice(
  amount: number,
  currency = "USD",
  fx = resolveDisplayFxUsdMxn(),
): CatalogPrice {
  const code = (currency || "USD").trim().toUpperCase();
  if (code === "MXN") {
    return {
      primary: formatAmount(amount, "MXN"),
      secondary: null,
      approximate: false,
      amountMxn: amount,
      amountOriginal: amount,
      originalCurrency: "MXN",
      fx,
    };
  }

  const amountMxn = code === "USD" ? convertUsdToMxn(amount, fx) : amount;
  return {
    primary: formatAmount(amountMxn, "MXN"),
    secondary: formatAmount(amount, code === "USD" ? "USD" : code),
    approximate: code === "USD",
    amountMxn,
    amountOriginal: amount,
    originalCurrency: code,
    fx,
  };
}
