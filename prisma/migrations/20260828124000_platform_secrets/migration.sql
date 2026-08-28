-- Platform secrets for runtime config (Stripe webhook signing secret)
CREATE TABLE "platform_secrets" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_secrets_pkey" PRIMARY KEY ("key")
);
