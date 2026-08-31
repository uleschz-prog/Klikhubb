-- Suscripción mensual para cursos
CREATE TYPE "ProductBilling" AS ENUM ('ONE_TIME', 'MONTHLY');

ALTER TABLE "products" ADD COLUMN "billing" "ProductBilling" NOT NULL DEFAULT 'ONE_TIME';

CREATE TABLE "product_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "status" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_subscriptions_enrollmentId_key" ON "product_subscriptions"("enrollmentId");
CREATE UNIQUE INDEX "product_subscriptions_stripeSubscriptionId_key" ON "product_subscriptions"("stripeSubscriptionId");
CREATE UNIQUE INDEX "product_subscriptions_userId_productId_key" ON "product_subscriptions"("userId", "productId");
CREATE INDEX "product_subscriptions_productId_status_idx" ON "product_subscriptions"("productId", "status");

ALTER TABLE "product_subscriptions" ADD CONSTRAINT "product_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_subscriptions" ADD CONSTRAINT "product_subscriptions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_subscriptions" ADD CONSTRAINT "product_subscriptions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
