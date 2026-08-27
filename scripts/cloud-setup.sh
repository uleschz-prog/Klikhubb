#!/usr/bin/env bash
# Idempotent Cloud Agent install phase for Qlyk (KlikHubb).
# Installs PostgreSQL, prepares the klikhubb database, installs Node deps,
# and applies Prisma migrations + seed. Safe to run repeatedly.
set -euo pipefail

cd "$(dirname "$0")/.."

DB_USER="klikhubb"
DB_PASS="klikhubb"
DB_NAME="klikhubb"

echo "==> Ensuring PostgreSQL is installed"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
fi

echo "==> Ensuring PostgreSQL cluster is running"
sudo pg_ctlcluster 16 main start 2>/dev/null || true
# Wait for the server to accept connections.
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

echo "==> Ensuring database role and database exist"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}' CREATEDB;
SQL
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

echo "==> Ensuring .env exists"
if [ ! -f .env ]; then
  cp .env.example .env
  SECRET="$(openssl rand -base64 32)"
  # Replace the placeholder secret with a generated one.
  if grep -q 'replace-with-openssl-rand-base64-32' .env; then
    ESCAPED=$(printf '%s' "$SECRET" | sed -e 's/[\/&]/\\&/g')
    sed -i "s/replace-with-openssl-rand-base64-32/${ESCAPED}/" .env
  fi
fi

echo "==> Installing Node dependencies"
npm ci

echo "==> Applying Prisma migrations"
npm run db:deploy

echo "==> Seeding database"
npm run db:seed

echo "==> Cloud setup complete"
