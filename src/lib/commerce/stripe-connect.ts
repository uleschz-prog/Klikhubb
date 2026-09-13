import { prisma } from "@/lib/prisma";
import { appBaseUrl, getStripe, isStripeEnabled } from "@/lib/commerce/stripe";

export type ConnectStatus = {
  enabled: boolean;
  connected: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
  requirementsDue: string[];
  disabledReason: string | null;
};

/** Retiros automáticos vía Stripe Connect (Express). Activo si hay Stripe, salvo STRIPE_CONNECT_ENABLED=false. */
export function isConnectPayoutsEnabled() {
  if (!isStripeEnabled()) return false;
  const flag = process.env.STRIPE_CONNECT_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  return true;
}

function connectCountry() {
  return process.env.STRIPE_CONNECT_COUNTRY?.trim().toUpperCase() || "MX";
}

function readAccountRequirements(account: {
  requirements?: { currently_due?: string[] | null; disabled_reason?: string | null } | null;
  payouts_enabled?: boolean | null;
  details_submitted?: boolean | null;
}) {
  return {
    requirementsDue: account.requirements?.currently_due ?? [],
    disabledReason: account.requirements?.disabled_reason ?? null,
    payoutsEnabled: Boolean(account.payouts_enabled && account.details_submitted),
  };
}

export async function loadConnectStatus(userId: string): Promise<ConnectStatus> {
  const enabled = isConnectPayoutsEnabled();
  const empty: ConnectStatus = {
    enabled,
    connected: false,
    payoutsEnabled: false,
    accountId: null,
    requirementsDue: [],
    disabledReason: null,
  };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true, stripePayoutsEnabled: true },
  });
  if (!user) return empty;

  if (user.stripeAccountId && enabled) {
    const synced = await syncConnectAccount(userId, user.stripeAccountId);
    return {
      enabled,
      connected: Boolean(synced.accountId),
      payoutsEnabled: synced.payoutsEnabled,
      accountId: synced.accountId,
      requirementsDue: synced.requirementsDue,
      disabledReason: synced.disabledReason,
    };
  }

  return {
    ...empty,
    connected: Boolean(user.stripeAccountId),
    payoutsEnabled: user.stripePayoutsEnabled,
    accountId: user.stripeAccountId,
  };
}

export async function createConnectDashboardLink(userId: string) {
  if (!isConnectPayoutsEnabled()) {
    throw new Error("CONNECT_NOT_ENABLED");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true },
  });
  if (!user?.stripeAccountId) {
    throw new Error("CONNECT_NOT_CONNECTED");
  }

  const link = await getStripe().accounts.createLoginLink(user.stripeAccountId);
  return link.url;
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
    const account = await stripe.accounts.create(
      {
        type: "express",
        country: connectCountry(),
        email: user.email,
        metadata: { userId: user.id, platform: "qlyk" },
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          product_description: "Ventas de cursos y videos en Qlyk",
        },
      },
      { idempotencyKey: `qlyk_connect_${user.id}` },
    );
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
    return {
      accountId: id ?? null,
      payoutsEnabled: false,
      requirementsDue: [] as string[],
      disabledReason: null as string | null,
    };
  }

  const account = await getStripe().accounts.retrieve(id);
  const { payoutsEnabled, requirementsDue, disabledReason } = readAccountRequirements(account);

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeAccountId: id,
      stripePayoutsEnabled: payoutsEnabled,
    },
  });

  return { accountId: id, payoutsEnabled, requirementsDue, disabledReason };
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

  return getStripe().transfers.create(
    {
      amount: input.amountCents,
      currency: input.currency.trim().toLowerCase() || "usd",
      destination: user.stripeAccountId,
      metadata: {
        payoutId: input.payoutId,
        userId: input.userId,
      },
    },
    { idempotencyKey: `payout_${input.payoutId}` },
  );
}

export async function handleConnectAccountUpdated(accountId: string) {
  const user = await prisma.user.findFirst({
    where: { stripeAccountId: accountId },
    select: { id: true },
  });
  if (!user) return;
  await syncConnectAccount(user.id, accountId);
}
