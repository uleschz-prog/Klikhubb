import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { loadConnectStatus } from "@/lib/commerce/stripe-connect";

export type CreatorLaunchProgress = {
  hasAvatar: boolean;
  hasCourse: boolean;
  hasShopVideo: boolean;
  hasPlayVideo: boolean;
  connectLinked: boolean;
};

export async function loadCreatorLaunchProgress(userId: string): Promise<CreatorLaunchProgress> {
  const [courseCount, shopVideos, playVideos, connect, user] = await Promise.all([
    prisma.product.count({
      where: { creatorId: userId, status: "ACTIVE", type: { in: ["COURSE", "MEMBERSHIP", "DIGITAL"] } },
    }),
    prisma.video.count({ where: { creatorId: userId, status: "PUBLISHED", lane: "SHOP" } }),
    prisma.video.count({ where: { creatorId: userId, status: "PUBLISHED", lane: "PLAY" } }),
    loadConnectStatus(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { image: true } }),
  ]);

  return {
    hasAvatar: Boolean(user?.image),
    hasCourse: courseCount > 0,
    hasShopVideo: shopVideos > 0,
    hasPlayVideo: playVideos > 0,
    connectLinked: connect.payoutsEnabled,
  };
}

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  hint: string;
};

export function buildCreatorLaunchChecklist(progress: CreatorLaunchProgress): ChecklistItem[] {
  return [
    {
      id: "avatar",
      label: "Foto de perfil",
      done: progress.hasAvatar,
      href: "/dashboard",
      hint: "Sube tu foto en el dashboard.",
    },
    {
      id: "course",
      label: "Primer curso o producto",
      done: progress.hasCourse,
      href: "/studio/new",
      hint: "Crea tu academia en Studio.",
    },
    {
      id: "shop",
      label: "Video en Tienda con oferta",
      done: progress.hasShopVideo,
      href: "/publish",
      hint: "Publica un clip con botón de compra.",
    },
    {
      id: "play",
      label: "Clip en Play (opcional)",
      done: progress.hasPlayVideo,
      href: "/publish?lane=play",
      hint: "Contenido sin venta para atraer audiencia.",
    },
    {
      id: "connect",
      label: "Cuenta bancaria conectada",
      done: progress.connectLinked,
      href: "/wallet",
      hint: "Conecta Stripe para retiros automáticos.",
    },
  ];
}

export function CreatorLaunchChecklist({ items }: { items: ChecklistItem[] }) {
  const doneCount = items.filter((item) => item.done).length;
  const allDone = doneCount === items.length;

  if (allDone) return null;

  return (
    <section className="mt-6 rounded-2xl border border-klik-cyan/25 bg-klik-cyan/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Lanzamiento</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">Tu checklist de creador</h2>
          <p className="mt-1 text-sm text-white/55">
            {doneCount} de {items.length} listos. Completa los pasos para empezar a vender en beta.
          </p>
        </div>
        <span className="rounded-full bg-klik-cyan/15 px-3 py-1 text-xs font-bold text-klik-cyan">
          {Math.round((doneCount / items.length) * 100)}%
        </span>
      </div>

      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
                item.done
                  ? "border-klik-green/30 bg-klik-green/5"
                  : "border-white/10 bg-black/20 hover:border-klik-cyan/30"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  item.done ? "bg-klik-green text-klik-black" : "border border-white/20 text-white/40"
                }`}
                aria-hidden
              >
                {item.done ? "✓" : ""}
              </span>
              <span>
                <span className={`block text-sm font-semibold ${item.done ? "text-klik-green" : "text-white"}`}>
                  {item.label}
                </span>
                {!item.done ? <span className="mt-0.5 block text-xs text-white/45">{item.hint}</span> : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
