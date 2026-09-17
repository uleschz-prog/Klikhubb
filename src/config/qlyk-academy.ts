/**
 * Qlyk Academy — membresía de plataforma (estudio de IA) + unilevel de 8 niveles.
 *
 * Independiente del plan de creadores (PAYG 93/7 o FLAT $25).
 * Solo las mensualidades de esta membresía recorren la red.
 *
 * Cuota: USD 50 / 30 días.
 * El alumno activo tiene acceso ilimitado al estudio de IA.
 *
 * Reparto de cada pago (100%):
 *   Qlyk     40%
 *   Nivel 1  20%  (quien invitó)
 *   Nivel 2  10%
 *   Niveles 3–8  5% cada uno
 *
 * Si un nivel no existe o el upline no está activo, ese tramo se queda en Qlyk.
 */
export const QLYK_ACADEMY_SLUG = "qlyk-academy";
export const QLYK_ACADEMY_TITLE = "Qlyk Academy";
export const QLYK_ACADEMY_PRICE_USD = 50;
export const QLYK_ACADEMY_PERIOD_DAYS = 30;

export const QLYK_ACADEMY_RATES = {
  platform: 0.4,
  levels: [0.2, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05] as const,
} as const;

export const QLYK_ACADEMY_DEPTH = QLYK_ACADEMY_RATES.levels.length;

export const ACADEMY_RESERVED_SLUGS = ["studio", "cursos", "red", "subscribe", QLYK_ACADEMY_SLUG] as const;

export function academyPlatformRateUnfilled(filledLevels: number) {
  const paid = QLYK_ACADEMY_RATES.levels.slice(0, filledLevels).reduce((sum, rate) => sum + rate, 0);
  return Number((QLYK_ACADEMY_RATES.platform + (1 - QLYK_ACADEMY_RATES.platform - paid)).toFixed(6));
}
