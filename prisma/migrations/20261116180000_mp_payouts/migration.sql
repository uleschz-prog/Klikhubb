-- Additive: creator Mercado Pago payout destination and payout tracking.
-- Does not drop or alter historical Stripe columns.

ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "mpPayoutEmail" TEXT;

ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "destination" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "amountUsd" DECIMAL(19,4);
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "amountMxn" DECIMAL(19,4);
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "fxRate" DECIMAL(19,8);
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "fxAt" TIMESTAMP(3);
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "externalRef" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "mpPayoutId" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "mpTransactionId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "payouts_idempotencyKey_key" ON "payouts"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "payouts_mpPayoutId_idx" ON "payouts"("mpPayoutId");

CREATE TABLE IF NOT EXISTS "payout_events" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "payout_events_payoutId_createdAt_idx" ON "payout_events"("payoutId", "createdAt");

ALTER TABLE "payout_events"
  ADD CONSTRAINT "payout_events_payoutId_fkey"
  FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
