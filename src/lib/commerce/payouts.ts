import { LedgerType, Prisma, type PayoutStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fromCents, toCents } from "@/lib/money/cents";
import { resolveUsdMxnQuote, usdToMxn, type FxQuote } from "@/lib/payments/fx";
import { MercadoPagoError } from "@/lib/payments/mercadopago";
import {
  createAccountPayout,
  getAccountPayout,
  isMercadoPagoPayoutsReady,
  newPayoutIdempotencyKey,
} from "@/lib/payments/mp-payouts";
import { createUsdtPayout, isUsdtPayoutsReady } from "@/lib/payments/nowpayments";
import { isValidTrc20Address, normalizeTrc20Address } from "@/lib/payments/trc20";
import {
  isValidMpPayoutEmail,
  mapMpTransactionStatus,
  nextPayoutTransition,
  normalizeMpPayoutEmail,
  payoutExternalReference,
  type PayoutLifecycle,
} from "@/lib/commerce/payout-state";
import { MIN_PAYOUT_CENTS, WalletError } from "@/lib/commerce/wallet-core";

function money(cents: number): Prisma.Decimal {
  return new Prisma.Decimal(fromCents(cents).toFixed(4));
}

function asMoney(value: Prisma.Decimal | number): Prisma.Decimal {
  return new Prisma.Decimal(Number(value).toFixed(4));
}

export class PayoutDestinationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayoutDestinationError";
  }
}

export async function saveMpPayoutEmail(userId: string, email: string) {
  const normalized = normalizeMpPayoutEmail(email);
  if (!isValidMpPayoutEmail(normalized)) {
    throw new PayoutDestinationError("Escribe un correo válido de tu cuenta Mercado Pago.");
  }

  await prisma.wallet.upsert({
    where: { userId },
    update: { mpPayoutEmail: normalized },
    create: { userId, mpPayoutEmail: normalized, currency: "USD" },
  });

  return { email: normalized };
}

export async function loadMpPayoutEmail(userId: string): Promise<string | null> {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { mpPayoutEmail: true },
  });
  return wallet?.mpPayoutEmail ?? null;
}

export async function saveUsdtPayoutAddress(userId: string, address: string) {
  const normalized = normalizeTrc20Address(address);
  if (!isValidTrc20Address(normalized)) {
    throw new PayoutDestinationError("Escribe una dirección USDT TRC20 válida (empieza con T).");
  }
  await prisma.wallet.upsert({
    where: { userId },
    update: { usdtTrc20Address: normalized },
    create: { userId, usdtTrc20Address: normalized, currency: "USD" },
  });
  return { address: normalized };
}

export async function loadUsdtPayoutAddress(userId: string): Promise<string | null> {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { usdtTrc20Address: true },
  });
  return wallet?.usdtTrc20Address ?? null;
}

export type CreatorPayoutResult = {
  payoutId: string;
  amount: number;
  amountMxn: number | null;
  fxRate: number | null;
  available: number;
  pending: number;
  mode: "mercadopago" | "usdt" | "manual";
  status: PayoutStatus;
};

export async function requestCreatorPayout(
  userId: string,
  requestedAmount?: number,
  preferredMethod?: "mercadopago" | "usdt" | "manual",
): Promise<CreatorPayoutResult> {
  let fx: FxQuote | null = null;
  try {
    fx = await resolveUsdMxnQuote();
  } catch {
    fx = null;
  }

  const autoMp = isMercadoPagoPayoutsReady();
  const autoUsdt = isUsdtPayoutsReady();
  const existingEmail = await loadMpPayoutEmail(userId);
  const existingUsdt = await loadUsdtPayoutAddress(userId);

  let method: "mercadopago" | "usdt" | "manual" = "manual";
  if (preferredMethod === "manual") {
    method = "manual";
  } else if (preferredMethod === "usdt" || (preferredMethod !== "mercadopago" && autoUsdt && existingUsdt && !autoMp)) {
    method = "usdt";
  } else if (preferredMethod === "mercadopago" || autoMp) {
    method = autoMp ? "mercadopago" : "manual";
  }

  if (preferredMethod === "usdt") method = "usdt";
  if (preferredMethod === "mercadopago") method = "mercadopago";

  if (method === "mercadopago" && autoMp && !existingEmail) {
    throw new WalletError(
      "Guarda el correo de tu cuenta Mercado Pago antes de pedir un retiro automático.",
      "DESTINATION_REQUIRED",
    );
  }
  if (method === "usdt" && !existingUsdt) {
    throw new WalletError(
      "Guarda tu dirección USDT TRC20 antes de pedir un retiro en cripto.",
      "DESTINATION_REQUIRED",
    );
  }
  if (method === "usdt" && !autoUsdt) {
    method = "usdt"; // queda pendiente para el admin
  }

  const draft = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new WalletError("Aún no tienes monedero. Primero vende o invita.", "USER_NOT_FOUND");
    }

    const availableCents = toCents(Number(wallet.available));
    if (availableCents < MIN_PAYOUT_CENTS) {
      throw new WalletError(
        `Necesitas al menos ${fromCents(MIN_PAYOUT_CENTS).toFixed(2)} USD disponibles para retirar.`,
        "MINIMUM",
      );
    }

    const requestCents = requestedAmount == null ? availableCents : toCents(requestedAmount);
    if (requestCents < MIN_PAYOUT_CENTS) {
      throw new WalletError(
        `El retiro mínimo es ${fromCents(MIN_PAYOUT_CENTS).toFixed(2)} USD.`,
        "MINIMUM",
      );
    }
    if (requestCents > availableCents) {
      throw new WalletError("No tienes ese saldo disponible.", "INSUFFICIENT");
    }

    const amount = money(requestCents);
    const amountUsd = Number(amount);
    const amountMxn = fx ? usdToMxn(amountUsd, fx.rate) : null;
    const destination = method === "usdt" ? existingUsdt : existingEmail;
    const resolvedMethod = method === "mercadopago" && existingEmail && autoMp
      ? "mercadopago"
      : method === "usdt" && existingUsdt
        ? "usdt"
        : "manual";
    const idempotencyKey = newPayoutIdempotencyKey();

    const payout = await tx.payout.create({
      data: {
        userId,
        amount,
        currency: wallet.currency,
        method: resolvedMethod,
        status: "PENDING",
        destination,
        amountUsd: amount,
        amountMxn: amountMxn != null ? asMoney(amountMxn) : null,
        fxRate: fx ? asMoney(fx.rate) : null,
        fxAt: fx?.at ?? null,
        idempotencyKey,
      },
    });

    const externalRef = payoutExternalReference(payout.id);
    await tx.payout.update({
      where: { id: payout.id },
      data: { externalRef },
    });

    const updated = await tx.wallet.update({
      where: { userId },
      data: { available: { decrement: amount } },
    });

    const note =
      resolvedMethod === "mercadopago"
        ? `Retiro solicitado a Mercado Pago (${destination}).`
        : resolvedMethod === "usdt"
          ? `Retiro solicitado en USDT TRC20 (${destination}).`
          : "Retiro solicitado. El equipo lo deposita manualmente.";

    await tx.walletLedger.create({
      data: {
        userId,
        amount: amount.negated(),
        balanceAfter: asMoney(Number(updated.available) + Number(updated.pending)),
        type: LedgerType.PAYOUT,
        payoutId: payout.id,
        note,
      },
    });

    await tx.payoutEvent.create({
      data: {
        payoutId: payout.id,
        source: "request",
        status: "PENDING",
        detail: note,
      },
    });

    return {
      payoutId: payout.id,
      amount: amountUsd,
      amountMxn,
      fxRate: fx?.rate ?? null,
      available: Number(updated.available),
      pending: Number(updated.pending),
      mode: resolvedMethod as "mercadopago" | "usdt" | "manual",
      status: "PENDING" as PayoutStatus,
      externalRef,
      idempotencyKey,
      destination,
    };
  });

  if (draft.mode === "mercadopago" && draft.destination && draft.amountMxn != null) {
    const dispatched = await dispatchMercadoPagoPayout(draft.payoutId);
    return {
      payoutId: draft.payoutId,
      amount: draft.amount,
      amountMxn: draft.amountMxn,
      fxRate: draft.fxRate,
      available: dispatched.available ?? draft.available,
      pending: draft.pending,
      mode: "mercadopago",
      status: dispatched.status,
    };
  }

  if (draft.mode === "usdt" && draft.destination && isUsdtPayoutsReady()) {
    const dispatched = await dispatchUsdtPayout(draft.payoutId);
    return {
      payoutId: draft.payoutId,
      amount: draft.amount,
      amountMxn: draft.amountMxn,
      fxRate: draft.fxRate,
      available: dispatched.available ?? draft.available,
      pending: draft.pending,
      mode: "usdt",
      status: dispatched.status,
    };
  }

  return {
    payoutId: draft.payoutId,
    amount: draft.amount,
    amountMxn: draft.amountMxn,
    fxRate: draft.fxRate,
    available: draft.available,
    pending: draft.pending,
    mode: draft.mode,
    status: draft.status,
  };
}

export async function dispatchUsdtPayout(payoutId: string): Promise<{
  status: PayoutStatus;
  available?: number;
}> {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) return { status: "FAILED" };
  if (payout.status === "COMPLETED" || payout.status === "FAILED") {
    return { status: payout.status };
  }
  if (!isUsdtPayoutsReady()) return { status: payout.status };
  if (!payout.destination || !isValidTrc20Address(payout.destination)) {
    return failPayout(payoutId, "Falta una dirección USDT TRC20 válida.", "api");
  }
  if (payout.mpPayoutId) {
    return { status: payout.status };
  }
  try {
    const created = await createUsdtPayout({
      address: payout.destination,
      amountUsd: Number(payout.amountUsd ?? payout.amount),
    });
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: "PROCESSING",
        method: "usdt",
        providerRef: created.batchId,
        mpPayoutId: created.batchId,
        mpTransactionId: created.withdrawalId,
        failureNote: created.verified ? null : "Payout creado; falta confirmar el 2FA de NOWPayments si aplica.",
      },
    });
    await prisma.payoutEvent.create({
      data: {
        payoutId: payout.id,
        source: "api",
        status: "PROCESSING",
        detail: `Enviado a NOWPayments (${created.batchId}${created.verified ? ", 2FA ok" : ", pendiente de 2FA"}).`,
      },
    });
    return { status: "PROCESSING" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el retiro USDT.";
    return failPayout(payoutId, message, "api");
  }
}

export async function applyNowPaymentsPayoutIpn(input: {
  batchId?: string | null;
  withdrawalId?: string | null;
  status?: string | null;
  hash?: string | null;
  detail?: string;
}) {
  const ref = input.batchId || input.withdrawalId;
  if (!ref) return { ignored: true as const };
  const payout = await prisma.payout.findFirst({
    where: { OR: [{ mpPayoutId: ref }, { providerRef: ref }, { mpTransactionId: input.withdrawalId ?? "" }] },
  });
  if (!payout) return { ignored: true as const, reason: "unknown_payout" };
  const status = (input.status ?? "").toUpperCase();
  if (status === "FINISHED") {
    return applyRemotePayoutStatus(payout.id, "COMPLETED", "webhook", {
      mpPayoutId: input.batchId ?? payout.mpPayoutId,
      mpTransactionId: input.withdrawalId ?? payout.mpTransactionId,
      detail: input.hash ? `txid ${input.hash}` : input.detail,
    });
  }
  if (status === "REJECTED" || status === "FAILED" || status === "REJECTED_NOT_CHECKED") {
    return applyRemotePayoutStatus(payout.id, "FAILED", "webhook", {
      detail: input.detail || `NOWPayments ${status}`,
    });
  }
  return applyRemotePayoutStatus(payout.id, "PROCESSING", "webhook", {
    detail: input.detail || status,
  });
}

export async function dispatchMercadoPagoPayout(payoutId: string): Promise<{
  status: PayoutStatus;
  available?: number;
}> {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) return { status: "FAILED" };
  if (payout.status === "COMPLETED" || payout.status === "FAILED") {
    return { status: payout.status };
  }
  if (!isMercadoPagoPayoutsReady()) {
    return { status: payout.status };
  }
  if (!payout.destination || !isValidMpPayoutEmail(payout.destination)) {
    return failPayout(payoutId, "Falta un correo Mercado Pago válido.", "api");
  }

  const amountMxn = payout.amountMxn != null ? Number(payout.amountMxn) : null;
  if (amountMxn == null || amountMxn <= 0) {
    return failPayout(payoutId, "No hay tipo de cambio para convertir el retiro a MXN.", "api");
  }

  if (payout.mpPayoutId) {
    await syncMercadoPagoPayout(payoutId, "api");
    const latest = await prisma.payout.findUnique({ where: { id: payoutId } });
    return { status: latest?.status ?? payout.status };
  }

  const externalRef = payout.externalRef ?? payoutExternalReference(payout.id);
  const idempotencyKey = payout.idempotencyKey ?? newPayoutIdempotencyKey();
  if (!payout.idempotencyKey || !payout.externalRef) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: { idempotencyKey, externalRef },
    });
  }

  try {
    const created = await createAccountPayout({
      email: payout.destination,
      amountMxn,
      externalReference: externalRef,
      idempotencyKey,
    });

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: "PROCESSING",
        method: "mercadopago",
        providerRef: created.id,
        mpPayoutId: created.id,
        mpTransactionId: created.transactionId,
        externalRef,
        idempotencyKey,
      },
    });
    await prisma.payoutEvent.create({
      data: {
        payoutId: payout.id,
        source: "api",
        status: "PROCESSING",
        detail: `Enviado a Mercado Pago (${created.id}).`,
      },
    });
    return { status: "PROCESSING" };
  } catch (error) {
    const message =
      error instanceof MercadoPagoError
        ? error.message
        : error instanceof Error
          ? error.message
          : "No se pudo enviar el retiro a Mercado Pago.";
    return failPayout(payoutId, message, "api");
  }
}

export async function syncMercadoPagoPayout(payoutId: string, source: "webhook" | "cron" | "api" | "admin" = "api") {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout?.mpPayoutId) return { status: payout?.status ?? "PENDING", ignored: true };

  const remote = await getAccountPayout(payout.mpPayoutId);
  const tx = remote.transactions[0];
  const incoming =
    (tx ? mapMpTransactionStatus(tx.status, tx.statusDetail) : "UNKNOWN") === "UNKNOWN"
      ? mapMpTransactionStatus(remote.status)
      : mapMpTransactionStatus(tx.status, tx.statusDetail);

  if (incoming === "UNKNOWN") {
    await prisma.payoutEvent.create({
      data: {
        payoutId,
        source,
        status: payout.status,
        detail: `Estado remoto no mapeado: ${remote.status}/${tx?.status ?? "?"}/${tx?.statusDetail ?? ""}`,
      },
    });
    return { status: payout.status, ignored: true };
  }

  return applyRemotePayoutStatus(payoutId, incoming, source, {
    mpPayoutId: remote.id,
    mpTransactionId: tx?.id ?? payout.mpTransactionId,
    detail: `${remote.status}${tx ? ` / ${tx.status} ${tx.statusDetail ?? ""}` : ""}`.trim(),
  });
}

export async function syncMercadoPagoPayoutByProviderId(
  mpPayoutId: string,
  source: "webhook" | "cron" | "api" | "admin" = "webhook",
) {
  const payout = await prisma.payout.findFirst({
    where: { OR: [{ mpPayoutId }, { providerRef: mpPayoutId }] },
  });
  if (!payout) return { ignored: true as const, reason: "unknown_payout" };
  return syncMercadoPagoPayout(payout.id, source);
}

export async function syncOpenMercadoPagoPayouts() {
  const open = await prisma.payout.findMany({
    where: {
      method: "mercadopago",
      status: { in: ["PENDING", "PROCESSING"] },
      mpPayoutId: { not: null },
    },
    take: 100,
    orderBy: { createdAt: "asc" },
  });

  let synced = 0;
  let failed = 0;
  for (const row of open) {
    try {
      await syncMercadoPagoPayout(row.id, "cron");
      synced += 1;
    } catch (error) {
      failed += 1;
      console.error("[payouts] sync", row.id, error);
    }
  }
  return { checked: open.length, synced, failed };
}

export async function applyRemotePayoutStatus(
  payoutId: string,
  incoming: PayoutLifecycle,
  source: string,
  extras?: { mpPayoutId?: string | null; mpTransactionId?: string | null; detail?: string },
): Promise<{ status: PayoutStatus; reversed: boolean; ignored: boolean }> {
  return prisma.$transaction(async (tx) => {
    const payout = await tx.payout.findUnique({ where: { id: payoutId } });
    if (!payout) {
      return { status: "FAILED" as PayoutStatus, reversed: false, ignored: true };
    }

    const current = payout.status as PayoutLifecycle;
    const transition = nextPayoutTransition(current, incoming);
    if (transition.ignore) {
      return { status: payout.status, reversed: false, ignored: true };
    }

    let reversed = false;
    let available: number | undefined;
    if (transition.reverseBalance) {
      const result = await reversePayoutBalance(tx, payout);
      reversed = result.reversed;
      available = result.available;
    }

    await tx.payout.update({
      where: { id: payoutId },
      data: {
        status: transition.next,
        completedAt: transition.next === "COMPLETED" ? new Date() : payout.completedAt,
        failureNote: transition.next === "FAILED" ? extras?.detail || "Retiro fallido en Mercado Pago." : payout.failureNote,
        mpPayoutId: extras?.mpPayoutId ?? payout.mpPayoutId,
        mpTransactionId: extras?.mpTransactionId ?? payout.mpTransactionId,
        providerRef: extras?.mpPayoutId ?? payout.providerRef,
      },
    });

    await tx.payoutEvent.create({
      data: {
        payoutId,
        source,
        status: transition.next,
        detail: extras?.detail ?? null,
      },
    });

    return { status: transition.next as PayoutStatus, reversed, ignored: false, available } as {
      status: PayoutStatus;
      reversed: boolean;
      ignored: boolean;
      available?: number;
    };
  });
}

async function failPayout(payoutId: string, detail: string, source: string) {
  const result = await applyRemotePayoutStatus(payoutId, "FAILED", source, { detail });
  const wallet = await prisma.wallet.findFirst({
    where: { userId: (await prisma.payout.findUnique({ where: { id: payoutId } }))?.userId ?? "" },
  });
  return { status: result.status, available: wallet ? Number(wallet.available) : undefined };
}

async function reversePayoutBalance(
  tx: Prisma.TransactionClient,
  payout: { id: string; userId: string; amount: Prisma.Decimal },
): Promise<{ reversed: boolean; available?: number }> {
  const already = await tx.walletLedger.findFirst({
    where: {
      payoutId: payout.id,
      type: LedgerType.ADJUSTMENT,
      amount: { gt: 0 },
    },
  });
  if (already) return { reversed: false };

  const wallet = await tx.wallet.findUnique({ where: { userId: payout.userId } });
  if (!wallet) return { reversed: false };

  const updated = await tx.wallet.update({
    where: { userId: payout.userId },
    data: { available: { increment: payout.amount } },
  });

  await tx.walletLedger.create({
    data: {
      userId: payout.userId,
      amount: payout.amount,
      balanceAfter: asMoney(Number(updated.available) + Number(updated.pending)),
      type: LedgerType.ADJUSTMENT,
      payoutId: payout.id,
      note: "Retiro fallido. Saldo devuelto al monedero.",
    },
  });

  return { reversed: true, available: Number(updated.available) };
}
