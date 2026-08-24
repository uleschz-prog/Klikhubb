/**
 * Cada venta se reparte al 100%:
 * creador 80% + plataforma 10% + invitación 10% (un solo amigo, sin niveles).
 * Si nadie invitó al comprador, ese 10% también es del creador (90%).
 */
export const COMPENSATION_PLAN_V1 = {
  code: "klikhubb-v1",
  platformFeeRate: 0.1,
  creatorRate: 0.8,
  inviteRate: 0.1,
  holdDays: 14,
} as const;

export const PLATFORM_PROTECTED_PATHS = ["/dashboard", "/checkout"] as const;
