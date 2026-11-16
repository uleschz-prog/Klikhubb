import { resolveUsdMxnQuote, usdToMxn, type FxQuote } from "@/lib/payments/fx";

export async function loadDisplayFxQuote(): Promise<FxQuote | null> {
  try {
    return await resolveUsdMxnQuote();
  } catch {
    return null;
  }
}

export function mxnForUsd(amountUsd: number, quote: FxQuote | null) {
  if (!quote) return undefined;
  return usdToMxn(amountUsd, quote.rate);
}
