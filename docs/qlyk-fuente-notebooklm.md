# Qlyk — Documento fuente para NotebookLM

Este documento describe la plataforma Qlyk de forma completa. Puede usarse como fuente única o principal en Google NotebookLM para generar resúmenes, podcasts, FAQs, guiones o material de formación.

---

## 1. Identidad y propósito

**Nombre:** Qlyk  
**URL de producción:** https://qlyk.vercel.app  
**Slogan:** El centro donde todo sucede con un solo clic.  
**Frase principal de marketing:** Del video al pago. Sin salir del feed.

**Qué es Qlyk:**  
Qlyk es una red social con comercio y academia integrados. Permite a los creadores publicar video, vender productos digitales (cursos, membresías, contenido digital), gestionar comunidad y cobrar en un monedero interno, todo dentro de la misma aplicación.

**Problema que resuelve:**  
Los creadores suelen estar fragmentados entre redes sociales (alcance), plataformas de pago (cobro), herramientas de cursos (formación) y apps de comunidad (retención). Cada enlace extra reduce la conversión. Qlyk unifica video, venta, academia, comunidad y monedero en un solo flujo.

**Propuesta de valor:**  
- Para creadores: dueño del feed, la academia y la venta; se queda entre el 85% y el 90% de cada venta.  
- Para miembros/compradores: consumir contenido y comprar sin salir de la experiencia.  
- Para la plataforma: 10% de tarifa de servicio en cada transacción.

**Registro:** Gratuito, directo, sin lista de espera.

---

## 2. Módulos y funcionalidades

### 2.1 Landing y registro
- Página principal con video hero, copy de marca y formulario de registro integrado.
- Registro en `/register` con campos: nombre, email, usuario (@username), contraseña, intención (Creador / Miembro / Los dos), código de amigo opcional, aceptación de términos.
- Detección automática de idioma y zona horaria del navegador.

### 2.2 Feed (`/feed`)
- Feed vertical de video estilo TikTok/Reels.
- Lane SHOP: contenido orientado a venta con botón de compra integrado.
- Tabs: Para ti, Siguiendo, Guardados.
- Interacciones: like, guardar, comentar, compartir.

### 2.3 Play (`/play`)
- Lane PLAY: contenido de entretenimiento/descubrimiento.
- Misma infraestructura de video que el feed, con enfoque en alcance más que venta directa.

### 2.4 Marketplace (`/marketplace`)
- Catálogo de productos: cursos, membresías, productos digitales y físicos.
- Cada producto tiene slug, precio, moneda y creador asociado.

### 2.5 Academy (`/academy`)
- Acceso a cursos comprados o creados por el usuario.
- Reproductor de lecciones con módulos estructurados.

### 2.6 Community (`/community`)
- Espacios de comunidad vinculados a membresías.
- Posts: discusión, anuncios, preguntas, wins.
- Likes en publicaciones.

### 2.7 Dashboard / Hub (`/dashboard`)
- Centro de control del usuario.
- Resumen de monedero, puntos, ranking (leaderboard).
- Tarjeta de invitación con código personal.
- Enlaces rápidos a publicar, studio, wallet y otras secciones.

### 2.8 Publicar video (`/publish`)
- Subida de video vía Vercel Blob (hasta 400 MB), URL de YouTube o MP4 directo.
- Elección de lane: SHOP (venta) o PLAY (entretenimiento).
- Vincular producto existente o crear oferta nueva (curso, membresía, digital).

### 2.9 Course Studio (`/studio`)
- Crear cursos nuevos con título, precio y descripción.
- Editor de módulos y lecciones.
- Subida de videos y archivos por lección.
- Publicación del curso al marketplace.

### 2.10 Monedero (`/wallet`)
- Saldo disponible y pendiente.
- Historial de movimientos (ledger).
- Comisiones en retención (hold).
- Solicitud de retiro (mínimo 10 USD; procesamiento manual por Qlykadmin en `/admin/payouts`).

### 2.11 Checkout y pagos
- Checkout por producto (`/checkout/[slug]`).
- Pagos por transferencia SPEI: datos bancarios, referencia `QLYK-XXXXXX`, subida de comprobante.
- Confirmación manual por Qlykadmin en `/admin/payments` → acredita comisiones al monedero.
- Página de éxito post-compra (cuando el pago está aprobado).

---

## 3. Usuarios, roles e invitaciones

### 3.1 Tipos de usuario al registrarse
- **Creador (CREATOR):** publica contenido y vende.
- **Miembro (STUDENT):** consume, compra, participa.
- **Los dos (BOTH):** recibe roles CREATOR + STUDENT.

### 3.2 Roles en el sistema
- CREATOR: publicar, vender, studio.
- STUDENT: comprar, consumir, comunidad.
- ADMIN: administración de plataforma (cuenta Qlykadmin).
- AFFILIATE: definido en esquema de datos; no asignado en registro actual.

### 3.3 Sistema de invitación (referidos)
- Cada usuario tiene un código de referido único (ej. QLYKADMIN, MAYA).
- Al registrarse con código o URL `?ref=CODIGO`, queda vinculado a quien lo invitó (`invitedById`).
- Si no hay código, el referente por defecto es Qlykadmin (cuenta raíz).
- **Un solo nivel:** no hay multinivel, matrices binarias ni bonos por reclutamiento.
- Mensaje clave: **Invita, no reclutes.** La comisión del referidor se genera cuando el referido **compra**, no cuando se registra.

---

## 4. Modelo económico y monetización

### 4.1 Reparto por venta (plan klikhubb-v1)

Cada venta completada se reparte al 100%:

| Beneficiario | Porcentaje | Condición |
|--------------|------------|-----------|
| Creador (dueño del producto) | 85% | Siempre |
| Plataforma (Qlykadmin) | 10% | Siempre |
| Referidor (quien invitó al comprador) | 5% | Solo si el comprador tiene referente válido |

**Si no hay referidor válido:**  
- Creador: 90%  
- Plataforma: 10%  
- Referidor: 0%

**Ejemplo:** venta de 100 €  
- Sin referidor → Creador 90 €, Plataforma 10 €  
- Con referidor → Creador 85 €, Referidor 5 €, Plataforma 10 €

### 4.2 Retención (hold) de 14 días
- Tras una venta, las comisiones quedan en estado pendiente durante 14 días naturales.
- Motivo: gestionar devoluciones, contracargos y revisiones antifraude.
- Un cron diario libera fondos vencidos de pendiente a disponible.

### 4.3 Retiros
- Saldo mínimo para retiro: 10 USD.
- Hoy: solicitud desde el monedero; Qlykadmin transfiere y marca pagado en `/admin/payouts`.

### 4.4 Tipos de producto vendibles
- COURSE: curso con módulos y lecciones.
- MEMBERSHIP: membresía con acceso a comunidad.
- DIGITAL: producto digital descargable.
- PHYSICAL: producto físico (estructura preparada).

### 4.5 Lo que Qlyk NO es económicamente
- No es multinivel (MLM).
- No paga por registrar personas.
- No promete ingresos garantizados.
- No tiene niveles encadenados de comisión por reclutamiento.

---

## 5. Flujos de usuario explicados paso a paso

### 5.1 Flujo del creador que vende con video
1. Se registra como Creador o Los dos.
2. Crea un producto en Studio o al publicar un video.
3. Sube un clip en `/publish` (lane SHOP) vinculado al producto.
4. El video aparece en el Feed con CTA de compra.
5. Un miembro transfiere por SPEI y sube comprobante; Qlykadmin aprueba en `/admin/payments`.
6. El comprador accede al curso/comunidad en Academy.
7. El creador ve la comisión en su monedero (pendiente 14 días, luego disponible).
8. Solicita retiro cuando supera el mínimo.

### 5.2 Flujo del miembro comprador
1. Se registra gratis.
2. Explora Feed, Play o Marketplace.
3. Compra un producto.
4. Accede al contenido en Academy y Community si aplica.
5. Puede seguir creadores, guardar videos e interactuar.

### 5.3 Flujo del referidor
1. Comparte su código o enlace `?ref=CODIGO`.
2. Un nuevo usuario se registra con ese código.
3. Cuando ese usuario **compra**, el referidor recibe 5% de esa compra.
4. La comisión sigue el mismo hold de 14 días y va al monedero.

---

## 6. Gamificación

- **Puntos:** acumulables por compras y actividad en comunidad.
- **Leaderboard:** ranking visible en dashboard.
- **Rangos:** Spark, Builder, Leader, Elite, Crown (por volumen personal en seed).
- **Invitaciones:** contador de personas invitadas.
- La gamificación es motivacional dentro del producto; no tiene efectos legales externos.

---

## 7. Stack tecnológico

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion.
- **Backend:** API Routes de Next.js, Prisma ORM.
- **Base de datos:** PostgreSQL.
- **Autenticación:** NextAuth (email/contraseña + Google OAuth opcional).
- **Pagos:** transferencia SPEI manual + confirmación admin en `/admin/payments`.
- **Almacenamiento de video:** Vercel Blob.
- **Email transaccional:** Resend (opcional).
- **Despliegue:** Vercel (con cron para liberación de monedero).
- **Modo demo:** si no hay base de datos, funciona con archivo JSON local.

---

## 8. Legal y cumplimiento

### 8.1 Documentos publicados
- Términos de uso: `/legal/terms`
- Política de privacidad (RGPD): `/legal/privacy`
- Política de cookies: `/legal/cookies`

### 8.2 Puntos legales clave
- Qlyk actúa como intermediario tecnológico; el creador es el vendedor del producto.
- Registro gratuito; sin lista de espera.
- Modelo de compensación documentado: 85/10/5, un solo nivel.
- Hold de 14 días explicado en términos.
- Ley aplicable: España, con derechos de consumidor UE.
- Menores de 18 años no deben registrarse.

### 8.3 Datos personales recogidos
Email, nombre, usuario, contraseña (hash), idioma, zona horaria, intención de registro, código de referido, contenido publicado, historial de compras, movimientos de monedero, datos técnicos de sesión.

---

## 9. Credenciales de demostración

**Contraseña demo general:** KlikHubb2026!

| Usuario | Email | Rol |
|---------|-------|-----|
| Qlykadmin | qlykadmin@qlyk.app / usuario Qlykadmin | Admin + creador. Contraseña: Codigo1. |
| Maya (creadora) | maya@klikhubb.dev | Creadora de cursos demo |
| Rafa (comprador) | rafa@klikhubb.dev | Miembro/comprador demo |

**Código de invitación admin:** QLYKADMIN

---

## 10. Productos demo en el catálogo seed

- **Academia Cierre Élite** — $497 — Curso — Creadora: Maya Chen  
- **Inner Circle** — $49 — Membresía  
- **De view a cliente** — $197 — Curso  

---

## 11. Comparativa con otras soluciones

| Plataforma | Limitación | Ventaja de Qlyk |
|------------|------------|-----------------|
| TikTok / Instagram | Alcance sin venta nativa integrada | Compra en el mismo feed |
| Gumroad / Hotmart | Cobro fuera del contenido social | Video + checkout unificados |
| Skool / Discord | Comunidad sin feed de video first | Video-first + comunidad + venta |
| MLM / afiliados clásicos | Reclutamiento multinivel | Un solo nivel, comisión solo por compra |

---

## 12. Mensajes clave para comunicación

### Para creadores
- «Publicas, vendes y cobras sin sacar a tu gente del feed.»
- «Te quedas el 85–90% de cada venta.»
- «Cuenta gratis. Sin lista de espera.»
- «Invita, no reclutes.»

### Para inversionistas
- Take rate claro del 10% sobre GMV.
- No es MLM; modelo legalmente defendible.
- Producto live con pagos SPEI manual, studio, wallet y legal RGPD.
- Mercado: creator economy hispano/latino.

### Para redes sociales (WhatsApp, Reels)
- Hook: «¿Cuántos clics perdiste hoy?»
- CTA: https://qlyk.vercel.app
- Preview al compartir enlace: imagen Open Graph con marca Qlyk.

---

## 13. Roadmap y estado actual

**Implementado:**
- Landing premium con video hero.
- Registro directo ampliado.
- Feed, Play, Marketplace, Academy, Community.
- Course Studio y publicación de video.
- Checkout SPEI, confirmación admin (`/admin/payments`), monedero, hold 14 días.
- Términos, privacidad, cookies completos.
- Preview Open Graph para WhatsApp.

**En evolución / planificado:**
- Retiros manuales consolidados (`/admin/payouts`).
- KYC para retiros.
- Dominio propio de producción.
- Datos legales corporativos completos (razón social, NIF, domicilio).
- Analytics de conversión feed → venta.

---

## 14. Glosario

| Término | Definición |
|---------|------------|
| **Feed** | Timeline vertical de videos con lane SHOP (venta). |
| **Play** | Timeline de entretenimiento, lane PLAY. |
| **Lane** | Tipo de video: PLAY o SHOP. |
| **Hold** | Retención de 14 días antes de liberar comisiones. |
| **Monedero** | Saldo interno (pendiente + disponible). |
| **Código de amigo** | Código de referido de un nivel. |
| **Qlykadmin** | Cuenta raíz de la plataforma; recibe el 10% de servicio. |
| **Studio** | Herramienta de creación de cursos. |
| **GMV** | Volumen bruto de ventas (métrica para inversores). |

---

## 15. Preguntas frecuentes (FAQ)

**¿Qlyk es gratis?**  
Sí, crear cuenta es gratis. La plataforma cobra 10% solo cuando hay ventas.

**¿Es una estafa o pirámide?**  
No. Un solo nivel de referido. Comisión del 5% solo sobre compras, no sobre registros.

**¿Cuánto gana el creador?**  
Entre 85% y 90% de cada venta, según haya referidor o no.

**¿Cuándo puedo retirar?**  
Tras 14 días de retención, cuando el saldo disponible supera 10 USD.

**¿Puedo vender cursos?**  
Sí, con Course Studio o creando productos al publicar video.

**¿Necesito lista de espera?**  
No. Registro directo e inmediato.

**¿Qué pasa si comparto mi enlace?**  
Al compartir en WhatsApp aparece tarjeta con imagen, título y descripción (Open Graph).

---

*Documento fuente Qlyk · Versión 1.0 · Agosto 2026 · Para uso en NotebookLM y materiales derivados.*
