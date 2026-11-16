# Identidad legal en Vercel (Qlyk)

Antes del beta público, configura estos datos en **Vercel → Settings → Environment Variables → Production**.

El repositorio es público: no subas RFC, domicilio ni secretos al código ni a `.env.example`.

## Variables

| Variable | Qué poner | Para qué sirve |
|----------|-----------|----------------|
| `LEGAL_ENTITY_NAME` | Razón social o nombre de la persona titular | Términos y privacidad |
| `LEGAL_TAX_ID` | RFC del titular | Documentos legales (se muestra como RFC) |
| `LEGAL_ADDRESS` | Domicilio fiscal | Domicilio en textos legales |
| `LEGAL_CONTACT_EMAIL` | Correo de contacto (hay default) | Contacto general |
| `LEGAL_PRIVACY_EMAIL` | Correo de privacidad (hay default) | Derechos ARCO / LFPDPPP |

## Pasos

1. Entra a Vercel con el proyecto Qlyk.
2. Añade las cinco variables en **Production** (y Preview si quieres probar antes).
3. **Redeploy** el proyecto (Deployments → ⋯ → Redeploy).
4. Entra como **Qlykadmin** → **Admin · Configuración** (`/admin/setup`).
5. Verifica que **Identidad legal pública** aparezca en verde.
6. Abre `/legal/terms` y `/legal/privacy` y confirma que se muestran razón social, RFC y domicilio.

## Si faltan datos

La app sigue funcionando, pero los textos legales dirán que los datos identificativos se facilitan a petición. Eso es aceptable para pruebas internas, no para un launch público.

## Verificación técnica

- Panel admin: `/admin/setup`
- API (solo admin): `GET /api/admin/platform-readiness`
