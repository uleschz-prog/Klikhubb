-- Additive: USDT TRC20 checkout and payout destination via NOWPayments.

ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "usdtTrc20Address" TEXT;

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payAddress" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "txHash" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payAmount" DECIMAL(19,8);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payCurrency" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "actuallyPaid" DECIMAL(19,8);

CREATE TABLE IF NOT EXISTS "crypto_invoices" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "orderId" TEXT,
    "status" TEXT NOT NULL,
    "payAddress" TEXT,
    "payAmount" DECIMAL(19,8),
    "payCurrency" TEXT,
    "priceAmount" DECIMAL(19,4),
    "priceCurrency" TEXT,
    "txHash" TEXT,
    "actuallyPaid" DECIMAL(19,8),
    "rawStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "crypto_invoices_providerRef_key" ON "crypto_invoices"("providerRef");
CREATE INDEX IF NOT EXISTS "crypto_invoices_buyerId_productId_createdAt_idx" ON "crypto_invoices"("buyerId", "productId", "createdAt");
