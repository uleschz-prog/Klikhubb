"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ReferralCapture } from "@/components/academy/ReferralCapture";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <Suspense fallback={null}>
          <ReferralCapture />
        </Suspense>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
