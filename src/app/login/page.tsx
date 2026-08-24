import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-klik-black" />}>
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
