"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/academy", label: "Academy" },
  { href: "/academy/studio", label: "Estudio IA" },
  { href: "/academy/cursos", label: "Mis cursos" },
  { href: "/academy/red", label: "Red" },
];

export function AcademyHubNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = tab.href === "/academy" ? pathname === "/academy" : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
              active ? "bg-klik-cyan text-klik-black" : "border border-white/10 text-white/70 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
