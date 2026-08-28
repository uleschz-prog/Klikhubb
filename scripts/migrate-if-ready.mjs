import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
const hosted =
  Boolean(url) &&
  !url.includes("localhost") &&
  !url.includes("127.0.0.1");

if (!hosted) {
  console.log("Skipping prisma migrate deploy (no hosted DATABASE_URL).");
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}

const webhook = spawnSync("node", ["scripts/ensure-stripe-webhook.mjs"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(webhook.status ?? 0);
