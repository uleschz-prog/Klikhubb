"use client";

import Link from "next/link";
import { PriceTag } from "@/components/ui/PriceTag";

type BuyButtonProps = {
  price: number;
  currency?: string;
  label?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  fx?: number;
};

export function BuyButton({
  price,
  currency = "USD",
  label = "Comprar ahora",
  href = "/marketplace",
  onClick,
  className = "",
  fx,
}: BuyButtonProps) {
  const classes = `group inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black ${className}`;
  const inner = (
    <>
      <span>{label}</span>
      <span className="rounded-full bg-black/15 px-3 py-1 text-left">
        <PriceTag amount={price} currency={currency} fx={fx} size="sm" compact align="right" />
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
