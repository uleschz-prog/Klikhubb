-- AlterTable
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "resourceUrl" TEXT;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "resourceName" TEXT;
