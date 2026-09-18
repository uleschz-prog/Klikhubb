import Link from "next/link";
import { getUser } from "@/lib/supabase/session";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  let user: Awaited<ReturnType<typeof getUser>> = null;
  try {
    user = await getUser();
  } catch {
    user = null;
  }

  return (
    <header className="border-b border-ink-700/10 bg-paper-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="group">
          <p className="stamp text-[10px] text-cedar-700">Hidalgo · México</p>
          <p className="font-serif text-xl tracking-tight text-ink-950">
            RentasSeguras <span className="text-cedar-600">MX</span>
          </p>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link className="hover:text-cedar-700" href="/dashboard">
                Panel
              </Link>
              <Link className="hover:text-cedar-700" href="/contrato">
                Nuevo contrato
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link className="hover:text-cedar-700" href="/iniciar-sesion">
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-cedar-600 px-4 py-2 font-medium text-paper-50 hover:bg-cedar-700"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
