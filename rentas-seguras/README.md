# RentasSeguras MX

SaaS para el mercado mexicano: genera un contrato de arrendamiento residencial completo (Código Civil del Estado de Hidalgo) y desbloquea la descarga en PDF tras un pago de **$499.00 MXN** con MercadoPago.

Esta app vive en `rentas-seguras/` y **no sustituye** a klikhubb. Arráncala por separado.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase Auth (correo y contraseña)
- OpenAI (redacción del contrato en Markdown)
- MercadoPago Checkout Pro ($499 MXN)

## Arranque

```bash
cd rentas-seguras
cp .env.example .env.local
# Completa las claves reales (nunca subas .env.local)
npm install
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001). La landing muestra qué integraciones están configuradas.

## Variables de entorno

Obligatorias para el flujo completo:

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Origen público (back URLs de MercadoPago), p. ej. `http://localhost:3001` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `OPENAI_API_KEY` | Clave de OpenAI |
| `MERCADOPAGO_ACCESS_TOKEN` | Access token de Checkout Pro (pruebas `TEST-…` o producción `APP_USR-…`) |

Opcionales:

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Nombre visible |
| `OPENAI_MODEL` | Modelo (por defecto `gpt-4o`) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secreto compartido del webhook (`?secret=` en la notification URL) |

No se usa `SUPABASE_SERVICE_ROLE_KEY`. Auth funciona con la anon key y la sesión del usuario.

## Setup pendiente en cada proveedor

**Supabase**

1. Authentication → Providers → Email (correo y contraseña).
2. Authentication → URL configuration: Site URL = `NEXT_PUBLIC_APP_URL` y Redirect URLs con `{APP_URL}/auth/callback`.
3. `supabase/schema.sql` es opcional (tabla `contracts` + RLS). El flujo actual guarda el formulario y el Markdown en `sessionStorage`; no hace falta aplicarlo para generar ni pagar.

**OpenAI**

1. Crea una clave en la plataforma y asígnala a `OPENAI_API_KEY`.
2. El modelo por defecto es `gpt-4o`.

**MercadoPago**

1. Credenciales de prueba (Checkout Pro) en Applications.
2. `MERCADOPAGO_ACCESS_TOKEN` de test (`TEST-…`) abre el `sandbox_init_point`.
3. Back URLs: `/pago/exito`, `/pago/fallo`, `/pago/pendiente`.
4. El PDF solo se libera si el pago está `approved`, el monto es **exactamente 499 MXN** y `external_reference` coincide con el `user.id` de Supabase.

## Flujo `generate-contract`

1. La persona usuaria crea cuenta o inicia sesión (`/registro`, `/iniciar-sesion`). Las rutas `/dashboard`, `/contrato` y `/pago` exigen sesión.
2. En `/contrato` captura arrendador, arrendatario, inmueble y condiciones (`src/components/contract-form.tsx`).
3. Se cobra **exactamente $499 MXN** vía `POST /api/mercadopago/checkout`. Tras `/pago/exito` el servidor verifica el pago y deja una cookie httpOnly con el `payment_id`.
4. `POST /api/generate-contract` (sesión requerida) llama a OpenAI (`src/lib/generate-contract.ts`) y devuelve Markdown.
5. `POST /api/contract/pdf` vuelve a verificar el pago de $499 MXN **de ese usuario** y arma el PDF.

Sin claves reales las rutas responden `401`/`402`/`503`. No hay secretos de relleno en el código.
