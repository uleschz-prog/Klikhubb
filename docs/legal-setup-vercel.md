# Identidad legal en Vercel (Qlyk)

Antes del beta público, configura estos datos en **Vercel → Settings → Environment Variables → Production**.

## Variables

| Variable | Ejemplo | Para qué sirve |
|----------|---------|----------------|
| `LEGAL_ENTITY_NAME` | `Mi Empresa S.L.` | Razón social en términos y privacidad |
| `LEGAL_TAX_ID` | `B12345678` | NIF/CIF en documentos legales |
| `LEGAL_ADDRESS` | `Calle Ejemplo 1, 28001 Madrid, España` | Domicilio fiscal |
| `LEGAL_CONTACT_EMAIL` | `qlykadmin@qlyk.app` | Contacto general (ya tiene default) |
| `LEGAL_PRIVACY_EMAIL` | `privacidad@qlyk.app` | Contacto RGPD (ya tiene default) |

## Pasos

1. Entra a Vercel con el proyecto Qlyk.
2. Añade las cinco variables en **Production** (y Preview si quieres probar antes).
3. **Redeploy** el proyecto (Deployments → ⋯ → Redeploy).
4. Entra como **Qlykadmin** → **Admin · Configuración** (`/admin/setup`).
5. Verifica que **Identidad legal pública** aparezca en verde.
6. Abre `/legal/terms` y `/legal/privacy` y confirma que se muestran razón social, NIF y domicilio.

## Si faltan datos

La app sigue funcionando, pero los textos legales dirán que los datos identificativos se facilitan a petición. Eso es aceptable para pruebas internas, no para un launch público.

## Verificación técnica

- Panel admin: `/admin/setup`
- API (solo admin): `GET /api/admin/platform-readiness`
