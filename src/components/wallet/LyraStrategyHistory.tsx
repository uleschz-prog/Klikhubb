"use client";

import { useEffect, useState } from "react";
import { createPublicClient, formatUnits, http } from "viem";
import { polygonAmoy } from "viem/chains";
import { lyraAutonomousAgentAbi, lyraAutonomousAgentAddress, lyraRpcUrl } from "@/lib/lyra/autonomous-agent";

type TradeRow = {
  id: string;
  action: string;
  asset: string;
  amountIn: bigint;
  amountOut: bigint;
  timestamp: bigint;
};

function toRow(log: {
  transactionHash: `0x${string}` | null;
  logIndex: number | null;
  args: {
    action?: string;
    asset?: string;
    amountIn?: bigint;
    amountOut?: bigint;
    timestamp?: bigint;
  };
}): TradeRow | null {
  if (!log.args.action || !log.args.asset || log.args.amountIn === undefined || log.args.amountOut === undefined) {
    return null;
  }
  const timestamp = log.args.timestamp ?? BigInt(0);
  return {
    id: `${log.transactionHash ?? "tx"}-${log.logIndex ?? 0}`,
    action: log.args.action,
    asset: log.args.asset,
    amountIn: log.args.amountIn,
    amountOut: log.args.amountOut,
    timestamp,
  };
}

function formatUsdc(amount: bigint) {
  const value = Number(formatUnits(amount, 6));
  return `${new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} USDC`;
}

function formatTradeTime(timestamp: bigint) {
  const date = new Date(Number(timestamp) * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(".", "");
}

export function LyraStrategyHistory() {
  const address = lyraAutonomousAgentAddress();
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    const contractAddress: `0x${string}` = address;

    const client = createPublicClient({
      chain: polygonAmoy,
      transport: http(lyraRpcUrl()),
      pollingInterval: 2_000,
    });
    let unwatch: (() => void) | undefined;
    let cancelled = false;

    function merge(incoming: TradeRow[]) {
      setTrades((current) => {
        const seen = new Set(current.map((row) => row.id));
        const fresh = incoming.filter((row) => !seen.has(row.id));
        if (fresh.length === 0) return current;
        return [...fresh, ...current].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
      });
    }

    async function readHistory() {
      try {
        return await client.getContractEvents({
          address: contractAddress,
          abi: lyraAutonomousAgentAbi,
          eventName: "StrategyExecuted",
          fromBlock: BigInt(0),
          toBlock: "latest",
        });
      } catch {
        const latest = await client.getBlockNumber();
        const window = BigInt(50000);
        const fromBlock = latest > window ? latest - window : BigInt(0);
        return client.getContractEvents({
          address: contractAddress,
          abi: lyraAutonomousAgentAbi,
          eventName: "StrategyExecuted",
          fromBlock,
          toBlock: "latest",
        });
      }
    }

    async function start() {
      try {
        const logs = await readHistory();
        if (cancelled) return;
        merge(logs.map(toRow).filter((row): row is TradeRow => row !== null));
        unwatch = client.watchContractEvent({
          address: contractAddress,
          abi: lyraAutonomousAgentAbi,
          eventName: "StrategyExecuted",
          onLogs(logs) {
            merge(logs.map(toRow).filter((row): row is TradeRow => row !== null));
          },
          onError(watchError) {
            setError(watchError.message);
          },
        });
        if (!cancelled) setListening(true);
      } catch (readError) {
        if (!cancelled) {
          setError(readError instanceof Error ? readError.message : "No se pudo leer la red");
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      unwatch?.();
    };
  }, [address]);

  return (
    <div className="mt-6 rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Agente</p>
          <h2 className="mt-1 font-display text-xl font-bold">Trades del agente</h2>
        </div>
        {address && listening ? (
          <p className="text-xs font-semibold text-klik-green">En vivo</p>
        ) : null}
      </div>

      {!address ? (
        <p className="mt-3 text-sm text-white/55">Sin contrato configurado.</p>
      ) : error && trades.length === 0 ? (
        <p className="mt-3 text-sm text-white/55">No se pudo leer la red. Revisa la dirección y el RPC.</p>
      ) : trades.length === 0 ? (
        <p className="mt-3 text-sm text-white/55">
          Todavía no hay trades. Cuando el keeper ejecute la estrategia, aparecen aquí.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {trades.map((trade) => (
            <li
              key={trade.id}
              className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-semibold">
                  {trade.action} · {trade.asset}
                </p>
                <p className="text-xs text-white/40">{formatTradeTime(trade.timestamp)}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-sm font-bold text-white/70">{formatUsdc(trade.amountIn)}</p>
                <p className="font-display text-sm font-bold text-klik-green">{formatUsdc(trade.amountOut)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
