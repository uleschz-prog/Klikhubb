# Qlyk

El centro donde todo sucede con un solo clic. Red social con video, academia y comunidad.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma 5 + PostgreSQL
- NextAuth (JWT + Credentials, Google opcional)
- Framer Motion en la landing

## Arranque local

```bash
cp .env.example .env
docker compose up -d
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

La landing queda en `http://localhost:3000`. Producción: **https://qlyk.vercel.app**

## Modelo de dinero

Cada venta: creador 85% + plataforma 10% + invitación 5% (un solo amigo). Si nadie invitó al comprador, el creador se queda el 90%. El 10% de plataforma lo recibe siempre Qlykadmin (usuario raíz de la red).
