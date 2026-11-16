export const MIN_PAYOUT_CENTS = 1_000;

export class WalletError extends Error {
  constructor(
    message: string,
    public readonly code: "INSUFFICIENT" | "MINIMUM" | "USER_NOT_FOUND" | "DESTINATION_REQUIRED",
  ) {
    super(message);
    this.name = "WalletError";
  }
}
