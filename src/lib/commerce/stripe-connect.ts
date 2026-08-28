import { prisma } from "@/lib/prisma";
import { appBaseUrl, getStripe, isStripeEnabled } from "@/lib/commerce/stripe";

export type ConnectStatus = {
  enabled: boolean;
  connected: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
  dashboardUrl: string | null;
};

/** Activa retiros automáticos vía Stripe Connect (Express). */
export function isConnectPayoutsEnabled() {
  return isStripeEnabled() && process.env.STRIPE_CONNECT_ENABLED?.trim() === "true";
}

function connectCountry() {
  return process.env.STRIPE_CONNECT_COUNTRY?.trim().toUpperCase() || "MX";
}

export async function loadConnectStatus(userId: string): Promise<ConnectStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true, stripePayoutsEnabled: true, email: true },
  });

  if (!user) {
    return {
      enabled: isConnectPayoutsEnabled(),
      connected: false,
      payoutsEnabled: false,
      accountId: null,
      dashboardUrl: null,
    };
  }

  let payoutsEnabled = user.stripePayoutsEnabled;
  let accountId = user.stripeAccountId;

  if (accountId && isConnectPayoutsEnabled()) {
    const synced = await syncConnectAccount(userId, accountId);
    payoutsEnabled = synced.payoutsEnabled;
    accountId = synced.accountId;
  }

  let dashboardUrl: string | null = null;
  if (accountId && isConnectPayoutsEnabled()) {
    try {
      const link = await getStripe().accounts.createLoginLink(accountId);
      dashboardUrl = link.url;
    } catch {
      dashboardUrl = null;
    }
  }

  return {
    enabled: isConnectPayoutsEnabled(),
    connected: Boolean(accountId),
    payoutsEnabled,
    accountId,
    dashboardUrl,
  };
}

export async function createConnectOnboardingLink(userId: string) {
  if (!isConnectPayoutsEnabled()) {
    throw new Error("CONNECT_NOT_ENABLED");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeAccountId: true },
  });
  if (!user?.email) {
    throw new Error("USER_EMAIL_REQUIRED");
  }

  const stripe = getStripe();
  let accountId = user.stripeAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: connectCountry(),
      email: user.email,
      metadata: { userId: user.id },
      capabilities: {
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: accountId },
    });
  }

  const origin = appBaseUrl();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/wallet?connect=refresh`,
    return_url: `${origin}/wallet?connect=return`,
    type: "account_onboarding",
  });

  return { url: link.url, accountId };
}

export async function syncConnectAccount(userId: string, accountId?: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true },
  });
  const id = accountId ?? user?.stripeAccountId;
  if (!id || !isConnectPayoutsEnabled()) {
    return { accountId: id ?? null, payoutsEnabled: false };
  }

  const account = await getStripe().accounts.retrieve(id);
  const payoutsEnabled = Boolean(account.payouts_enabled && account.details_submitted);

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeAccountId: id,
      stripePayoutsEnabled: payoutsEnabled,
    },
  });

  return { accountId: id, payoutsEnabled };
}

export async function executeConnectTransfer(input: {
  userId: string;
  payoutId: string;
  amountCents: number;
  currency: string;
}) {
  if (!isConnectPayoutsEnabled()) {
    throw new Error("CONNECT_NOT_ENABLED");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { stripeAccountId: true, stripePayoutsEnabled: true },
  });

  if (!user?.stripeAccountId || !user.stripePayoutsEnabled) {
    throw new Error("CONNECT_NOT_READY");
  }

  const transfer = await getStripe().transfers.create({
    amount: input.amountCents,
    currency: input.currency.trim().toLowerCase() || "usd",
    destination: user.stripeAccountId,
    metadata: {
      payoutId: input.payoutId,
      userId: input.userId,
    },
  });

  return transfer;
}

export async function handleConnectAccountUpdated(accountId: string) {
  const user = await prisma.user.findFirst({
    where: { stripeAccountId: accountId },
    select: { id: true },
  });
  if (!user) return;
  await syncConnectAccount(user.id, accountId);
}
