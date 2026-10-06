import { isAddress } from "viem";

/** Polygon Amoy. La UI no cambia de red. */
export const AMOY_CHAIN_ID = 80002;

export const AMOY_PUBLIC_RPC_URL = "https://rpc-amoy.polygon.technology";

export const strategyExecutedEvent = {
  type: "event",
  name: "StrategyExecuted",
  inputs: [
    { name: "agent", type: "address", indexed: true },
    { name: "action", type: "string", indexed: false },
    { name: "asset", type: "string", indexed: false },
    { name: "amountIn", type: "uint256", indexed: false },
    { name: "amountOut", type: "uint256", indexed: false },
    { name: "timestamp", type: "uint256", indexed: false },
  ],
} as const;

export const lyraAutonomousAgentAbi = [strategyExecutedEvent] as const;

export function lyraRpcUrl(): string {
  const configured = process.env.NEXT_PUBLIC_LYRA_RPC_URL?.trim();
  return configured || AMOY_PUBLIC_RPC_URL;
}

/** Dirección pública del agente. Vacío o inválido = pantalla sin contrato. */
export function lyraAutonomousAgentAddress(): `0x${string}` | null {
  const raw = process.env.NEXT_PUBLIC_LYRA_AUTONOMOUS_AGENT_ADDRESS?.trim();
  if (!raw || !isAddress(raw)) return null;
  return raw;
}
