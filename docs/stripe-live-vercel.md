# Stripe Live en Vercel (Qlyk)

Configuración desde cero para **pagos reales** en https://qlyk.vercel.app.

## 1. Borrar variables Stripe en Vercel

En **Vercel → clic → Settings → Environment Variables**, elimina estas (si existen):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_SYNC`
- `STRIPE_CONNECT_ENABLED`
- `STRIPE_CONNECT_COUNTRY`

**No borres:** `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `SITE_URL`, `BLOB_READ_WRITE_TOKEN`.

## 2. Stripe Dashboard (modo Live)

1. Desactiva **Test mode** (interruptor arriba a la derecha → **Live**).
2. **Settings → Connect** → activa Stripe Connect (Express).
3. **Developers → API keys** → copia **Secret key** (`sk_live_…`).
4. **Developers → Webhooks** → elimina endpoints viejos a `qlyk.vercel.app` (si hay).
5. **Add endpoint**:
   - URL: `https://qlyk.vercel.app/api/webhooks/stripe`
   - Eventos:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `account.updated`
6. Tras crear → **Signing secret** → Reveal → copia `whsec_…`.

## 3. Crear variables en Vercel (Production)

Marca **solo Production** (salvo que indiquemos otro entorno).

| Variable | Valor |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` del paso 3 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` del paso 6 |
| `STRIPE_CONNECT_ENABLED` | `true` |
| `STRIPE_CONNECT_COUNTRY` | `MX` |
| `NEXTAUTH_URL` | `https://qlyk.vercel.app` |
| `SITE_URL` | `https://qlyk.vercel.app` |

**No añadas** `STRIPE_WEBHOOK_SYNC` en Live salvo un único redeploy de emergencia; luego bórrala.

## 4. Redeploy

**Deployments → Redeploy** (sin caché). Las variables nuevas solo aplican tras un deploy.

## 5. Verificar

1. Abre https://qlyk.vercel.app/api/stripe/mode → debe decir `"mode":"live"` (tras merge del PR de diagnóstico).
2. Compra con **tarjeta real** (no sirve `4242…` en Live).
3. Stripe → Webhooks → entregas → respuesta **200** en `checkout.session.completed`.

## 6. Pruebas locales

En local sigue usando `sk_test_…` en tu `.env`. No mezcles claves Live en tu máquina.

## Errores frecuentes

| Error | Causa |
|---|---|
| Tarjeta 4242 rechazada | Estás en Live; usa tarjeta real |
| Webhook 400 | `whsec_` no coincide con el endpoint Live activo |
| `stripe listen` → 400 | No uses listen hacia producción |
