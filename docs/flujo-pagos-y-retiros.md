# Cómo llega el dinero a cada parte (Qlyk)

Este documento explica qué pasa cuando alguien compra un curso, quién cobra qué, y cómo confirmar pagos y retiros manualmente.

## Resumen en una frase

**Hoy:** el comprador paga con **Mercado Pago Checkout Pro** (tarjeta, SPEI u OXXO, en MXN) o, como respaldo, por **SPEI manual**. Qlyk cobra en una cuenta central, asienta la venta (descontando la tarifa de MP del bruto antes del 93/7), el creador ve su parte en el monedero y **a las 24 horas** puede pedir un retiro que **Qlykadmin** deposita a mano.

Las comisiones de un procesador de pagos, cuando exista uno, se descuentan del **importe bruto antes** del reparto 93/7 (o del 100% del plan mensual). El SPEI manual no aplica tarifa de procesador.

---

## Paso a paso: una venta de $100 USD

### 1. El comprador paga (SPEI)

- Botón **Transferir por SPEI** → datos bancarios + referencia `QLYK-XXXXXX`.
- El comprador transfiere el monto exacto y sube comprobante (PDF/imagen).
- El pago queda en `manual_payment_requests` con estado `PROOF_SUBMITTED`.

### 2. Qlykadmin confirma

- Panel `/admin/payments` → **Aprobar pago**.
- Se ejecuta `settlePaidOrder()` con `provider: manual`.

### 3. La app reparte la venta (contabilidad interna)

Si no hay comisión de procesador:

| Parte | Porcentaje | Ejemplo $100 | Dónde queda |
|-------|-----------|--------------|-------------|
| **Creador del curso** | 93% | $93 | Monedero `pending` (24 horas) |
| **Plataforma (Qlyk)** | 7% | $7 | Monedero `available` de inmediato |

Si el creador tiene el plan mensual de $25, se queda el 100% mientras el periodo esté activo.

Si en el futuro un procesador cobra, por ejemplo, $4 de comisión sobre $100, el neto a repartir es $96: 93/7 (o 100% FLAT) se aplica sobre esos $96, no sobre el bruto.

Reglas en `src/lib/commerce/split.ts` y `src/config/compensation-plan.ts`.

### 4. Hold de 24 horas

- Las comisiones del creador quedan en estado `LOCKED`.
- A las 24 horas (la misma ventana de reembolso), al abrir el monedero o con el cron (`/api/cron/release-wallets`) pasan a `APPROVED` y el saldo va de **pendiente → disponible**.
- El cron exige `Authorization: Bearer $CRON_SECRET`. En Vercel, define `CRON_SECRET` y la plataforma envía el header sola.

El comprador tiene **24 horas** desde el pago confirmado para pedir la devolución en `/orders`. Se revoca el acceso y, si pagó por SPEI, el operador transfiere de vuelta.

### 5. Retiro

- El creador pide retiro en `/wallet` (mínimo 10 USD).
- El retiro queda `manual` / `PENDING` y **Qlykadmin** lo marca pagado en `/admin/payouts`.

---

## Variables en Vercel (producción)

Webhook de Mercado Pago: `https://qlyk.vercel.app/api/webhooks/mercadopago`

```env
MP_ACCESS_TOKEN="..."
MP_PUBLIC_KEY="..."
MP_WEBHOOK_SECRET="..."
FX_USD_MXN="18.50"
PAYMENT_BANK_NAME="BBVA"
PAYMENT_BENEFICIARY="…"
PAYMENT_CLABE="…"
PAYMENT_ACCOUNT_NUMBER="…"
BLOB_READ_WRITE_TOKEN="..."
PLATFORM_ADMIN_PASSWORD="..."
NEXTAUTH_SECRET="..."
CRON_SECRET="..."
```

Basta con tener SPEI configurado para cobrar en producción. Checklist: `/admin/setup`.

---

## Entorno local

Sin datos bancarios, el checkout usa `provider: demo` y abre acceso al instante (solo desarrollo).
