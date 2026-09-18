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
# Completa las claves (nunca subas secretos reales)
npm install
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001).

En el dashboard de Supabase activa **Email** (Authentication → Providers). En MercadoPago usa credenciales de prueba. En OpenAI define `OPENAI_API_KEY`.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Origen público (back URLs de MercadoPago) |
| `NEXT_PUBLIC_APP_NAME` | Nombre visible de la app |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `OPENAI_API_KEY` | Clave de OpenAI |
| `OPENAI_MODEL` | Modelo (por defecto `gpt-4o`) |
| `MERCADOPAGO_ACCESS_TOKEN` | Access token de Checkout Pro |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secreto del webhook (opcional pero recomendado) |

## Flujo `generate-contract`

1. La persona usuaria crea cuenta o inicia sesión (`/registro`, `/iniciar-sesion`). Las rutas `/dashboard`, `/contrato` y `/pago` exigen sesión (middleware + helpers de servidor).
2. En `/contrato` captura arrendador, arrendatario, inmueble y condiciones. El componente principal es `src/components/contract-form.tsx`.
3. Antes de descargar el PDF se cobra **exactamente $499 MXN** vía `POST /api/mercadopago/checkout`. MercadoPago redirige a `/pago/exito`; el servidor verifica el pago con la API y deja una cookie httpOnly con el `payment_id`.
4. Con sesión autenticada, `POST /api/generate-contract` valida el JSON (Zod), envía los datos a OpenAI con un *system prompt* de abogada/o experta/o en Derecho Civil de Hidalgo y responde el contrato en Markdown. La función de generación está en `src/lib/generate-contract.ts`.
5. `POST /api/contract/pdf` vuelve a verificar el pago aprobado de $499 MXN y, solo entonces, arma el PDF a partir del Markdown.

Sin `OPENAI_API_KEY` o `MERCADOPAGO_ACCESS_TOKEN` las rutas correspondientes responden `503` con un mensaje claro; no hay secretos de relleno en el código.
