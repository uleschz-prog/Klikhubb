"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/commerce/split";

type BuyButtonProps = {
  price: number;
  currency?: string;
  label?: string;
  href?: string;
  className?: string;
};

export function BuyButton({
  price,
  currency = "USD",
  label = "Comprar ahora",
  href = "/marketplace",
  className = "",
}: BuyButtonProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black shadow-[0_0_24px_rgba(0,255,65,0.25)] transition hover:shadow-[0_0_40px_rgba(0,255,65,0.4)] ${className}`}
    >
      <span>{label}</span>
      <span className="rounded-full bg-black/15 px-3 py-1 font-display text-xs tracking-wide">
        {formatMoney(price, currency)}
      </span>
    </Link>
  );
}
