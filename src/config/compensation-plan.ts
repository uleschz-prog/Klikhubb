/**
 * Cada venta se reparte al 100%:
 * creador 85% + plataforma 10% + invitación 5% (un solo amigo, sin niveles).
 * Si nadie invitó al comprador, ese 5% también es del creador (90%).
 *
 * El 10% de plataforma lo recibe siempre Qlykadmin (usuario raíz).
 * Quien refiere al comprador recibe el 5%.
 */
export const COMPENSATION_PLAN_V1 = {
  code: "klikhubb-v1",
  platformFeeRate: 0.1,
  creatorRate: 0.85,
  inviteRate: 0.05,
  holdDays: 14,
} as const;

export const PLATFORM_PROTECTED_PATHS = ["/dashboard", "/checkout", "/wallet"] as const;
