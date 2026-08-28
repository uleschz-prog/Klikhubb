# Cómo llega el dinero a cada parte (Qlyk)

Este documento explica qué pasa hoy cuando alguien compra un curso, quién cobra qué, y qué falta activar para que el dinero llegue **de verdad** al creador y al referidor.

## Resumen en una frase

**Hoy:** el comprador paga con tarjeta → **todo el dinero entra a tu cuenta Stripe de plataforma** → la app reparte **en la base de datos** (85% creador, 10% plataforma, 5% referidor) → después de 14 días el creador/referidor puede **pedir retiro**.

**Para que llegue dinero real al creador/referidor:** hay que activar **Stripe Connect** (cuenta Express por usuario) y los retiros se envían con `stripe.transfers.create`.

---

## Paso a paso: una venta de $100 USD

### 1. El comprador paga

- Botón **Comprar** → Stripe Checkout (Hosted).
- Usa **tu** `STRIPE_SECRET_KEY` (cuenta única de plataforma).
- Los **$100 enteros** caen en el balance de Stripe de Qlyk/plataforma.
- Stripe cobra su comisión de procesamiento aparte (no está modelada en la app).

### 2. La app reparte la venta (contabilidad interna)

Al confirmarse el pago (webhook o página de éxito), `settlePaidOrder()` crea:

| Parte | Porcentaje | Ejemplo $100 | Dónde queda |
|-------|-----------|--------------|-------------|
| **Creador del curso** | 85% | $85 | Monedero `pending` (14 días) |
| **Quien invitó al comprador** | 5% | $5 | Monedero `pending` (14 días) |
| **Plataforma (Qlykadmin)** | 10% | $10 | Monedero `available` de inmediato |

**Si nadie invitó al comprador:** el 5% se suma al creador → **90% creador + 10% plataforma**.

Reglas en `src/lib/commerce/split.ts` y `src/config/compensation-plan.ts`.

### 3. Hold de 14 días

- Las comisiones del creador y referidor quedan en estado `LOCKED`.
- Tras 14 días, un cron (`/api/cron/release-wallets`) las pasa a `APPROVED` y mueve el saldo de **pendiente → disponible** en el monedero.

Motivo: margen para reembolsos/disputas antes de liberar retiro.

### 4. Retiro

#### Modo actual (sin Connect)

- El usuario pide retiro en `/wallet`.
- Se crea un registro `Payout` con `method: manual`, `status: PENDING`.
- Se descuenta su saldo **interno**.
- **Tú (operador)** debes transferirle el dinero por fuera (SPEI, PayPal, etc.). La app no envía el dinero sola.

#### Modo automático (con Stripe Connect activado)

Variables en Vercel:

```env
STRIPE_CONNECT_ENABLED=true
STRIPE_CONNECT_COUNTRY=MX
```

Flujo:

1. Creador/referidor entra a **Monedero → Conectar cuenta bancaria** (Stripe Express onboarding).
2. Cuando Stripe marca la cuenta lista (`payouts_enabled`), puede retirar.
3. Al pedir retiro, la app hace `stripe.transfers.create` desde **tu balance de plataforma** hacia su cuenta Connect.
4. Stripe deposita a su banco según su calendario Express.

Código: `src/lib/commerce/stripe-connect.ts` + `src/lib/commerce/wallet.ts`.

---

## Diagrama del flujo completo

```
COMPRADOR
   │ paga $100 con tarjeta
   ▼
STRIPE (cuenta plataforma)  ←── 100% del dinero real aquí
   │
   ▼ webhook / success
APP (Postgres)
   ├─ Creador:    $85 pending (14 días)
   ├─ Referidor:  $5  pending (14 días)   [si aplica]
   └─ Plataforma: $10 available (Qlykadmin)
   │
   ▼ tras 14 días
Monedero disponible (creador / referidor)
   │
   ├─ SIN Connect → retiro manual (tú depositas a mano)
   │
   └─ CON Connect → stripe.transfers.create → cuenta Express → banco del usuario
```

---

## Qué NO hace la app hoy (y por qué importa)

| Tema | Estado |
|------|--------|
| Reparto automático en el cobro (destination charges) | No — todo entra a plataforma primero |
| Stripe Connect onboarding | Implementado (opt-in con `STRIPE_CONNECT_ENABLED`) |
| Transferencias automáticas al retirar | Implementado cuando Connect está activo |
| Reembolsos / chargebacks | Enums en DB, sin lógica completa |
| KYC antes de retiro | Campo `kycStatus` sin usar aún |
| Panel admin para marcar retiros manuales | No existe |

---

## Checklist para producción real

### Ya tienes (solo plataforma)

- [x] Stripe Checkout cobrando al comprador
- [x] Webhook de ventas
- [x] Reparto 85/10/5 en monederos
- [x] Hold 14 días + cron

### Para pagar creadores/referidos sin hacerlo a mano

1. **Stripe Dashboard → Settings → Connect** → activar Connect (Express).
2. **Vercel env vars:**
   - `STRIPE_CONNECT_ENABLED=true`
   - `STRIPE_CONNECT_COUNTRY=MX` (o país del creador)
3. **Webhook Stripe** → añadir evento `account.updated` a `/api/webhooks/stripe`.
4. Pedir a cada creador/referidor que entre a **Monedero** y complete **Conectar cuenta bancaria**.
5. Verificar que tu balance de Stripe tenga fondos suficientes para las transferencias (vienen de las ventas cobradas).

### Alternativa temporal (sin Connect)

Seguir con retiros `manual`: exportar payouts `PENDING` y pagar por SPEI/transferencia. Necesitarías un panel admin para marcar `COMPLETED` (aún no incluido).

---

## Preguntas frecuentes

**¿Por qué no se reparte en el momento del cobro en Stripe?**  
Porque el hold de 14 días y el reparte flexible (referidor opcional) encajan mejor con “cobrar todo en plataforma y transferir después”. Es el modelo “Separate charges and transfers” de Stripe.

**¿El 10% de plataforma ya está en mi Stripe?**  
Sí. Como todo el pago entra a tu cuenta, el 10% no se “transfiere” a otro lado: ya está en tu balance. La app solo lo anota en el monedero de Qlykadmin.

**¿El referidor recibe dinero aunque no haya creado cursos?**  
Sí, si alguien que **él invitó** compra un curso de **otro creador**, recibe el 5% en su monedero.

**¿Cuánto cuesta Connect?**  
Stripe cobra comisiones por transferencias/payouts según tu país y plan. Revisa la tarifa actual en stripe.com/pricing.
