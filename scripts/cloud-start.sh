#!/usr/bin/env bash
# Per-boot Cloud Agent start phase for Qlyk (KlikHubb).
# Ensures PostgreSQL is running and migrations are applied. Idempotent.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Starting PostgreSQL cluster"
sudo pg_ctlcluster 16 main start 2>/dev/null || true
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

echo "==> Applying any pending Prisma migrations"
npm run db:deploy || true

echo "==> Start phase complete"
