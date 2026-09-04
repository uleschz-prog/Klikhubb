"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/play", label: "Play" },
  { href: "/feed", label: "Tienda" },
  { href: "/search", label: "Buscar" },
  { href: "/orders", label: "Pedidos" },
  { href: "/dashboard", label: "Hub" },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="pwa-native-bar fixed inset-x-0 bottom-0 z-40 border-t border-klik-line bg-klik-black/95 backdrop-blur-xl supports-[backdrop-filter]:bg-klik-black/80 md:hidden">
      <ul className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex min-h-14 flex-col items-center justify-center text-[10px] font-semibold uppercase tracking-wider ${
                  active ? "text-klik-cyan" : "text-white/45"
                }`}
              >
                <span
                  className={`mb-1 h-1 w-6 rounded-full ${active ? "bg-klik-cyan shadow-[0_0_12px_#00F0FF]" : "bg-transparent"}`}
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
