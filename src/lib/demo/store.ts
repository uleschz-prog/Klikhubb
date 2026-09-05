import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import bcrypt from "bcryptjs";
import { COMPENSATION_PLAN_V1 } from "@/config/compensation-plan";
import { splitSaleCommissions } from "@/lib/commerce/split";
import { fromCents, toCents } from "@/lib/money/cents";
import type { SettledOrder } from "@/lib/commerce/settle-order";
import type { LeaderboardRow } from "@/components/gamification/Leaderboard";

import { DEMO_USER_EMAILS } from "@/config/demo-fixtures";
import { PLATFORM_ADMIN, platformAdminPassword } from "@/config/platform-admin";

export const DEMO_PASSWORD = "KlikHubb2026!";

const DEMO_EMAIL_SET = new Set(DEMO_USER_EMAILS.map((email) => email.toLowerCase()));

type DemoUser = {
  id: string;
  email: string;
  hashedPassword: string;
  displayName: string;
  username: string;
  referralCode: string;
  invitedById: string | null;
  sponsorId?: string | null;
  image?: string | null;
  roles: string[];
  points: number;
};

type DemoProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  creatorId: string;
  type: "COURSE" | "MEMBERSHIP";
  status: "ACTIVE";
};

type DemoWallet = { available: number; pending: number; lifetimeEarned: number };

type DemoOrder = { id: string; buyerId: string; productId: string; total: number; createdAt: string };

type DemoCommission = {
  id: string;
  beneficiaryId: string;
  orderId: string;
  amount: number;
  type: "CREATOR_SALE" | "PLATFORM_FEE";
  status: "LOCKED" | "APPROVED";
  availableAt: string;
  productTitle: string;
};

type DemoLedger = {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: string;
  note: string | null;
  createdAt: string;
};

type DemoPayout = {
  id: string;
  userId: string;
  amount: number;
  status: "PENDING";
  method: string;
  createdAt: string;
};

type DemoDB = {
  users: DemoUser[];
  products: DemoProduct[];
  wallets: Record<string, DemoWallet>;
  enrollments: { userId: string; productId: string; orderId: string }[];
  orders: DemoOrder[];
  commissions: DemoCommission[];
  ledger: DemoLedger[];
  payouts: DemoPayout[];
};

const FILE = join(process.cwd(), "data", "klikhubb-demo.json");

let cache: DemoDB | null = null;
let seedPromise: Promise<DemoDB> | null = null;

export function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  return (
    code.startsWith("P100") ||
    code === "P1017" ||
    code === "57P01" ||
    name.includes("PrismaClientInitializationError") ||
    message.includes("Can't reach database") ||
    message.includes("Authentication failed") ||
    message.includes("terminating connection") ||
    message.includes("Connection closed")
  );
}

/** En Vercel producción no usamos el store demo in-memory como fallback. */
export function isDemoFallbackAllowed() {
  return process.env.VERCEL_ENV !== "production";
}

export function shouldUseDemoFallback(error: unknown) {
  return isDemoFallbackAllowed() && isConnectionError(error);
}

export async function loadDemo(): Promise<DemoDB> {
  if (cache) return cache;
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      cache = JSON.parse(await readFile(FILE, "utf8")) as DemoDB;
      cache = normalizeDemo(cache);
      cache = await ensureDemoAdmin(cache);
      await persist(cache);
      return cache;
    } catch {
      cache = await buildSeed();
      await persist(cache);
      return cache;
    }
  })();
  return seedPromise;
}

async function persist(db: DemoDB) {
  cache = db;
  await mkdir(join(process.cwd(), "data"), { recursive: true });
  await writeFile(FILE, JSON.stringify(db, null, 2));
}

function normalizeDemo(db: DemoDB): DemoDB {
  db.commissions ??= [];
  db.ledger ??= [];
  db.payouts ??= [];
  db.users = db.users.filter((user) => !DEMO_EMAIL_SET.has(user.email.toLowerCase()));
  db.products = [];
  db.enrollments = [];
  db.orders = [];
  db.commissions = [];
  db.ledger = [];
  db.payouts = [];
  for (const id of Object.keys(db.wallets)) {
    if (!db.users.some((user) => user.id === id)) delete db.wallets[id];
  }
  return db;
}

function pushLedger(
  db: DemoDB,
  userId: string,
  amount: number,
  type: string,
  note: string | null,
) {
  const wallet = db.wallets[userId] ?? { available: 0, pending: 0, lifetimeEarned: 0 };
  db.wallets[userId] = wallet;
  db.ledger.push({
    id: `ldg_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    amount,
    balanceAfter: wallet.available + wallet.pending,
    type,
    note,
    createdAt: new Date().toISOString(),
  });
}

async function ensureDemoAdmin(db: DemoDB): Promise<DemoDB> {
  const adminHash = await bcrypt.hash(platformAdminPassword(), 12);
  const existing = db.users.find(
    (user) =>
      user.username.toLowerCase() === PLATFORM_ADMIN.username.toLowerCase() ||
      user.email.toLowerCase() === PLATFORM_ADMIN.email,
  );
  let adminId = existing?.id;
  if (existing) {
    existing.hashedPassword = adminHash;
    existing.username = PLATFORM_ADMIN.username;
    existing.email = PLATFORM_ADMIN.email;
    existing.displayName = PLATFORM_ADMIN.displayName;
    existing.referralCode = PLATFORM_ADMIN.referralCode;
    existing.roles = Array.from(new Set([...existing.roles, "ADMIN", "CREATOR"]));
    existing.invitedById = null;
  } else {
    adminId = "usr_qlykadmin";
    db.users.unshift(
      u(
        adminId,
        PLATFORM_ADMIN.email,
        adminHash,
        PLATFORM_ADMIN.displayName,
        PLATFORM_ADMIN.username,
        PLATFORM_ADMIN.referralCode,
        null,
        ["ADMIN", "CREATOR"],
        0,
      ),
    );
    db.wallets[adminId] = { available: 0, pending: 0, lifetimeEarned: 0 };
  }

  // Sin árbol de referidos: no se fuerza invitador por defecto.
  return db;
}

async function buildSeed(): Promise<DemoDB> {
  const adminHash = await bcrypt.hash(platformAdminPassword(), 12);
  const adminId = "usr_qlykadmin";
  const users: DemoUser[] = [
    u(
      adminId,
      PLATFORM_ADMIN.email,
      adminHash,
      PLATFORM_ADMIN.displayName,
      PLATFORM_ADMIN.username,
      PLATFORM_ADMIN.referralCode,
      null,
      ["ADMIN", "CREATOR"],
      0,
    ),
  ];

  return {
    users,
    products: [],
    wallets: { [adminId]: { available: 0, pending: 0, lifetimeEarned: 0 } },
    enrollments: [],
    orders: [],
    commissions: [],
    ledger: [],
    payouts: [],
  };
}

function u(
  id: string,
  email: string,
  hashedPassword: string,
  displayName: string,
  username: string,
  referralCode: string,
  invitedById: string | null,
  roles: string[],
  points: number,
): DemoUser {
  return {
    id,
    email,
    hashedPassword,
    displayName,
    username,
    referralCode,
    invitedById,
    roles,
    points,
  };
}

export function demoPlatformUserId(db: DemoDB) {
  return (
    db.users.find(
      (user) =>
        user.username.toLowerCase() === PLATFORM_ADMIN.username.toLowerCase() ||
        user.email.toLowerCase() === PLATFORM_ADMIN.email,
    )?.id ?? db.users[0]?.id ?? "usr_qlykadmin"
  );
}

export async function demoFindUserByEmail(email: string) {
  return demoFindUserByLogin(email);
}

export async function demoFindUserByLogin(identifier: string) {
  const db = await loadDemo();
  const needle = identifier.trim().toLowerCase();
  return (
    db.users.find(
      (user) => user.email.toLowerCase() === needle || user.username.toLowerCase() === needle,
    ) ?? null
  );
}

export async function demoFindUserById(id: string) {
  const db = await loadDemo();
  return db.users.find((user) => user.id === id) ?? null;
}

export async function demoFindProductBySlug(slug: string) {
  const db = await loadDemo();
  return db.products.find((product) => product.slug === slug) ?? null;
}

export async function demoHasEnrollment(userId: string, productId: string) {
  const db = await loadDemo();
  return db.enrollments.some((row) => row.userId === userId && row.productId === productId);
}

export async function demoEnrollmentOrderId(userId: string, productId: string) {
  const db = await loadDemo();
  return db.enrollments.find((row) => row.userId === userId && row.productId === productId)?.orderId ?? null;
}

export async function demoListProducts() {
  const db = await loadDemo();
  return db.products;
}

export async function demoListEnrollments(userId: string) {
  const db = await loadDemo();
  return db.enrollments
    .filter((row) => row.userId === userId)
    .map((row) => {
      const product = db.products.find((item) => item.id === row.productId);
      return {
        slug: product?.slug ?? row.productId,
        title: product?.title ?? "Producto",
        description: null,
        type: product?.type ?? "COURSE",
        enrolledAt: db.orders.find((order) => order.id === row.orderId)?.createdAt ?? new Date().toISOString(),
        role: "student" as const,
        lessonCount: 0,
        progressPct: 0,
      };
    });
}

export async function demoRegister(input: {
  email: string;
  username: string;
  password: string;
  displayName: string;
  locale?: string;
  timezone?: string;
}) {
  const db = await loadDemo();
  const email = input.email.toLowerCase();
  const username = input.username.toLowerCase();
  if (db.users.some((user) => user.email === email)) {
    throw new Error("EMAIL_TAKEN");
  }
  if (db.users.some((user) => user.username.toLowerCase() === username)) {
    throw new Error("USERNAME_TAKEN");
  }

  const id = `usr_${Math.random().toString(36).slice(2, 10)}`;
  const roles = ["CREATOR", "STUDENT"];
  const displayName =
    input.displayName?.trim() ||
    username.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  const user: DemoUser = {
    id,
    email,
    hashedPassword: await bcrypt.hash(input.password, 12),
    displayName,
    username,
    referralCode: id.slice(-8).toUpperCase(),
    invitedById: null,
    roles,
    points: 0,
  };
  db.users.push(user);
  db.wallets[id] = { available: 0, pending: 0, lifetimeEarned: 0 };
  await persist(db);
  return user;
}

export async function demoSettleOrder(input: { buyerId: string; slug: string }): Promise<SettledOrder> {
  const db = await loadDemo();
  const product = db.products.find((row) => row.slug === input.slug);
  if (!product || product.status !== "ACTIVE") {
    throw new Error("PRODUCT_UNAVAILABLE");
  }
  if (product.creatorId === input.buyerId) {
    throw new Error("SELF_PURCHASE");
  }
  if (db.enrollments.some((row) => row.userId === input.buyerId && row.productId === product.id)) {
    throw new Error("ALREADY_OWNED");
  }

  const platformUserId = demoPlatformUserId(db);
  const buyer = db.users.find((row) => row.id === input.buyerId);

  const lines = splitSaleCommissions({
    saleAmount: product.price,
    creatorId: product.creatorId,
  });

  const orderId = `ord_${Math.random().toString(36).slice(2, 10)}`;
  db.orders.push({
    id: orderId,
    buyerId: input.buyerId,
    productId: product.id,
    total: product.price,
    createdAt: new Date().toISOString(),
  });
  db.enrollments.push({ userId: input.buyerId, productId: product.id, orderId });

  for (const line of lines) {
    if (line.amountCents <= 0) continue;
    const beneficiaryId = line.type === "PLATFORM_FEE" ? platformUserId : line.beneficiaryId;
    const wallet = db.wallets[beneficiaryId] ?? { available: 0, pending: 0, lifetimeEarned: 0 };
    db.wallets[beneficiaryId] = wallet;
    const amount = line.amountCents / 100;
    wallet.lifetimeEarned += amount;
    if (line.type === "PLATFORM_FEE") {
      wallet.available += amount;
      pushLedger(db, beneficiaryId, amount, "FEE", "Fee de plataforma Qlyk");
    } else {
      wallet.pending += amount;
      const availableAt = new Date(
        Date.now() + COMPENSATION_PLAN_V1.holdDays * 86_400_000,
      ).toISOString();
      db.commissions.push({
        id: `com_${Math.random().toString(36).slice(2, 10)}`,
        beneficiaryId,
        orderId,
        amount,
        type: line.type,
        status: "LOCKED",
        availableAt,
        productTitle: product.title,
      });
      pushLedger(
        db,
        beneficiaryId,
        amount,
        "SALE",
        "Venta de tu producto",
      );
    }
    db.wallets[beneficiaryId] = wallet;
  }

  if (buyer) {
    buyer.points += Math.max(10, Math.round(product.price / 10));
  }

  await persist(db);
  return {
    orderId,
    productTitle: product.title,
    total: product.price,
    currency: product.currency,
    lines: lines.map((line) => ({
      type: line.type,
      level: line.level,
      amountCents: line.amountCents,
      beneficiaryId: line.beneficiaryId,
    })),
  };
}

export async function demoUpdateAvatar(userId: string, imageUrl: string | null) {
  const db = await loadDemo();
  const user = db.users.find((row) => row.id === userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  user.image = imageUrl;
  await persist(db);
  return user;
}

export async function demoHub(userId: string) {
  await demoReleaseMature(userId);
  const db = await loadDemo();
  const user = db.users.find((row) => row.id === userId);
  const wallet = db.wallets[userId] ?? { available: 0, pending: 0, lifetimeEarned: 0 };
  const leaderboard: LeaderboardRow[] = [...db.users]
    .sort((a, b) => b.points - a.points)
    .slice(0, 5)
    .map((row, index) => ({
      rank: index + 1,
      name: row.displayName,
      handle: row.username,
      points: row.points,
      earnings: Math.round(db.wallets[row.id]?.lifetimeEarned ?? 0),
    }));

  return {
    displayName: user?.displayName ?? "Miembro",
    image: user?.image ?? null,
    username: user?.username ?? null,
    points: user?.points ?? 0,
    wallet,
    leaderboard,
    demo: true as const,
  };
}

const DEMO_MIN_PAYOUT_CENTS = 1_000;

export async function demoReleaseMature(userId?: string): Promise<{ released: number; amount: number }> {
  const db = await loadDemo();
  const now = Date.now();
  let released = 0;
  let amount = 0;
  let dirty = false;

  for (const row of db.commissions) {
    if (row.status !== "LOCKED") continue;
    if (userId && row.beneficiaryId !== userId) continue;
    if (new Date(row.availableAt).getTime() > now) continue;

    const wallet = db.wallets[row.beneficiaryId] ?? { available: 0, pending: 0, lifetimeEarned: 0 };
    const move = Math.min(wallet.pending, row.amount);
    row.status = "APPROVED";
    dirty = true;
    if (move <= 0) continue;
    wallet.pending -= move;
    wallet.available += move;
    db.wallets[row.beneficiaryId] = wallet;
    pushLedger(db, row.beneficiaryId, move, "ADJUSTMENT", `Hold de ${COMPENSATION_PLAN_V1.holdDays} días terminado`);
    released += 1;
    amount += move;
  }

  const ids = userId
    ? [userId]
    : Object.keys(db.wallets).filter((id) => (db.wallets[id]?.pending ?? 0) > 0);

  for (const id of ids) {
    const wallet = db.wallets[id];
    if (!wallet) continue;
    const locked = db.commissions
      .filter((row) => row.beneficiaryId === id && row.status === "LOCKED")
      .reduce((sum, row) => sum + row.amount, 0);
    const excess = wallet.pending - locked;
    if (excess <= 0.0001) continue;
    wallet.pending -= excess;
    wallet.available += excess;
    pushLedger(db, id, excess, "ADJUSTMENT", "Saldo sin hold (fee u origen directo)");
    amount += excess;
    dirty = true;
  }

  if (dirty) await persist(db);
  return { released, amount };
}

export async function demoLoadWalletView(userId: string) {
  await demoReleaseMature(userId);
  const db = await loadDemo();
  const wallet = db.wallets[userId] ?? { available: 0, pending: 0, lifetimeEarned: 0 };
  const holds = db.commissions
    .filter((row) => row.beneficiaryId === userId && row.status === "LOCKED")
    .sort((a, b) => a.availableAt.localeCompare(b.availableAt))
    .slice(0, 40)
    .map((row) => ({
      id: row.id,
      amount: row.amount,
      availableAt: row.availableAt,
      kind: (row.type === "CREATOR_SALE" ? "sale" : "hold") as "sale" | "hold",
      productTitle: row.productTitle,
    }));

  return {
    available: wallet.available,
    pending: wallet.pending,
    lifetimeEarned: wallet.lifetimeEarned,
    currency: "USD",
    holdDays: COMPENSATION_PLAN_V1.holdDays,
    minPayout: fromCents(DEMO_MIN_PAYOUT_CENTS),
    nextReleaseAt: holds[0]?.availableAt ?? null,
    holds,
    ledger: db.ledger
      .filter((row) => row.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 40)
      .map((row) => ({
        id: row.id,
        amount: row.amount,
        balanceAfter: row.balanceAfter,
        type: row.type,
        note: row.note,
        createdAt: row.createdAt,
      })),
    payouts: db.payouts
      .filter((row) => row.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
      .map((row) => ({
        id: row.id,
        amount: row.amount,
        status: row.status,
        method: row.method,
        createdAt: row.createdAt,
      })),
    demo: true as const,
  };
}

export async function demoRequestPayout(userId: string, requestedAmount?: number) {
  await demoReleaseMature(userId);
  const db = await loadDemo();
  const wallet = db.wallets[userId];
  if (!wallet) {
    throw Object.assign(new Error("Aún no tienes monedero. Primero vende o invita."), {
      code: "USER_NOT_FOUND" as const,
    });
  }

  const availableCents = toCents(wallet.available);
  if (availableCents < DEMO_MIN_PAYOUT_CENTS) {
    const error = new Error(
      `Necesitas al menos ${fromCents(DEMO_MIN_PAYOUT_CENTS).toFixed(2)} USD disponibles para retirar.`,
    );
    error.name = "WalletError";
    (error as Error & { code: string }).code = "MINIMUM";
    throw Object.assign(error, { code: "MINIMUM" as const });
  }

  const requestCents = requestedAmount == null ? availableCents : toCents(requestedAmount);
  if (requestCents < DEMO_MIN_PAYOUT_CENTS) {
    throw Object.assign(new Error(`El retiro mínimo es ${fromCents(DEMO_MIN_PAYOUT_CENTS).toFixed(2)} USD.`), {
      code: "MINIMUM" as const,
    });
  }
  if (requestCents > availableCents) {
    throw Object.assign(new Error("No tienes ese saldo disponible."), { code: "INSUFFICIENT" as const });
  }

  const amount = fromCents(requestCents);
  wallet.available -= amount;
  const payoutId = `pay_${Math.random().toString(36).slice(2, 10)}`;
  db.payouts.push({
    id: payoutId,
    userId,
    amount,
    status: "PENDING",
    method: "manual",
    createdAt: new Date().toISOString(),
  });
  pushLedger(
    db,
    userId,
    -amount,
    "PAYOUT",
    "Retiro solicitado. El equipo lo deposita manualmente.",
  );
  await persist(db);
  return {
    payoutId,
    amount,
    available: wallet.available,
    pending: wallet.pending,
  };
}
