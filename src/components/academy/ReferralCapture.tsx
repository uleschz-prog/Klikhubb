"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ACADEMY_REF_COOKIE, ACADEMY_REF_MAX_AGE, normalizeReferralCode } from "@/lib/academy/referral";

export function ReferralCapture() {
  const params = useSearchParams();
  useEffect(() => {
    const code = normalizeReferralCode(params.get("ref"));
    if (!code) return;
    document.cookie = `${ACADEMY_REF_COOKIE}=${encodeURIComponent(code)};path=/;max-age=${ACADEMY_REF_MAX_AGE};samesite=lax`;
  }, [params]);
  return null;
}
