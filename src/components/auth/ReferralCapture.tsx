"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { REF_COOKIE, REF_COOKIE_MAX_AGE, normalizeReferralCode } from "@/lib/auth/referral";

export function ReferralCapture() {
  const params = useSearchParams();
  useEffect(() => {
    const code = normalizeReferralCode(params.get("ref"));
    if (!code) return;
    document.cookie = `${REF_COOKIE}=${encodeURIComponent(code)};path=/;max-age=${REF_COOKIE_MAX_AGE};samesite=lax`;
  }, [params]);
  return null;
}
