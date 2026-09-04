-- CreateEnum
CREATE TYPE "CreatorBillingPlan" AS ENUM ('PAYG', 'FLAT');

-- CreateEnum
CREATE TYPE "CreatorPlanInvoiceStatus" AS ENUM ('PENDING', 'PROOF_SUBMITTED', 'PAID', 'REJECTED', 'CANCELED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "creatorPlan" "CreatorBillingPlan" NOT NULL DEFAULT 'PAYG';
ALTER TABLE "users" ADD COLUMN "creatorPlanUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "creator_plan_invoices" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "status" "CreatorPlanInvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "proofNote" TEXT,
    "reviewerNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_plan_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_plan_invoices_reference_key" ON "creator_plan_invoices"("reference");

-- CreateIndex
CREATE INDEX "creator_plan_invoices_status_createdAt_idx" ON "creator_plan_invoices"("status", "createdAt");

-- CreateIndex
CREATE INDEX "creator_plan_invoices_userId_status_createdAt_idx" ON "creator_plan_invoices"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "users_creatorPlan_creatorPlanUntil_idx" ON "users"("creatorPlan", "creatorPlanUntil");

-- AddForeignKey
ALTER TABLE "creator_plan_invoices" ADD CONSTRAINT "creator_plan_invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_plan_invoices" ADD CONSTRAINT "creator_plan_invoices_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
