/** Ventana para que el comprador pida la devolución del curso a Qlyk. */
export const BUYER_REFUND_WINDOW_HOURS = 24;

export const BUYER_REFUND_WINDOW_MS = BUYER_REFUND_WINDOW_HOURS * 60 * 60 * 1000;

export function buyerRefundDeadline(paidAt: Date) {
  return new Date(paidAt.getTime() + BUYER_REFUND_WINDOW_MS);
}

export function isWithinBuyerRefundWindow(paidAt: Date | null | undefined, now = new Date()) {
  if (!paidAt) return false;
  const elapsed = now.getTime() - paidAt.getTime();
  return elapsed >= 0 && elapsed <= BUYER_REFUND_WINDOW_MS;
}
