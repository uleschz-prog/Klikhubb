-- Qlyk Academy: créditos de IA, notebooks, agentes y artefactos.
-- ProductBilling.MONTHLY y product_subscriptions ya existen (20260831100000).

DO $$ BEGIN
  CREATE TYPE "AcademyCreditReason" AS ENUM ('GRANT', 'SPEND', 'REFUND', 'ADJUSTMENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AcademyArtifactKind" AS ENUM ('IMAGE', 'VIDEO', 'NOTEBOOK', 'AGENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "academy_credit_ledger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" "AcademyCreditReason" NOT NULL,
    "note" VARCHAR(240),
    "refType" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "academy_credit_ledger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "academy_credit_ledger_userId_createdAt_idx"
  ON "academy_credit_ledger"("userId", "createdAt" DESC);

ALTER TABLE "academy_credit_ledger"
  DROP CONSTRAINT IF EXISTS "academy_credit_ledger_userId_fkey";
ALTER TABLE "academy_credit_ledger"
  ADD CONSTRAINT "academy_credit_ledger_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "academy_artifacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AcademyArtifactKind" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "prompt" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "creditCost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "academy_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "academy_artifacts_userId_kind_createdAt_idx"
  ON "academy_artifacts"("userId", "kind", "createdAt" DESC);

ALTER TABLE "academy_artifacts"
  DROP CONSTRAINT IF EXISTS "academy_artifacts_userId_fkey";
ALTER TABLE "academy_artifacts"
  ADD CONSTRAINT "academy_artifacts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "academy_notebooks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "academy_notebooks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "academy_notebooks_userId_updatedAt_idx"
  ON "academy_notebooks"("userId", "updatedAt" DESC);

ALTER TABLE "academy_notebooks"
  DROP CONSTRAINT IF EXISTS "academy_notebooks_userId_fkey";
ALTER TABLE "academy_notebooks"
  ADD CONSTRAINT "academy_notebooks_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "academy_notebook_sources" (
    "id" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "academy_notebook_sources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "academy_notebook_sources_notebookId_idx"
  ON "academy_notebook_sources"("notebookId");

ALTER TABLE "academy_notebook_sources"
  DROP CONSTRAINT IF EXISTS "academy_notebook_sources_notebookId_fkey";
ALTER TABLE "academy_notebook_sources"
  ADD CONSTRAINT "academy_notebook_sources_notebookId_fkey"
  FOREIGN KEY ("notebookId") REFERENCES "academy_notebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "academy_notebook_turns" (
    "id" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "academy_notebook_turns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "academy_notebook_turns_notebookId_createdAt_idx"
  ON "academy_notebook_turns"("notebookId", "createdAt");

ALTER TABLE "academy_notebook_turns"
  DROP CONSTRAINT IF EXISTS "academy_notebook_turns_notebookId_fkey";
ALTER TABLE "academy_notebook_turns"
  ADD CONSTRAINT "academy_notebook_turns_notebookId_fkey"
  FOREIGN KEY ("notebookId") REFERENCES "academy_notebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "academy_agent_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DONE',
    "creditCost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "academy_agent_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "academy_agent_runs_userId_createdAt_idx"
  ON "academy_agent_runs"("userId", "createdAt" DESC);

ALTER TABLE "academy_agent_runs"
  DROP CONSTRAINT IF EXISTS "academy_agent_runs_userId_fkey";
ALTER TABLE "academy_agent_runs"
  ADD CONSTRAINT "academy_agent_runs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
