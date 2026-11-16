-- Importes duales USD/MXN y tipo de cambio al asentar una venta (Mercado Pago cobra en MXN).
-- Additive only: columnas nuevas, nullable, no se tocan datos existentes.

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "amountUsd" DECIMAL(19,4);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "amountMxn" DECIMAL(19,4);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fxRate" DECIMAL(19,8);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fxAt" TIMESTAMP(3);
