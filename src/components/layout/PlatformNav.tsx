"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/feed", label: "Feed" },
  { href: "/search", label: "Buscar" },
  { href: "/marketplace", label: "Market" },
  { href: "/academy", label: "Academy" },
  { href: "/orders", label: "Pedidos" },
  { href: "/notifications", label: "Avisos" },
  { href: "/dashboard", label: "Hub" },
];

export function PlatformNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-6 md:flex">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs font-semibold uppercase tracking-[0.18em] transition ${
              active ? "text-klik-cyan" : "text-white/55 hover:text-klik-cyan"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
