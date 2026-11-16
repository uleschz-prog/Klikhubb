# Qlyk

El centro donde todo sucede con un solo clic. Red social con video, cursos y comunidad.

Producción: **https://qlyk.vercel.app**

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma 5 + PostgreSQL
- NextAuth (JWT + Credentials, Google opcional)
- Vercel Blob, Resend, PWA

## Arranque local

```bash
cp .env.example .env
docker compose up -d
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

La landing queda en `http://localhost:3000`.

En desarrollo, `NEXTAUTH_SECRET` y `PLATFORM_ADMIN_PASSWORD` tienen fallbacks explícitos (`NODE_ENV=development`). En producción hay que definirlos; si faltan, la app falla con un error claro. El cron de liberación de monederos exige `CRON_SECRET` (`Authorization: Bearer $CRON_SECRET`).

## Modelo de dinero

Cada venta se reparte **después** de descontar, si aplica, la comisión del procesador de pagos sobre el importe bruto:

- Plan «pago cuando vendo» (PAYG): **93% creador / 7% plataforma** (Qlykadmin).
- Plan mensual (FLAT, 25 USD / 30 días): **100% al creador** mientras el periodo esté activo.

No hay comisión por invitación. El saldo del creador queda en hold **24 horas** (misma ventana de reembolso del comprador) y después pasa a disponible. El retiro lo deposita el equipo a mano desde `/admin/payouts` (mínimo 10 USD).

El cobro principal es **Mercado Pago Checkout Pro** (tarjeta, SPEI u OXXO, en MXN). Qlyk cobra en una cuenta central y paga a los creadores después. El SPEI manual con comprobante queda como respaldo. Las tarifas de Mercado Pago se descuentan del bruto antes del 93/7.

## Tests

```bash
npm test
```

Vitest cubre el reparto (incluido el descuento de tarifa del procesador) y la autenticación del cron.
