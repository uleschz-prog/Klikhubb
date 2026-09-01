# Qlyk — Manual para creadores

**Cómo publicar, vender y cobrar en Qlyk**  
Plataforma: https://qlyk.vercel.app

---

## 1. ¿Qué es Qlyk para ti como creador?

Qlyk es tu **centro de operaciones** como creador:

- Publicas **video** en un feed vertical.
- Vendes **cursos, membresías y productos digitales** sin mandar a tu audiencia a otro sitio.
- Tu gente se queda contigo en **academy** y **community**.
- Cobras en un **monedero** con reparto automático y retiros.

> **Idea clave:** del video al pago, sin salir del feed.

---

## 2. Empieza en 5 minutos

### Paso 1 — Crea tu cuenta (gratis)

1. Entra a **https://qlyk.vercel.app**
2. Completa el formulario:
   - Tu nombre
   - Email
   - @usuario (3–20 caracteres, solo letras minúsculas, números y `_`)
   - Contraseña (8+ caracteres)
3. Elige **Creador** o **Los dos**
4. Opcional: código de amigo (si alguien te invitó)
5. Acepta términos → entras directo a tu **Dashboard**

### Paso 2 — Conoce tu Dashboard (`/dashboard`)

Desde aquí accedes a:

| Sección | Para qué |
|---------|----------|
| **Monedero** | Ver saldo, retenciones y pedir retiro |
| **Publicar** | Subir video con oferta |
| **Studio** | Crear cursos completos |
| **Feed / Marketplace** | Ver cómo te ven los demás |
| **Tu código de invitación** | Compartir con tu audiencia |

---

## 3. Cómo ganas dinero en Qlyk

### Reparto de cada venta

Cuando alguien compra **tu** producto:

| Situación | Tú recibes | Plataforma | Referidor |
|-----------|------------|------------|-----------|
| Comprador **sí** fue referido por otro usuario | **85%** | 10% | 5% (a quien lo invitó) |
| Comprador **no** tiene referidor válido | **90%** | 10% | — |

**Ejemplo:** vendes un curso de **100 €**

- Sin referidor → tú **90 €**, Qlyk **10 €**
- Con referidor → tú **85 €**, referidor **5 €**, Qlyk **10 €**

> El 10% de plataforma es la tarifa de servicio (pagos, hosting, producto).  
> **No pagas por tener cuenta.** Solo compartes cuando hay venta.

### ¿Y el código de amigo?

- Cada usuario tiene un código (ej. `MAYA`, `TUUSUARIO`).
- Si invitas a alguien y **esa persona compra**, tú recibes el **5%** de **sus compras** (no de lo que vendan como creadores).
- **Invita, no reclutes:** no ganas por registrar gente; ganas cuando compran.

Comparte tu enlace con referido:
```
https://qlyk.vercel.app?ref=TUCODIGO
```

---

## 4. Dos formas de vender

### Opción A — Video + venta en el Feed (rápido)

**Ruta:** `/publish`

1. Sube tu video (archivo, YouTube o enlace MP4).
2. Elige lane **SHOP** (venta en feed) o **PLAY** (entretenimiento; puedes activar venta).
3. Vincula un producto existente **o crea uno nuevo**:
   - Curso
   - Membresía
   - Producto digital
4. Publica → tu clip aparece en el **Feed** con botón de compra.

**Ideal para:** lanzamientos, clips de venta, contenido viral que convierte.

### Opción B — Curso completo en Studio (profesional)

**Ruta:** `/studio` → **Nuevo curso**

1. Título, precio y descripción.
2. Crea **módulos** (capítulos).
3. Añade **lecciones** con video o archivos.
4. Publica el curso → aparece en **Marketplace** y **Academy**.
5. Opcional: promociona con un video en `/publish` enlazado al curso.

**Ideal para:** formaciones largas, academias, programas estructurados.

---

## 5. Tipos de producto que puedes ofrecer

| Tipo | Qué es | Ejemplo |
|------|--------|---------|
| **Curso (COURSE)** | Lecciones en módulos | «Academia de cierre de ventas» |
| **Membresía (MEMBERSHIP)** | Acceso recurrente + comunidad | «Inner Circle mensual» |
| **Digital (DIGITAL)** | PDF, plantilla, recurso descargable | «Pack de scripts» |
| **Físico (PHYSICAL)** | Producto físico (estructura disponible) | Merchandising |

---

## 6. El monedero — cuándo cobras

**Ruta:** `/wallet`

### Estados del dinero

| Estado | Significado |
|--------|-------------|
| **Pendiente** | Venta reciente; en periodo de retención |
| **Disponible** | Listo para solicitar retiro |
| **Retirado** | Ya procesado por el equipo (retiro manual en `/admin/payouts`) |

### Retención de 14 días

Tras cada venta, tu parte queda **14 días en hold** para cubrir:

- Devoluciones
- Contracargos bancarios
- Revisiones antifraude

Pasados los 14 días, pasa a **disponible** automáticamente (cron diario).

### Retirar dinero

- **Mínimo:** 10 USD
- **Hoy:** solicitas retiro desde `/wallet` → el equipo transfiere (SPEI u otro) y marca pagado en `/admin/payouts`

---

## 7. Play vs Feed — ¿dónde publico?

| | **Play** (`/play`) | **Feed** (`/feed`) |
|---|-------------------|-------------------|
| **Estilo** | Entretenimiento, alcance | Venta integrada |
| **Lane** | PLAY | SHOP |
| **Objetivo** | Crecer audiencia | Convertir en clientes |
| **Estrategia** | Clips virales, valor gratis | Clips con CTA de compra |

**Recomendación:** usa **Play** para atraer y **Feed** para vender. O publica en SHOP con contenido que entretiene **y** convierte.

---

## 8. Community y Academy

- Al vender una **membresía**, tu comprador puede acceder a tu **Community** (`/community/[slug]`).
- Publica anuncios, wins, preguntas → refuerza retención y LTV.
- Tus cursos activos aparecen en **Academy** para quien compró acceso.

**Flujo ideal:** video en feed → compra → curso en academy → comunidad para soporte y upsells.

---

## 9. Buenas prácticas para vender más

### Contenido
- Primeros 3 segundos: gancho claro.
- Un solo CTA por video («Compra el curso» / «Entra a la membresía»).
- Muestra resultado, no solo teoría.

### Precio
- Empieza con una oferta de entrada (membresía baja o curso corto).
- Sube ticket con programas completos en Studio.

### Referidos
- Comparte `?ref=TUCODIGO` en bio, stories y descripción de videos.
- No prometas «ganar dinero invitando» — promete **valor**; el 5% es bonus cuando compran.

### Legal
- Solo vende lo que es tuyo o tienes derecho a vender.
- Declara tus ingresos según la ley de tu país.
- Lee términos: https://qlyk.vercel.app/legal/terms

---

## 10. Gamificación (puntos y ranking)

- Ganas **puntos** por compras en la plataforma y actividad en comunidad.
- Apareces en el **leaderboard** del dashboard.
- Es motivación y visibilidad; **no sustituye** ingresos por ventas.

---

## 11. Checklist del creador lanzando en Qlyk

- [ ] Cuenta creada con @usuario profesional
- [ ] Foto/bio en perfil (cuando esté disponible)
- [ ] Primer producto creado (Studio o desde Publish)
- [ ] Primer video SHOP publicado en Feed
- [ ] Enlace con `?ref=TUCODIGO` en redes sociales
- [ ] Compra de prueba con transferencia SPEI y comprobante
- [ ] Revisado monedero y entendido el hold de 14 días
- [ ] Términos y privacidad leídos

---

## 12. Soporte y recursos

| Recurso | Enlace |
|---------|--------|
| Plataforma | https://qlyk.vercel.app |
| Registro | https://qlyk.vercel.app/register |
| Dashboard | https://qlyk.vercel.app/dashboard |
| Studio | https://qlyk.vercel.app/studio |
| Términos | https://qlyk.vercel.app/legal/terms |
| Privacidad | https://qlyk.vercel.app/legal/privacy |

**Contacto:** qlykadmin@qlyk.app

---

## 13. Preguntas frecuentes de creadores

**¿Cuánto cuesta usar Qlyk?**  
Registro gratis. La plataforma cobra 10% solo cuando vendes.

**¿Cuándo recibo mi dinero?**  
Tras 14 días de retención → saldo disponible → solicitas retiro (mín. 10 USD).

**¿Puedo vender sin video?**  
Sí, con Studio + Marketplace. Pero el video en feed suele convertir más.

**¿Pierdo el 5% siempre?**  
Solo si quien compra fue referido por otro usuario. Si no hay referidor, tú te quedas el 90%.

**¿Es una estafa / MLM?**  
No. Un solo nivel de referido por compra. Sin pago por reclutar. Términos públicos.

**¿Puedo usar mi propio dominio?**  
Roadmap; hoy usas qlyk.vercel.app (dominio custom en evolución).

---

*Manual Qlyk para creadores · Versión 1.0 · Agosto 2026*
