import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/commerce/stripe";
import { siteUrl } from "@/config/site";

export const STRIPE_WEBHOOK_SECRET_KEY = "stripe_webhook_secret";

const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "account.updated",
] as const;

function normalizeSecret(value: string | null | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function stripeWebhookUrl() {
  return `${siteUrl()}/api/webhooks/stripe`;
}

export async function loadStripeWebhookSecrets(): Promise<string[]> {
  const secrets: string[] = [];
  const envSecret = normalizeSecret(process.env.STRIPE_WEBHOOK_SECRET);

  try {
    const stored = await prisma.platformSecret.findUnique({
      where: { key: STRIPE_WEBHOOK_SECRET_KEY },
    });
    const dbSecret = normalizeSecret(stored?.value);
    if (dbSecret) secrets.push(dbSecret);
  } catch {
    // Postgres no disponible: solo env.
  }

  if (envSecret && !secrets.includes(envSecret)) secrets.push(envSecret);

  return secrets;
}

export function verifyStripeWebhookEvent(raw: string, signature: string, secrets: string[]) {
  const stripe = getStripe();
  let lastError: unknown;

  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(raw, signature, secret);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Firma de webhook inválida.");
}

export async function syncStripeWebhookEndpoint(options?: { force?: boolean }) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  const force = options?.force ?? process.env.STRIPE_WEBHOOK_SYNC === "force";
  if (!force) {
    const stored = await prisma.platformSecret.findUnique({
      where: { key: STRIPE_WEBHOOK_SECRET_KEY },
    });
    if (stored?.value?.trim()) {
      return { synced: false, reason: "already_stored" as const, endpointId: null, url: stripeWebhookUrl() };
    }
  }

  const stripe = getStripe();
  const url = stripeWebhookUrl();

  const listed = await stripe.webhookEndpoints.list({ limit: 100 });
  for (const endpoint of listed.data) {
    if (endpoint.url === url) {
      await stripe.webhookEndpoints.del(endpoint.id);
    }
  }

  const created = await stripe.webhookEndpoints.create({
    url,
    enabled_events: [...WEBHOOK_EVENTS],
  });

  if (!created.secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET_MISSING");
  }

  await prisma.platformSecret.upsert({
    where: { key: STRIPE_WEBHOOK_SECRET_KEY },
    create: { key: STRIPE_WEBHOOK_SECRET_KEY, value: created.secret },
    update: { value: created.secret },
  });

  return {
    synced: true,
    reason: "created" as const,
    endpointId: created.id,
    url,
  };
}
