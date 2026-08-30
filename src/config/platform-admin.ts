export const PLATFORM_ADMIN = {
  username: "Qlykadmin",
  email: "qlykadmin@qlyk.app",
  displayName: "Qlyk Admin",
  referralCode: "QLYKADMIN",
} as const;

/** Contraseña del admin: en producción usa PLATFORM_ADMIN_PASSWORD. El fallback solo aplica en local. */
export function platformAdminPassword() {
  const fromEnv = process.env.PLATFORM_ADMIN_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_ENV === "production") return "";
  return "Codigo1.";
}
