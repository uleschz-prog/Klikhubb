export const ACADEMY_REF_COOKIE = "qlyk_ref";
export const ACADEMY_REF_MAX_AGE = 60 * 24 * 60 * 60;

export function normalizeReferralCode(value?: string | null) {
  const code = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  if (code.length < 4 || code.length > 32) return null;
  return code;
}

export function academyInvitePath(referralCode: string) {
  return `/register?ref=${encodeURIComponent(referralCode)}&next=/academy`;
}
