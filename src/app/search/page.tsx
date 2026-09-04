import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { searchPlatform } from "@/lib/search";
import { formatProductPrice } from "@/lib/commerce/billing";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const results = q.length >= 2 ? await searchPlatform(q) : { creators: [], products: [], videos: [] };
  const empty = q.length >= 2 && !results.creators.length && !results.products.length && !results.videos.length;

  return (
    <PlatformShell title="Buscar">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Descubrir</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Buscar</h1>
      <form action="/search" method="get" className="mt-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Creador, curso o video…"
          className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-sm outline-none ring-klik-cyan focus:ring-2"
        />
      </form>

      {q.length > 0 && q.length < 2 ? (
        <p className="mt-6 text-sm text-white/50">Escribe al menos 2 caracteres.</p>
      ) : null}

      {empty ? <p className="mt-6 text-sm text-white/50">Nada coincide con «{q}».</p> : null}

      {results.creators.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold">Creadores</h2>
          <ul className="mt-4 space-y-2">
            {results.creators.map((creator) => (
              <li key={creator.username}>
                <Link
                  href={`/u/${creator.username}`}
                  className="flex items-center gap-3 rounded-2xl border border-klik-line bg-klik-card px-4 py-3 hover:border-klik-cyan/40"
                >
                  {creator.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={creator.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                      {creator.displayName.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{creator.displayName}</p>
                    <p className="text-xs text-white/45">@{creator.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results.products.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold">Cursos y productos</h2>
          <ul className="mt-4 space-y-2">
            {results.products.map((product) => (
              <li key={product.slug}>
                <Link
                  href={`/checkout/${product.slug}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-klik-line bg-klik-card px-4 py-3 hover:border-klik-green/40"
                >
                  <div>
                    <p className="font-semibold">{product.title}</p>
                    <p className="text-xs text-white/45">Por {product.creatorName}</p>
                  </div>
                  <p className="font-display text-sm font-bold text-klik-green">
                    {formatProductPrice(product.price, product.currency)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results.videos.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold">Videos</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {results.videos.map((video) => (
              <li key={video.id}>
                <Link
                  href={video.lane === "PLAY" ? `/play?v=${video.id}` : `/feed?v=${video.id}`}
                  className="block overflow-hidden rounded-2xl border border-white/10"
                >
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.thumbnailUrl} alt="" className="aspect-[9/14] w-full object-cover" />
                  ) : (
                    <div className="aspect-[9/14] bg-gradient-to-br from-neutral-900 to-emerald-950" />
                  )}
                  <p className="line-clamp-2 p-2 text-xs font-semibold">{video.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PlatformShell>
  );
}
