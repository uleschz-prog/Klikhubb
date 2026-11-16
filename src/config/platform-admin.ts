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

/**
 * Contraseña del admin.
 * En producción y previews hay que definir PLATFORM_ADMIN_PASSWORD.
 * El fallback hardcodeado solo existe en NODE_ENV=development.
 */
export function platformAdminPassword() {
  const fromEnv = process.env.PLATFORM_ADMIN_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") return "Codigo1.";
  return "";
}
