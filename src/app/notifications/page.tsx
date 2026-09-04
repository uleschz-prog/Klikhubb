import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { getDbUserId } from "@/lib/auth/session";
import { listNotifications, markNotificationsRead } from "@/lib/notifications";
import { formatWalletDate } from "@/lib/commerce/wallet";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const userId = await getDbUserId();
  if (!userId) redirect("/login?callbackUrl=/notifications");

  const items = await listNotifications(userId);
  await markNotificationsRead(userId);

  return (
    <PlatformShell title="Avisos">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Inbox</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Avisos</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Pagos, ventas y actividad de tu cuenta. También te avisamos por email cuando está configurado.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Sin avisos todavía</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            Cuando confirmemos un pago o vendas un curso, aparece aquí.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="block rounded-2xl border border-klik-line bg-klik-card px-5 py-4 hover:border-klik-cyan/30"
                >
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-white/60">{item.body}</p>
                  <p className="mt-2 text-[11px] text-white/35">{formatWalletDate(item.createdAt)}</p>
                </Link>
              ) : (
                <div className="rounded-2xl border border-klik-line bg-klik-card px-5 py-4">
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-white/60">{item.body}</p>
                  <p className="mt-2 text-[11px] text-white/35">{formatWalletDate(item.createdAt)}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </PlatformShell>
  );
}
