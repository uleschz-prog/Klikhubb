-- Manual payments + remove Stripe artifacts

UPDATE "products" SET "billing" = 'ONE_TIME' WHERE "billing" = 'MONTHLY';

DROP TABLE IF EXISTS "product_subscriptions";

ALTER TABLE "users" DROP COLUMN IF EXISTS "stripeAccountId";
ALTER TABLE "users" DROP COLUMN IF EXISTS "stripePayoutsEnabled";

CREATE TYPE "ManualPaymentStatus" AS ENUM ('PENDING', 'PROOF_SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE "manual_payment_requests" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "status" "ManualPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "proofNote" TEXT,
    "reviewerNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_payment_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "manual_payment_requests_reference_key" ON "manual_payment_requests"("reference");
CREATE UNIQUE INDEX "manual_payment_requests_orderId_key" ON "manual_payment_requests"("orderId");
CREATE INDEX "manual_payment_requests_status_createdAt_idx" ON "manual_payment_requests"("status", "createdAt");
CREATE INDEX "manual_payment_requests_buyerId_productId_idx" ON "manual_payment_requests"("buyerId", "productId");

ALTER TABLE "manual_payment_requests" ADD CONSTRAINT "manual_payment_requests_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "manual_payment_requests" ADD CONSTRAINT "manual_payment_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manual_payment_requests" ADD CONSTRAINT "manual_payment_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "manual_payment_requests" ADD CONSTRAINT "manual_payment_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove MONTHLY from ProductBilling enum
ALTER TYPE "ProductBilling" RENAME TO "ProductBilling_old";
CREATE TYPE "ProductBilling" AS ENUM ('ONE_TIME');
ALTER TABLE "products" ALTER COLUMN "billing" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "billing" TYPE "ProductBilling" USING ('ONE_TIME'::"ProductBilling");
ALTER TABLE "products" ALTER COLUMN "billing" SET DEFAULT 'ONE_TIME';
DROP TYPE "ProductBilling_old";
