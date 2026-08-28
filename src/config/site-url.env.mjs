/** URL pública de producción (Vercel). */
export const PRODUCTION_URL = "https://qlyk.vercel.app";

/** Dominio anterior; se reescribe automáticamente si quedó en env vars. */
export const LEGACY_PRODUCTION_URL = "https://klikhubb.vercel.app";

export function normalizePublicUrl(url) {
  return url
    .trim()
    .replace(/\/$/, "")
    .replace(LEGACY_PRODUCTION_URL, PRODUCTION_URL);
}

export function resolveSiteUrl(options = {}) {
  const { ignoreNextAuth = false } = options;

  if (process.env.SITE_URL?.trim()) {
    return normalizePublicUrl(process.env.SITE_URL);
  }
  if (!ignoreNextAuth && process.env.NEXTAUTH_URL?.trim()) {
    return normalizePublicUrl(process.env.NEXTAUTH_URL);
  }
  if (process.env.VERCEL_URL) {
    return normalizePublicUrl(`https://${process.env.VERCEL_URL.replace(/\/$/, "")}`);
  }
  if (process.env.VERCEL) return PRODUCTION_URL;
  return "http://localhost:3000";
}

export function ensureNextAuthUrl() {
  const current = process.env.NEXTAUTH_URL?.trim();
  if (!current || current.includes("klikhubb.vercel.app")) {
    process.env.NEXTAUTH_URL = resolveSiteUrl({ ignoreNextAuth: true });
    return;
  }
  process.env.NEXTAUTH_URL = normalizePublicUrl(current);
}
