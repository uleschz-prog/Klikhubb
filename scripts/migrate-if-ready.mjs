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

process.exit(result.status ?? 1);
