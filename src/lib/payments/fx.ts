/**
 * Tipo de cambio USD → MXN.
 * Prioridad: FX_USD_MXN (env/admin) → caché en memoria → API de Mercado Pago → último valor conocido.
 * No se inventa un tipo fijo en código más que un fallback de emergencia documentado.
 */

export const FX_CACHE_TTL_MS = 60 * 60 * 1000;
const MP_API = "https://api.mercadopago.com";

export type FxQuote = {
  rate: number;
  at: Date;
  source: "env" | "mercadopago" | "cache" | "fallback";
};

let cached: FxQuote | null = null;

export function usdToMxn(amountUsd: number, rate: number): number {
  if (!Number.isFinite(amountUsd) || !Number.isFinite(rate) || rate <= 0) return 0;
  return Number((amountUsd * rate).toFixed(2));
}

export function mxnToUsd(amountMxn: number, rate: number): number {
  if (!Number.isFinite(amountMxn) || !Number.isFinite(rate) || rate <= 0) return 0;
  return Number((amountMxn / rate).toFixed(4));
}

export function envFxOverride(): number | null {
  const raw = process.env.FX_USD_MXN?.trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function getCachedFxQuote(): FxQuote | null {
  return cached;
}

export function setCachedFxQuote(quote: FxQuote) {
  cached = quote;
}

export function clearFxCache() {
  cached = null;
}

function parseRatePayload(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const candidates = [
    data.rate,
    data.inv_rate,
    (data.conversion as Record<string, unknown> | undefined)?.rate,
    Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined)?.rate : undefined,
  ];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

export async function fetchMercadoPagoUsdMxnRate(accessToken: string): Promise<number | null> {
  const url = `${MP_API}/currency_conversions/search?from=USD&to=MXN`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload: unknown = await response.json().catch(() => null);
  return parseRatePayload(payload);
}

/**
 * Resuelve el tipo de cambio a usar en un cobro. Inyectable para tests.
 */
export async function resolveUsdMxnQuote(input?: {
  now?: Date;
  token?: string | null;
  fetchRate?: (token: string) => Promise<number | null>;
}): Promise<FxQuote> {
  const now = input?.now ?? new Date();
  const envRate = envFxOverride();
  if (envRate) {
    const quote: FxQuote = { rate: envRate, at: now, source: "env" };
    setCachedFxQuote(quote);
    return quote;
  }

  if (cached && now.getTime() - cached.at.getTime() < FX_CACHE_TTL_MS) {
    return { ...cached, source: "cache" };
  }

  const token = input?.token ?? process.env.MP_ACCESS_TOKEN?.trim() ?? null;
  if (token) {
    try {
      const fetchRate = input?.fetchRate ?? fetchMercadoPagoUsdMxnRate;
      const rate = await fetchRate(token);
      if (rate && rate > 0) {
        const quote: FxQuote = { rate, at: now, source: "mercadopago" };
        setCachedFxQuote(quote);
        return quote;
      }
    } catch (error) {
      console.warn("[fx] no se pudo obtener el tipo de cambio de Mercado Pago", error);
    }
  }

  if (cached) {
    return { ...cached, source: "cache" };
  }

  // Solo si no hay env ni API ni caché: no inventamos un valor de negocio; el checkout debe fallar.
  throw new Error("No hay tipo de cambio USD→MXN. Define FX_USD_MXN o configura MP_ACCESS_TOKEN.");
}
