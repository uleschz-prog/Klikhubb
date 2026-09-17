import { PlatformShell } from "@/components/layout/PlatformShell";
import { AdminOpsNav } from "@/components/admin/AdminOpsNav";
import { AdminReleaseNetworkButton, AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { requirePlatformAdminPage } from "@/lib/auth/require-admin";
import { listAdminUsers, loadAdminUsersOverview } from "@/lib/admin/users";
import { formatMoney } from "@/lib/commerce/split";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  await requirePlatformAdminPage();
  const q = searchParams?.q?.trim() ?? "";
  const [overview, users] = await Promise.all([loadAdminUsersOverview(), listAdminUsers(q || undefined)]);

  return (
    <PlatformShell title="Admin">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Operaciones</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Usuarios y red</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/55">
        Solo la cuenta administradora ve este panel. Activa o suspende cuentas y libera las comisiones unilevel de
        Qlyk Academy sin esperar el hold.
      </p>
      <AdminOpsNav current="/admin/users" />

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Usuarios" value={String(overview.users)} />
        <Stat label="Activos" value={String(overview.active)} />
        <Stat label="Suspendidos" value={String(overview.suspended)} />
        <Stat label="Academy activa" value={String(overview.academyActive)} />
        <Stat
          label="Red en hold"
          value={formatMoney(overview.lockedNetwork)}
          detail={`${overview.lockedNetworkCount} comisiones`}
        />
      </section>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <form className="flex min-w-0 flex-1 gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar email, usuario o código"
            className="min-h-11 w-full max-w-md rounded-full border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-klik-cyan/40"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm font-semibold"
          >
            Buscar
          </button>
        </form>
        <AdminReleaseNetworkButton />
      </div>

      {users.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Sin resultados</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">Prueba otro correo, usuario o código de invitación.</p>
        </div>
      ) : (
        <AdminUsersPanel users={users} />
      )}
    </PlatformShell>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card px-4 py-4">
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold">{value}</p>
      {detail ? <p className="mt-1 text-xs text-white/40">{detail}</p> : null}
    </div>
  );
}
