"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navegación móvil estilo app: 5 destinos claros.
 * Inicio = TikTok (clips). Tienda = feed de compra. Cuenta = banca (saldo + ajustes).
 */
const tabs = [
  { href: "/play", label: "Ver", match: ["/play"] },
  { href: "/feed", label: "Comprar", match: ["/feed", "/marketplace"] },
  { href: "/search", label: "Buscar", match: ["/search"] },
  { href: "/orders", label: "Mis cosas", match: ["/orders", "/academy"] },
  { href: "/dashboard", label: "Yo", match: ["/dashboard", "/wallet", "/studio", "/notifications"] },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="pwa-native-bar fixed inset-x-0 bottom-0 z-40 border-t border-klik-line bg-klik-black/95 backdrop-blur-xl supports-[backdrop-filter]:bg-klik-black/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid h-14 grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex h-full min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-wide ${
                  active ? "text-klik-cyan" : "text-white/45"
                }`}
              >
                <span
                  className={`h-1 w-4 rounded-full ${active ? "bg-klik-cyan" : "bg-transparent"}`}
                  aria-hidden
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
