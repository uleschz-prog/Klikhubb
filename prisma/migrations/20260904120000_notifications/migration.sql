-- Notifications for buyers/creators

CREATE TYPE "NotificationType" AS ENUM (
  'PAYMENT_APPROVED',
  'PAYMENT_REJECTED',
  'PAYMENT_PROOF_RECEIVED',
  'NEW_FOLLOWER',
  'NEW_SALE',
  'PAYOUT_COMPLETED',
  'SYSTEM'
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
