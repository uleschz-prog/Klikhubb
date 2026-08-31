"use client";

import Link from "next/link";
import { formatProductPrice } from "@/lib/commerce/billing";

type BuyButtonProps = {
  price: number;
  currency?: string;
  billing?: "ONE_TIME" | "MONTHLY" | null;
  label?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function BuyButton({
  price,
  currency = "USD",
  billing = "ONE_TIME",
  label = "Comprar ahora",
  href = "/marketplace",
  onClick,
  className = "",
}: BuyButtonProps) {
  const classes = `group inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black ${className}`;
  const inner = (
    <>
      <span>{label}</span>
      <span className="rounded-full bg-black/15 px-3 py-1 font-display text-xs tracking-wide">
        {formatProductPrice(price, currency, billing)}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}
