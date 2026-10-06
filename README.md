# Qlyk

El centro donde todo sucede con un solo clic. Red social con video, cursos y comunidad.

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

## Contrato LyraAgent

Agente en Solidity que guarda USDC y deja que un keeper (Gelato o Chainlink) dispare un swap. El owner deposita y retira. `checkAndExecute` no es `onlyOwner`: lo llama el keeper, como máximo una vez por hora, y solo si el contrato tiene USDC. El swap es simulado: `MockSwapRouter` devuelve más USDC usando liquidez que ya tiene. No es Uniswap; el comentario del mock indica el reemplazo futuro.

Red: **Polygon Amoy** (`polygonAmoy`, chainId `80002`). Explorer: https://amoy.polygonscan.com. RPC por `POLYGON_AMOY_RPC_URL` (default público `https://rpc-amoy.polygon.technology`). La cuenta sale de `PRIVATE_KEY` y no se commitea.

USDC de Amoy: la nativa de Circle, `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582` (`config/amoy.ts`). Se puede cambiar con `AMOY_USDC_ADDRESS`. En Amoy el deploy no crea el mock: exige `MOCK_ROUTER_ADDRESS`. En `hardhat` o `localhost` el script despliega `MockERC20` y `MockSwapRouter`.

```bash
cp .env.example .env
npm run compile
npm test
npm run deploy:local
npm run deploy
```

`npm run deploy` usa Amoy y falla si faltan `PRIVATE_KEY` o `MOCK_ROUTER_ADDRESS`. Hardhat 3 pide `"type": "module"` en `package.json`.
