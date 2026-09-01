import type { ProductBilling } from "@prisma/client";
import { formatMoney } from "@/lib/commerce/split";

export type BillingMode = ProductBilling;

export function formatProductPrice(price: number, currency = "USD") {
  return formatMoney(price, currency);
}

export function checkoutButtonLabel(title: string) {
  return `Pagar ${title}`;
}
