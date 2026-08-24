import { Logo } from "@/components/brand/Logo";

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-white/70">
      <Logo />
      <h1 className="mt-8 font-display text-3xl font-extrabold text-white">Cookies</h1>
      <p className="mt-4 text-sm leading-7">
        Usamos cookies esenciales de sesión (NextAuth) y métricas agregadas del feed. Puedes rechazar
        cookies no esenciales desde la configuración de tu navegador.
      </p>
    </main>
  );
}
