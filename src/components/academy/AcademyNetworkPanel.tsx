"use client";

import { useState } from "react";
import type { AcademyNetworkSummary } from "@/lib/academy/network-tree";
import { formatMoney } from "@/lib/commerce/split";

export function AcademyNetworkPanel({
  inviteUrl,
  referralCode,
  network,
}: {
  inviteUrl: string;
  referralCode: string;
  network: AcademyNetworkSummary;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-3xl border border-klik-line bg-klik-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Tu enlace</p>
        <p className="mt-2 font-display text-2xl font-extrabold">{referralCode}</p>
        <p className="mt-2 break-all text-sm text-white/55">{inviteUrl}</p>
        <button
          type="button"
          onClick={() => void copy()}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
        >
          {copied ? "Copiado" : "Copiar invitación"}
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Directos" value={String(network.directs)} />
        <Stat label="Red (8 niveles)" value={String(network.networkSize)} />
        <Stat label="Activos" value={String(network.activeInNetwork)} />
        <Stat label="Ganado" value={formatMoney(network.earnedUnilevel)} />
        <Stat label="En espera" value={formatMoney(network.pendingUnilevel)} />
        <Stat label="Tu tramo" value="60% en red" />
      </section>

      <section className="space-y-3">
        {network.levels.map((level) => (
          <article key={level.level} className="rounded-2xl border border-klik-line bg-klik-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-lg font-bold">
                Nivel {level.level}
                <span className="ml-2 text-sm font-semibold text-klik-cyan">{Math.round(level.rate * 100)}%</span>
              </p>
              <p className="text-sm text-white/45">
                {level.activeMembers}/{level.members} activos
              </p>
            </div>
            {level.users.length ? (
              <ul className="mt-3 space-y-1 text-sm text-white/70">
                {level.users.map((user) => (
                  <li key={user.id} className="flex justify-between gap-3">
                    <span>
                      {user.name}
                      {user.username ? ` · @${user.username}` : ""}
                    </span>
                    <span className={user.active ? "text-klik-green" : "text-white/35"}>
                      {user.active ? "Activo" : "Inactivo"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-white/40">Todavía no hay nadie en este nivel.</p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}
