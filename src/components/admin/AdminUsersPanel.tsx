"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/commerce/split";
import type { AdminUserRow } from "@/lib/admin/users";

function statusCopy(status: string) {
  if (status === "ACTIVE") return "Activo";
  if (status === "SUSPENDED") return "Suspendido";
  if (status === "BANNED") return "Bloqueado";
  if (status === "PENDING") return "Pendiente";
  return status;
}

export function AdminUsersPanel({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function act(body: Record<string, string>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(`${body.action}:${body.userId ?? "all"}`);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        released?: number;
        amount?: number;
      } | null;
      if (!response.ok) {
        setError(payload?.error ?? "No se pudo completar.");
        return;
      }
      if (typeof payload?.released === "number") {
        setMessage(
          payload.released
            ? `Se liberaron ${payload.released} comisiones (${formatMoney(payload.amount ?? 0)}).`
            : "No había comisiones de red pendientes.",
        );
      }
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-8">
      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-klik-cyan">{message}</p> : null}

      <div className="space-y-3">
        {users.map((user) => {
          const label = user.displayName || user.username || user.email || user.id.slice(0, 8);
          const canToggle = !user.isAdmin;
          const deactivated = user.status === "SUSPENDED" || user.status === "BANNED";
          return (
            <article key={user.id} className="rounded-2xl border border-klik-line bg-klik-card px-5 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-display text-lg font-bold">{label}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {user.email ?? "sin email"} · @{user.username ?? "—"} · {user.referralCode}
                    {user.sponsorCode ? ` · invitado por ${user.sponsorCode}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className={`rounded-full px-2.5 py-1 ${deactivated ? "bg-amber-400/15 text-amber-100" : "bg-klik-green/15 text-klik-green"}`}>
                      {statusCopy(user.status)}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/60">
                      {user.invitedCount} invitados
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/60">
                      Monedero {formatMoney(user.walletAvailable)} · hold {formatMoney(user.walletPending)}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/60">
                      Red pendiente {formatMoney(user.lockedNetwork)} ({user.lockedNetworkCount})
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canToggle ? (
                    deactivated ? (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void act({ action: "activate", userId: user.id })}
                        className="inline-flex min-h-10 items-center rounded-full bg-klik-green px-4 text-sm font-bold text-klik-black disabled:opacity-50"
                      >
                        {busy === `activate:${user.id}` ? "Activando…" : "Activar"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() =>
                          void act(
                            { action: "deactivate", userId: user.id },
                            `¿Suspender a ${label}? No podrá entrar hasta que lo actives otra vez.`,
                          )
                        }
                        className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold disabled:opacity-50"
                      >
                        {busy === `deactivate:${user.id}` ? "Suspendiendo…" : "Desactivar"}
                      </button>
                    )
                  ) : (
                    <span className="inline-flex min-h-10 items-center text-xs text-white/35">Cuenta administradora</span>
                  )}
                  <button
                    type="button"
                    disabled={busy !== null || user.lockedNetworkCount === 0}
                    onClick={() => void act({ action: "releaseUser", userId: user.id })}
                    className="inline-flex min-h-10 items-center rounded-full border border-klik-cyan/30 px-4 text-sm font-semibold text-klik-cyan disabled:opacity-40"
                  >
                    {busy === `releaseUser:${user.id}` ? "Liberando…" : "Liberar red"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function AdminReleaseNetworkButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function releaseAll() {
    if (!window.confirm("¿Liberar ahora todas las comisiones unilevel en hold?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "releaseNetwork" }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        released?: number;
        amount?: number;
      } | null;
      if (!response.ok) {
        setError(payload?.error ?? "No se pudo liberar.");
        return;
      }
      setMessage(
        payload?.released
          ? `Se liberaron ${payload.released} comisiones (${formatMoney(payload.amount ?? 0)}).`
          : "No había comisiones de red pendientes.",
      );
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void releaseAll()}
        className="inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black disabled:opacity-50"
      >
        {busy ? "Liberando…" : "Liberar comisiones de la red"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-klik-cyan">{message}</p> : null}
    </div>
  );
}
