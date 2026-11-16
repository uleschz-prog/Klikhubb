import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { getDbUserId } from "@/lib/auth/session";
import { listMyCommunities } from "@/lib/community";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const userId = await getDbUserId();
  const spaces = userId ? await listMyCommunities(userId) : [];

  return (
    <PlatformShell title="Comunidad">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Comunidad</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Comunidad</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Aquí se queda tu gente. Quien compra tu membresía entra. Tú publicas. Ellos no se evaporan.
      </p>

      {!userId ? (
        <div className="mt-10 rounded-3xl border border-klik-line bg-klik-card px-6 py-14 text-center">
          <p className="page-kicker">Para creadores y su gente</p>
          <h2 className="mt-3 font-display text-2xl font-extrabold">Tu comunidad no se evapora</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-foreground/55">
            Quien compra tu membresía o curso entra aquí. Tú publicas actualizaciones, ellos se quedan y vuelven.
            Sin depender de un algoritmo ni de un chat que desaparece.
          </p>
          <ul className="mx-auto mt-6 grid max-w-xl gap-3 text-left text-sm text-foreground/70 sm:grid-cols-3">
            <li className="rounded-2xl border border-klik-line px-4 py-3">Espacio propio por membresía o curso</li>
            <li className="rounded-2xl border border-klik-line px-4 py-3">Tus posts, tu gente, tu ritmo</li>
            <li className="rounded-2xl border border-klik-line px-4 py-3">El acceso vive en la cuenta, no en el teléfono</li>
          </ul>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold">
              Crear cuenta
            </Link>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent("/community")}`}
              className="inline-flex min-h-11 items-center rounded-full border border-klik-line px-5 text-sm font-semibold"
            >
              Entrar
            </Link>
          </div>
        </div>
      ) : spaces.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Todavía no tienes comunidades</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            Publica una membresía o, en el feed, toca Comprar. Cuando confirmemos tu pago, entras aquí.
          </p>
          <Link
            href="/feed"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black"
          >
            Ir a Tienda
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {spaces.map((space) => (
            <Link
              key={space.slug}
              href={`/community/${space.slug}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-klik-line bg-klik-card px-5 py-4 transition hover:border-klik-cyan/40"
            >
              <div>
                <p className="font-display text-xs text-klik-green">
                  {space.role === "creator" ? "Tu espacio" : "Miembro"}
                  {` · ${space.memberCount} ${space.memberCount === 1 ? "miembro" : "miembros"}`}
                </p>
                <h2 className="mt-1 font-display text-lg font-bold">{space.name}</h2>
                {space.description ? <p className="mt-1 text-sm text-white/50">{space.description}</p> : null}
                {space.lastPost ? (
                  <p className="mt-2 line-clamp-1 text-xs text-white/40">{space.lastPost}</p>
                ) : (
                  <p className="mt-2 text-xs text-white/40">Sin posts todavía</p>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold text-klik-cyan">Entrar</span>
            </Link>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
