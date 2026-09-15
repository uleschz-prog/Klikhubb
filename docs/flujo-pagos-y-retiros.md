# Cómo llega el dinero a cada parte (Qlyk)

Este documento explica qué pasa cuando alguien compra un curso, quién cobra qué, y cómo confirmar pagos y retiros manualmente.

## Resumen en una frase

**Hoy:** el comprador elige **tarjeta (Stripe)** o **SPEI**. La venta se asienta, el creador ve el 93% en el monedero y **a las 24 horas** (misma ventana de reembolso) puede retirar a su Stripe Connect.

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
| **Creador del curso** | 93% | $93 | Monedero `pending` (24 horas) |
| **Plataforma (Qlyk)** | 7% | $7 | Monedero `available` de inmediato |

Si el creador tiene el plan mensual de $25, se queda el 100% mientras el periodo esté activo.

Reglas en `src/lib/commerce/split.ts` y `src/config/compensation-plan.ts`.

### 4. Hold de 24 horas

- Las comisiones del creador quedan en estado `LOCKED`.
- A las 24 horas (la misma ventana de reembolso), al abrir el monedero o con el cron (`/api/cron/release-wallets`) pasan a `APPROVED` y el saldo va de **pendiente → disponible**.

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

En Stripe Dashboard activa **Connect** (marketplace + cuentas Express). Qlyk cobra a la plataforma y transfiere al creador al retirar (no destination charges). El onboarding usa Express v1 y, si Stripe lo exige, Accounts v2 (`recipient` + `stripe_transfers`). País por defecto: `STRIPE_CONNECT_COUNTRY=MX`. Para apagar Connect: `STRIPE_CONNECT_ENABLED=false`. Verificación en vivo: `/admin/setup` → «Stripe Connect (API en vivo)».

Basta con **un** método activo (Stripe completo o SPEI). Pueden convivir los dos.

Checklist: `/admin/setup`

---

## Entorno local

Sin Stripe ni datos bancarios, el checkout usa `provider: demo` y abre acceso al instante (solo desarrollo).
