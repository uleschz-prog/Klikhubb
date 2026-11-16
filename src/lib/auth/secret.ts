/**
 * Resuelve el secreto de NextAuth.
 * En desarrollo (`NODE_ENV=development`) puede usarse un valor local explícito.
 * En runtime de producción (Vercel o `next start`) el secreto es obligatorio.
 * Durante `next build` no se lanza error para no romper el compilado local/CI.
 */
export function resolveNextAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "development") {
    return "klikhubb-dev-only-secret";
  }

  const isProductionRuntime =
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build");

  if (isProductionRuntime) {
    throw new Error("NEXTAUTH_SECRET (o AUTH_SECRET) es obligatorio fuera de desarrollo.");
  }

  // Solo para la fase de compilación (`next build`) sin secretos cargados.
  return "klikhubb-build-placeholder-not-for-production";
}
