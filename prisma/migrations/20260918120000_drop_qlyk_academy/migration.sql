-- Qlyk Academy se separa de esta plataforma: se retiran tablas de IA
-- y se archiva el producto de membresía.

DROP TABLE IF EXISTS "academy_notebook_turns";
DROP TABLE IF EXISTS "academy_notebook_sources";
DROP TABLE IF EXISTS "academy_notebooks";
DROP TABLE IF EXISTS "academy_agent_runs";
DROP TABLE IF EXISTS "academy_artifacts";
DROP TABLE IF EXISTS "academy_credit_ledger";

DROP TYPE IF EXISTS "AcademyCreditReason";
DROP TYPE IF EXISTS "AcademyArtifactKind";

UPDATE "products" SET "status" = 'ARCHIVED' WHERE "slug" = 'qlyk-academy';
