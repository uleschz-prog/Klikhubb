"use client";

import { Suspense } from "react";
import { PremiumRegisterForm } from "@/components/auth/PremiumRegisterForm";

export function RegisterForm() {
  return (
    <Suspense fallback={null}>
      <PremiumRegisterForm variant="page" />
    </Suspense>
  );
}
