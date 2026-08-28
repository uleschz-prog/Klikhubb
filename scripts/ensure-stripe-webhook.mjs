import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const KEY = "stripe_webhook_secret";

function normalizePublicUrl(url) {
  return url
    .trim()
    .replace(/\/$/, "")
    .replace("https://klikhubb.vercel.app", "https://qlyk.vercel.app");
}

function resolveSiteUrl() {
  if (process.env.SITE_URL?.trim()) return normalizePublicUrl(process.env.SITE_URL);
  if (process.env.NEXTAUTH_URL?.trim()) return normalizePublicUrl(process.env.NEXTAUTH_URL);
  if (process.env.VERCEL_URL) return normalizePublicUrl(`https://${process.env.VERCEL_URL}`);
  return "https://qlyk.vercel.app";
}

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) {
    console.log("Skipping stripe webhook sync (no STRIPE_SECRET_KEY).");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const hosted =
    Boolean(databaseUrl) &&
    !databaseUrl.includes("localhost") &&
    !databaseUrl.includes("127.0.0.1");

  if (!hosted) {
    console.log("Skipping stripe webhook sync (no hosted DATABASE_URL).");
    return;
  }

  const prisma = new PrismaClient();
  const force = process.env.STRIPE_WEBHOOK_SYNC === "force";

  try {
    if (!force) {
      const stored = await prisma.platformSecret.findUnique({ where: { key: KEY } });
      if (stored?.value?.trim()) {
        console.log("Stripe webhook secret already stored; skip (set STRIPE_WEBHOOK_SYNC=force to recreate).");
        return;
      }
    }

    const stripe = new Stripe(stripeKey);
    const url = `${resolveSiteUrl()}/api/webhooks/stripe`;

    const listed = await stripe.webhookEndpoints.list({ limit: 100 });
    for (const endpoint of listed.data) {
      if (endpoint.url === url) {
        await stripe.webhookEndpoints.del(endpoint.id);
        console.log("Removed old Stripe webhook endpoint:", endpoint.id);
      }
    }

    const created = await stripe.webhookEndpoints.create({
      url,
      enabled_events: [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "account.updated",
      ],
    });

    if (!created.secret) {
      throw new Error("Stripe did not return a webhook signing secret.");
    }

    await prisma.platformSecret.upsert({
      where: { key: KEY },
      create: { key: KEY, value: created.secret },
      update: { value: created.secret },
    });

    console.log("Stripe webhook synced:", created.id, url);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
