# Cómo llega el dinero a cada parte (Qlyk)

Este documento explica qué pasa cuando alguien compra un curso, quién cobra qué, y cómo confirmar pagos y retiros manualmente.

## Resumen en una frase

**Hoy:** el comprador elige **tarjeta (Stripe)** o **SPEI**. Con Stripe, el webhook (o la página de éxito) asienta la venta. Con SPEI, sube comprobante → **Qlykadmin confirma** → la app reparte **en la base de datos** → después de 14 días el creador puede **pedir retiro manual**.

---

## Paso a paso: una venta de $100 USD

### 1. El comprador paga

Hay dos métodos en checkout:

**Tarjeta (Stripe)**

- Botón **Pagar con tarjeta** → Stripe Checkout (`mode: payment`).
- Al confirmar, Stripe llama `/api/webhooks/stripe` y/o el comprador vuelve a `/checkout/success?session_id=…`.
- Se ejecuta `settlePaidOrder()` con `provider: stripe`.

**SPEI**

- Botón **Transferir por SPEI** → datos bancarios + referencia `QLYK-XXXXXX`.
- El comprador transfiere el monto exacto y sube comprobante (PDF/imagen).
- El pago queda en `manual_payment_requests` con estado `PROOF_SUBMITTED`.

### 2. Qlykadmin confirma

- Panel `/admin/payments` → **Aprobar pago**.
- Se ejecuta `settlePaidOrder()` con `provider: manual`.

### 3. La app reparte la venta (contabilidad interna)

| Parte | Porcentaje | Ejemplo $100 | Dónde queda |
|-------|-----------|--------------|-------------|
| **Creador del curso** | 85% | $85 | Monedero `pending` (14 días) |
| **Quien invitó al comprador** | 5% | $5 | Monedero `pending` (14 días) |
| **Plataforma (Qlykadmin)** | 10% | $10 | Monedero `available` de inmediato |

**Si nadie invitó al comprador:** el 5% se suma al creador → **90% creador + 10% plataforma**.

Reglas en `src/lib/commerce/split.ts` y `src/config/compensation-plan.ts`.

### 4. Hold de 14 días

- Las comisiones del creador y referidor quedan en estado `LOCKED`.
- Tras 14 días, un cron (`/api/cron/release-wallets`) las pasa a `APPROVED` y mueve el saldo de **pendiente → disponible** en el monedero.

Motivo: margen para reembolsos antes de liberar retiro.

El comprador tiene **24 horas** desde el pago confirmado para pedir la devolución en `/orders`. Se revoca el acceso y, con tarjeta, Stripe reembolsa el cargo.

### 5. Retiro

- El creador vincula su cuenta de Stripe (Express) en `/wallet`.
- Pide retiro (mínimo 10 USD). Si Connect está listo, Qlyk hace un `transfer` al Stripe del creador y Stripe le deposita al banco.
- Si Stripe no está configurado, el retiro queda `manual` y **Qlykadmin** lo marca pagado en `/admin/payouts`.

---

## Variables en Vercel (producción)

```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PAYMENT_BANK_NAME="BBVA"
PAYMENT_BENEFICIARY="Qlyk SA de CV"
PAYMENT_CLABE="012345678901234567"
PAYMENT_ACCOUNT_NUMBER="0123456789"
BLOB_READ_WRITE_TOKEN="..."
PLATFORM_ADMIN_PASSWORD="..."
```

Webhook Stripe: `https://qlyk.vercel.app/api/webhooks/stripe` (eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `account.updated` y `charge.refunded`).

En Stripe Dashboard activa **Connect**. Los creadores vinculan su cuenta en `/wallet`. País por defecto: `STRIPE_CONNECT_COUNTRY=MX`. Para apagar Connect: `STRIPE_CONNECT_ENABLED=false`.

Basta con **un** método activo (Stripe completo o SPEI). Pueden convivir los dos.

Checklist: `/admin/setup`

---

## Entorno local

Sin Stripe ni datos bancarios, el checkout usa `provider: demo` y abre acceso al instante (solo desarrollo).
