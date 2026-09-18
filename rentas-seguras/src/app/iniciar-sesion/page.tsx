import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="px-4 py-16">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
