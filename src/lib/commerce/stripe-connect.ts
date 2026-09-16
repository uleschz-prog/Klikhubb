import Stripe from "stripe";
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

export function stripeErrorMessage(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) return error.message;
  if (error instanceof Error) return error.message;
  return "CONNECT_ERROR";
}

/** Comprueba si la API de Connect responde (no solo si hay STRIPE_SECRET_KEY). */
export async function probeStripeConnect() {
  if (!isConnectPayoutsEnabled()) {
    return { ok: false as const, error: "CONNECT_NOT_ENABLED" };
  }
  try {
    await getStripe().accounts.list({ limit: 1 });
    return { ok: true as const, error: null };
  } catch (error) {
    return { ok: false as const, error: stripeErrorMessage(error) };
  }
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

  return createExpressDashboardUrl(user.stripeAccountId);
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
    accountId = await createRecipientAccount(stripe, { id: user.id, email: user.email });
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: accountId },
    });
  }

  const origin = appBaseUrl();
  const url = await createOnboardingUrl(stripe, accountId, origin);
  return { url, accountId };
}

async function createRecipientAccountV1(
  stripe: Stripe,
  user: { id: string; email: string },
  losses: "stripe" | "application",
) {
  const account = await stripe.accounts.create(
    {
      country: connectCountry(),
      email: user.email,
      metadata: { userId: user.id, platform: "qlyk" },
      capabilities: {
        transfers: { requested: true },
      },
      business_profile: {
        product_description: "Ventas de cursos y videos en Qlyk",
      },
      controller: {
        fees: { payer: "application" },
        losses: { payments: losses },
        requirement_collection: "stripe",
        stripe_dashboard: { type: "express" },
      },
    },
    { idempotencyKey: `qlyk_connect_ctrl_${losses}_${user.id}` },
  );
  return account.id;
}

async function createRecipientAccountV2(
  stripe: Stripe,
  user: { id: string; email: string },
  entityType: "individual" | "company",
) {
  const account = await stripe.v2.core.accounts.create(
    {
      display_name: user.email,
      contact_email: user.email,
      dashboard: "express",
      metadata: { userId: user.id, platform: "qlyk" },
      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "stripe",
        },
        profile: {
          product_description: "Ventas de cursos y videos en Qlyk",
        },
      },
      identity: {
        country: connectCountry(),
        entity_type: entityType,
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      include: ["configuration.recipient", "identity", "requirements"],
    },
    { idempotencyKey: `qlyk_connect_v2_${entityType}_stripe_${user.id}` },
  );
  return account.id;
}

async function createRecipientAccount(
  stripe: Stripe,
  user: { id: string; email: string },
) {
  const errors: string[] = [];

  for (const losses of ["stripe", "application"] as const) {
    try {
      return await createRecipientAccountV1(stripe, user, losses);
    } catch (error) {
      const message = stripeErrorMessage(error);
      errors.push(`v1/${losses}: ${message}`);
      console.warn("Connect v1 controller falló", losses, message);
    }
  }

  for (const entityType of ["individual", "company"] as const) {
    try {
      return await createRecipientAccountV2(stripe, user, entityType);
    } catch (error) {
      const message = stripeErrorMessage(error);
      errors.push(`v2/${entityType}: ${message}`);
      console.warn("Connect Accounts v2 falló", entityType, message);
    }
  }

  throw new Error(errors.join(" | "));
}

async function createOnboardingUrl(stripe: Stripe, accountId: string, origin: string) {
  const refreshUrl = `${origin}/wallet?connect=refresh`;
  const returnUrl = `${origin}/wallet?connect=return`;
  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    return link.url;
  } catch (error) {
    console.warn("Connect v1 accountLinks falló, intentando v2", stripeErrorMessage(error));
    const link = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["recipient"],
          refresh_url: refreshUrl,
          return_url: returnUrl,
        },
      },
    });
    return link.url;
  }
}

async function createExpressDashboardUrl(accountId: string) {
  const stripe = getStripe();
  try {
    const link = await stripe.accounts.createLoginLink(accountId);
    return link.url;
  } catch (error) {
    console.warn("Connect login link v1 falló, intentando v2 update", stripeErrorMessage(error));
    const origin = appBaseUrl();
    const link = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_update",
        account_update: {
          configurations: ["recipient"],
          refresh_url: `${origin}/wallet?connect=refresh`,
          return_url: `${origin}/wallet?connect=return`,
        },
      },
    });
    return link.url;
  }
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

  const { payoutsEnabled, requirementsDue, disabledReason } = await retrieveConnectRequirements(id);

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

async function retrieveConnectRequirements(accountId: string) {
  const stripe = getStripe();
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return readAccountRequirements(account);
  } catch (error) {
    console.warn("Connect v1 retrieve falló, intentando v2", stripeErrorMessage(error));
    const account = await stripe.v2.core.accounts.retrieve(accountId, {
      include: ["configuration.recipient", "requirements"],
    });
    const transfers =
      account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status;
    const payouts = account.configuration?.recipient?.capabilities?.stripe_balance?.payouts?.status;
    const due =
      account.requirements?.entries
        ?.filter((entry) => entry.awaiting_action_from === "user")
        .map((entry) => entry.description) ?? [];
    return {
      requirementsDue: due,
      disabledReason: transfers === "restricted" || payouts === "restricted" ? "restricted" : null,
      payoutsEnabled: transfers === "active" && (payouts === "active" || payouts === undefined),
    };
  }
}
