export const PLATFORM_ADMIN = {
  username: "Qlykadmin",
  email: "qlykadmin@qlyk.app",
  displayName: "Qlyk Admin",
  referralCode: "QLYKADMIN",
} as const;

export function isPlatformAdminIdentity(user: {
  email?: string | null;
  username?: string | null;
  referralCode?: string | null;
} | null | undefined) {
  if (!user) return false;
  if (user.email?.trim().toLowerCase() === PLATFORM_ADMIN.email) return true;
  if (user.username?.trim().toLowerCase() === PLATFORM_ADMIN.username.toLowerCase()) return true;
  if (user.referralCode?.trim().toUpperCase() === PLATFORM_ADMIN.referralCode) return true;
  return false;
}

/** Contraseña del admin: en producción usa PLATFORM_ADMIN_PASSWORD. El fallback solo aplica en local. */
export function platformAdminPassword() {
  const fromEnv = process.env.PLATFORM_ADMIN_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_ENV === "production") return "";
  return "Codigo1.";
}
