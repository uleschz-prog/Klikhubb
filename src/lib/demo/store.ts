import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import bcrypt from "bcryptjs";
import { splitSaleCommissions } from "@/lib/commerce/split";
import type { SettledOrder } from "@/lib/commerce/settle-order";
import type { LeaderboardRow } from "@/components/gamification/Leaderboard";

export const DEMO_PASSWORD = "KlikHubb2026!";

type DemoUser = {
  id: string;
  email: string;
  hashedPassword: string;
  displayName: string;
  username: string;
  referralCode: string;
  invitedById: string | null;
  sponsorId?: string | null;
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

type DemoDB = {
  users: DemoUser[];
  products: DemoProduct[];
  wallets: Record<string, DemoWallet>;
  enrollments: { userId: string; productId: string; orderId: string }[];
  orders: DemoOrder[];
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
    name.includes("PrismaClientInitializationError") ||
    message.includes("Can't reach database") ||
    message.includes("Authentication failed")
  );
}

export async function loadDemo(): Promise<DemoDB> {
  if (cache) return cache;
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      cache = JSON.parse(await readFile(FILE, "utf8")) as DemoDB;
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

async function buildSeed(): Promise<DemoDB> {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users: DemoUser[] = [
    u("usr_platform", "platform@klikhubb.internal", hash, "KlikHubb", "platform", "PLATFORM", null, ["ADMIN"], 0),
    u("usr_maya", "maya@klikhubb.dev", hash, "Maya Chen", "mayaclose", "MAYA", "usr_platform", ["CREATOR", "AFFILIATE"], 18420),
    u("usr_leo", "leo@klikhubb.dev", hash, "Leo Vargas", "leov", "LEO", "usr_maya", ["AFFILIATE", "STUDENT"], 15110),
    u("usr_amina", "amina@klikhubb.dev", hash, "Amina Rahim", "amina", "AMINA", "usr_leo", ["AFFILIATE", "STUDENT"], 12990),
    u("usr_rafa", "rafa@klikhubb.dev", hash, "Rafa Díaz", "rafa", "RAFA", "usr_amina", ["STUDENT"], 200),
  ];

  return {
    users,
    products: [
      {
        id: "prod_cierre",
        slug: "cierre-elite",
        title: "Academia Cierre Élite",
        price: 497,
        currency: "USD",
        creatorId: "usr_maya",
        type: "COURSE",
        status: "ACTIVE",
      },
      {
        id: "prod_inner",
        slug: "inner-circle",
        title: "Inner Circle",
        price: 49,
        currency: "USD",
        creatorId: "usr_maya",
        type: "MEMBERSHIP",
        status: "ACTIVE",
      },
      {
        id: "prod_binaria",
        slug: "red-binaria",
        title: "De view a cliente",
        price: 197,
        currency: "USD",
        creatorId: "usr_maya",
        type: "COURSE",
        status: "ACTIVE",
      },
    ],
    wallets: Object.fromEntries(users.map((user) => [user.id, { available: 0, pending: 0, lifetimeEarned: 0 }])),
    enrollments: [],
    orders: [],
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

export function demoInviterId(db: DemoDB, userId: string) {
  const user = db.users.find((row) => row.id === userId);
  return user?.invitedById ?? user?.sponsorId ?? null;
}

export async function demoFindUserByEmail(email: string) {
  const db = await loadDemo();
  return db.users.find((user) => user.email === email.toLowerCase()) ?? null;
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

export async function demoRegister(input: {
  email: string;
  password: string;
  displayName: string;
  intent: "CREATOR" | "ENTREPRENEUR" | "BOTH";
  referralCode?: string;
}) {
  const db = await loadDemo();
  const email = input.email.toLowerCase();
  if (db.users.some((user) => user.email === email)) {
    throw new Error("EMAIL_TAKEN");
  }
  const code = input.referralCode?.trim().toUpperCase();
  const inviter = code ? db.users.find((user) => user.referralCode === code) : undefined;
  if (code && !inviter) throw new Error("INVALID_REFERRAL");

  const id = `usr_${Math.random().toString(36).slice(2, 10)}`;
  const roles =
    input.intent === "CREATOR"
      ? ["CREATOR", "STUDENT"]
      : input.intent === "ENTREPRENEUR"
        ? ["STUDENT"]
        : ["CREATOR", "STUDENT"];
  const username = email.split("@")[0]?.replace(/[^a-z0-9]/gi, "").slice(0, 16) || "klik";
  const user: DemoUser = {
    id,
    email,
    hashedPassword: await bcrypt.hash(input.password, 12),
    displayName: input.displayName,
    username,
    referralCode: id.slice(-8).toUpperCase(),
    invitedById: inviter?.id ?? null,
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

  const lines = splitSaleCommissions({
    saleAmount: product.price,
    creatorId: product.creatorId,
    inviterId: demoInviterId(db, input.buyerId),
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
    const beneficiaryId = line.type === "PLATFORM_FEE" ? "usr_platform" : line.beneficiaryId;
    const wallet = db.wallets[beneficiaryId] ?? { available: 0, pending: 0, lifetimeEarned: 0 };
    const amount = line.amountCents / 100;
    wallet.pending += amount;
    wallet.lifetimeEarned += amount;
    db.wallets[beneficiaryId] = wallet;
  }

  const buyer = db.users.find((user) => user.id === input.buyerId);
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

export async function demoHub(userId: string) {
  const db = await loadDemo();
  const user = db.users.find((row) => row.id === userId);
  const wallet = db.wallets[userId] ?? { available: 0, pending: 0, lifetimeEarned: 0 };
  const invitedCount = db.users.filter(
    (row) => (row.invitedById ?? row.sponsorId) === userId,
  ).length;
  const leaderboard: LeaderboardRow[] = [...db.users]
    .filter((row) => row.id !== "usr_platform")
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
    referralCode: user?.referralCode ?? "",
    invitedCount,
    points: user?.points ?? 0,
    wallet,
    leaderboard,
    demo: true as const,
  };
}
