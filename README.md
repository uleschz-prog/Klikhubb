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

## Contrato LyraAutonomousAgent

Mismo esquema que LyraAgent, con cooldown de 10 minutos. El keeper llama `executeStrategy()` (sin `onlyOwner`). Si no hay USDC, revierte con `LyraAutonomousAgent: no balance`. El swap sigue siendo el mock `swapUSDCForProfit`. El evento para el frontend es:

`StrategyExecuted(address indexed agent, string action, string asset, uint256 amountIn, uint256 amountOut, uint256 timestamp)`

con `action` `BUY` y `asset` `ETH`. `checker()` devuelve `(bool canExec, bytes execPayload)` y `execPayload` es la llamada a `executeStrategy()` sin argumentos.

No había una pantalla de trades. El historial vive en `/wallet`, debajo del monedero, con el mismo estilo de lista. Escucha `StrategyExecuted` en Polygon Amoy (chainId 80002) con viem `watchContractEvent` y pinta los trades sin recargar. Si `NEXT_PUBLIC_LYRA_AUTONOMOUS_AGENT_ADDRESS` está vacío, la tarjeta dice «Sin contrato configurado».

```bash
npm run deploy:autonomous:local
npm run deploy:autonomous
```

`deploy:autonomous` exige `PRIVATE_KEY` y `MOCK_ROUTER_ADDRESS`, y usa la USDC de `config/amoy.ts`. En `hardhat`, `localhost` o `amoyNode` despliega `MockERC20` y `MockSwapRouter`. `amoyNode` es un nodo local con chainId 80002 (`npx hardhat node --network amoyNode`) para probar la escucha. `NEXT_PUBLIC_LYRA_RPC_URL` es opcional; vacío usa `https://rpc-amoy.polygon.technology`.

### Tarea en Gelato (Polygon Amoy)

En [app.gelato.network](https://app.gelato.network):

1. Crea una tarea y elige la red **Polygon Amoy** (chainId 80002).
2. Contrato: la dirección de `LyraAutonomousAgent` que imprimió el deploy.
3. Función: `executeStrategy()`. No recibe argumentos.
4. Trigger de tiempo: cada **10 minutos** (600 segundos). El contrato igual exige `block.timestamp > lastExecutionTime + 10 minutes`.
5. Si usas resolver: el resolver es **el mismo contrato**, función `checker()`. Devuelve `(bool canExec, bytes execPayload)`. `execPayload` ya trae `abi.encodeCall(executeStrategy, ())`. Gelato debe ejecutar solo cuando `canExec` es true (pasaron 10 minutos y hay saldo USDC).
6. Activa **dedicated msg.sender**. Esa dirección no está en este repo: Gelato la muestra en el dashboard al crear la tarea y cambia según la red. Cópiala de ahí. El contrato hoy no la exige; cualquiera puede llamar `executeStrategy()`.
7. Fondea **1Balance** en esa misma pantalla, con el token y la cantidad que indique Gelato para Amoy. La dirección del contrato de 1Balance se copia del dashboard al crear la tarea; no la inventamos aquí.
