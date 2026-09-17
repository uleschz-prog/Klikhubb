import Link from "next/link";

const LINKS = [
  { href: "/admin/users", label: "Usuarios y red" },
  { href: "/admin/setup", label: "Setup" },
  { href: "/admin/payments", label: "Pagos" },
  { href: "/admin/payouts", label: "Retiros" },
  { href: "/admin/creator-plans", label: "Planes" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function AdminOpsNav({ current }: { current?: string }) {
  return (
    <div className="mt-4 flex flex-wrap gap-4 text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`font-semibold hover:underline ${
            current === link.href ? "text-white" : "text-klik-cyan"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
