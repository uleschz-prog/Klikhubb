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

/** En Vercel producción no se regala el acceso: hace falta Stripe o SPEI confirmado. */
export function isLivePaymentsRequired() {
  if (process.env.REQUIRE_LIVE_PAYMENTS === "0") return false;
  if (process.env.REQUIRE_LIVE_PAYMENTS === "1") return true;
  return process.env.VERCEL_ENV === "production";
}
