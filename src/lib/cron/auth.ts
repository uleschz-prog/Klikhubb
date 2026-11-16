/**
 * Autoriza el cron de liberación de monederos.
 * En producción exige `Authorization: Bearer $CRON_SECRET`.
 * Vercel envía ese header automáticamente si existe la env `CRON_SECRET`.
 * Ya no basta el header `x-vercel-cron` por sí solo.
 * En desarrollo, si no hay `CRON_SECRET`, se permite (solo local).
 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  const bearerOk = Boolean(secret && auth === `Bearer ${secret}`);

  if (process.env.NODE_ENV === "development" && !secret) {
    return true;
  }

  return bearerOk;
}
