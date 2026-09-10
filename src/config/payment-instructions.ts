export type PaymentInstructions = {
  bankName: string;
  beneficiary: string;
  clabe: string;
  accountNumber: string | null;
};

export function getPaymentInstructions(): PaymentInstructions | null {
  const bankName = process.env.PAYMENT_BANK_NAME?.trim();
  const beneficiary = process.env.PAYMENT_BENEFICIARY?.trim();
  const clabe = process.env.PAYMENT_CLABE?.trim();
  const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER?.trim() || null;

  if (!bankName || !beneficiary || !clabe) return null;

  return { bankName, beneficiary, clabe, accountNumber };
}

export function isManualPaymentsConfigured() {
  return getPaymentInstructions() !== null;
}

/** En Vercel producción no se regala el acceso: hace falta pago real (MP o SPEI). */
export function isLivePaymentsRequired() {
  return process.env.VERCEL_ENV === "production";
}

export function isLiveCheckoutConfigured() {
  const mp =
    Boolean(process.env.MP_ACCESS_TOKEN?.trim()) ||
    Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
  return mp || isManualPaymentsConfigured();
}

/** Preferencia: Mercado Pago si hay token; SPEI solo como respaldo. */
export function preferredLiveCheckoutMode(): "mercadopago" | "manual" | null {
  const mp =
    Boolean(process.env.MP_ACCESS_TOKEN?.trim()) ||
    Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
  if (mp) return "mercadopago";
  if (isManualPaymentsConfigured()) return "manual";
  return null;
}
