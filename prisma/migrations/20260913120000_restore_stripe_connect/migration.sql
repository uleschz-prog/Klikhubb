-- Restore Stripe Connect fields dropped when checkout went SPEI-only.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "users_stripeAccountId_key" ON "users"("stripeAccountId");
