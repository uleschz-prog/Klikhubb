export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** Reparte un total en centavos según tasas, ajustando el residuo al primer tramo. */
export function allocateByRates(totalCents: number, rates: readonly number[]): number[] {
  const raw = rates.map((rate) => Math.floor(totalCents * rate));
  const allocated = raw.reduce((sum, value) => sum + value, 0);
  const remainder = totalCents - allocated;
  if (remainder !== 0 && raw.length > 0) {
    raw[0] += remainder;
  }
  return raw;
}
