# Cómo llega el dinero a cada parte (Qlyk)

Este documento explica qué pasa cuando alguien compra un curso, quién cobra qué, y cómo confirmar pagos y retiros.

## Resumen en una frase

**Hoy (método principal):** el comprador paga con **Mercado Pago (Checkout Pro)** → webhook confirma `approved` → la app reparte **en la base de datos** (PAYG 93/7 o FLAT 100/0) → después de 14 días el creador puede **pedir retiro manual**.

**Respaldo:** SPEI manual + comprobante + aprobación en `/admin/payments` (solo si no hay `MP_ACCESS_TOKEN`).

---

## Paso a paso: una venta con Mercado Pago

### 1. El comprador paga

- Botón **Pagar con Mercado Pago** → `POST /api/checkout` crea una Preference.
- Redirect a `init_point` (o sandbox).
- `external_reference` = `qlyk:{buyerId}:{productId}:{nonce}`.

### 2. Mercado Pago notifica

- Webhook `POST /api/webhooks/mercadopago` (también IPN GET).
- La app consulta `GET /v1/payments/{id}` con el Access Token.
- Si `status === approved` → `settlePaidOrder({ provider: "mercadopago", providerRef: payment.id })`.
- Tras el redirect, `/checkout/success` puede llamar `POST /api/checkout/mercadopago/confirm` por si el webhook llega tarde (idempotente).

### 3. La app reparte la venta (contabilidad interna)

| Parte | PAYG | FLAT |
|-------|------|------|
| **Creador** | 93% | 100% |
| **Plataforma (Qlykadmin)** | 7% | 0% |

Reglas en `src/lib/commerce/split.ts` y `src/config/compensation-plan.ts`. Hold 14 días en monedero pending.

### 4. Retiro

- El usuario pide retiro en `/wallet`.
- **Qlykadmin** transfiere por fuera (SPEI, PayPal, etc.) y marca pagado en `/admin/payouts`.

---

## Variables en Vercel (producción)

```env
# Principal
MP_ACCESS_TOKEN="APP_USR-... o TEST-..."
MP_PUBLIC_KEY="APP_USR-... o TEST-..."
MP_WEBHOOK_SECRET="..."   # de Webhooks en el panel MP
SITE_URL="https://qlyk.vercel.app"
NEXTAUTH_URL="https://qlyk.vercel.app"

# Respaldo SPEI (opcional si hay MP)
PAYMENT_BANK_NAME=""
PAYMENT_BENEFICIARY=""
PAYMENT_CLABE=""
BLOB_READ_WRITE_TOKEN="..."   # solo necesario para comprobantes SPEI
PLATFORM_ADMIN_PASSWORD="..."
```

### Configurar webhooks en Mercado Pago

1. [Tus integraciones](https://www.mercadopago.com.mx/developers/panel/app) → tu aplicación.
2. **Webhooks** → URL de producción:
   `https://TU_DOMINIO/api/webhooks/mercadopago`
3. Evento: **Payments**.
4. Copia el **secret** a `MP_WEBHOOK_SECRET`.
5. Prueba con usuario de prueba (credenciales `TEST-`).

Checklist: `/admin/setup`

---

## Entorno local

Sin `VERCEL_ENV=production`, el checkout usa `provider: demo` y abre acceso al instante.
Con token `TEST-` puedes probar Preferences en sandbox (`MP_USE_SANDBOX=1` opcional).
