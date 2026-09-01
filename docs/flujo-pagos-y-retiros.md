# Cómo llega el dinero a cada parte (Qlyk)

Este documento explica qué pasa cuando alguien compra un curso, quién cobra qué, y cómo confirmar pagos y retiros manualmente.

## Resumen en una frase

**Hoy:** el comprador transfiere por SPEI → sube comprobante → **Qlykadmin confirma el pago** → la app reparte **en la base de datos** (85% creador, 10% plataforma, 5% referidor) → después de 14 días el creador/referidor puede **pedir retiro manual**.

---

## Paso a paso: una venta de $100 USD

### 1. El comprador paga

- Botón **Comprar** → datos bancarios + referencia `QLYK-XXXXXX`.
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

### 5. Retiro

- El usuario pide retiro en `/wallet`.
- Se crea un registro `Payout` con `method: manual`, `status: PENDING`.
- Se descuenta su saldo **interno**.
- **Qlykadmin** transfiere por fuera (SPEI, PayPal, etc.) y marca pagado en `/admin/payouts`.

---

## Variables en Vercel (producción)

```env
PAYMENT_BANK_NAME="BBVA"
PAYMENT_BENEFICIARY="Qlyk SA de CV"
PAYMENT_CLABE="012345678901234567"
PAYMENT_ACCOUNT_NUMBER="0123456789"
BLOB_READ_WRITE_TOKEN="..."
PLATFORM_ADMIN_PASSWORD="..."
```

Checklist: `/admin/setup`

---

## Entorno local

Sin variables bancarias, el checkout usa `provider: demo` y abre acceso al instante (solo desarrollo).
