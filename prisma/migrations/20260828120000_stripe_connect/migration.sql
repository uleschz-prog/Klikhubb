-- Stripe Connect: cuentas conectadas para retiros reales
ALTER TABLE "users" ADD COLUMN "stripeAccountId" TEXT;
ALTER TABLE "users" ADD COLUMN "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "users_stripeAccountId_key" ON "users"("stripeAccountId");

ALTER TABLE "payouts" ADD COLUMN "providerRef" TEXT;
ALTER TABLE "payouts" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "payouts" ADD COLUMN "failureNote" TEXT;

CREATE UNIQUE INDEX "payouts_providerRef_key" ON "payouts"("providerRef");
