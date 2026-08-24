# KlikHubb

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

La landing queda en `http://localhost:3000`. `/dashboard` está protegido por middleware.

## Modelo de dinero

Cada venta: creador 80% + plataforma 10% + invitación 10% (un solo amigo). Si nadie invitó al comprador, el creador se queda el 90%.
