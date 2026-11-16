import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { listSearchExplore, searchPlatform } from "@/lib/search";
import { PriceTag } from "@/components/ui/PriceTag";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { resolveDisplayFxUsdMxn } from "@/lib/commerce/display-fx";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const fxRate = resolveDisplayFxUsdMxn();
  const explore = q.length === 0 ? await listSearchExplore().catch(() => null) : null;
  const results = q.length >= 2 ? await searchPlatform(q) : { creators: [], products: [], videos: [] };
  const empty = q.length >= 2 && !results.creators.length && !results.products.length && !results.videos.length;

  return (
    <PlatformShell title="Buscar">
      <p className="page-kicker">Descubrir</p>
      <h1 className="page-title font-display">Buscar</h1>
      <form action="/search" method="get" className="mt-6">
        <label className="sr-only" htmlFor="search-q">
          Buscar creador, curso o video
        </label>
        <input
          id="search-q"
          name="q"
          defaultValue={q}
          placeholder="Creador, curso o video…"
          className="w-full rounded-full border border-klik-line bg-klik-card px-5 py-3 text-sm outline-none ring-klik-green focus:ring-2"
        />
      </form>

      {explore && q.length === 0 ? (
        <div className="mt-8 space-y-10">
          {explore.suggestions.length ? (
            <section>
              <h2 className="font-display text-lg font-bold">Sugerencias</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {explore.suggestions.map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="rounded-full border border-klik-line bg-klik-card px-4 py-2 text-sm font-medium hover:border-klik-green/40"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          <ExploreResults
            title="En tendencia"
            creators={explore.creators}
            products={explore.products}
            videos={explore.videos}
            fxRate={fxRate}
            empty="Cuando haya creadores y cursos publicados, aparecerán aquí."
          />
        </div>
      ) : null}

      {q.length > 0 && q.length < 2 ? (
        <p className="mt-6 text-sm text-foreground/50">Escribe al menos 2 caracteres.</p>
      ) : null}

      {empty ? <p className="mt-6 text-sm text-foreground/50">Nada coincide con «{q}».</p> : null}

      {q.length >= 2 ? (
        <div className="mt-8">
          <ExploreResults
            title="Resultados"
            creators={results.creators}
            products={results.products}
            videos={results.videos}
            fxRate={fxRate}
          />
        </div>
      ) : null}
    </PlatformShell>
  );
}

function ExploreResults({
  title,
  creators,
  products,
  videos,
  fxRate,
  empty,
}: {
  title: string;
  creators: Awaited<ReturnType<typeof searchPlatform>>["creators"];
  products: Awaited<ReturnType<typeof searchPlatform>>["products"];
  videos: Awaited<ReturnType<typeof searchPlatform>>["videos"];
  fxRate: number;
  empty?: string;
}) {
  if (!creators.length && !products.length && !videos.length) {
    return empty ? <p className="text-sm text-foreground/50">{empty}</p> : null;
  }

  return (
    <div className="space-y-10">
      {creators.length > 0 ? (
        <section>
          <h2 className="font-display text-lg font-bold">{title === "Resultados" ? "Creadores" : "Creadores en tendencia"}</h2>
          <ul className="mt-4 space-y-2">
            {creators.map((creator) => (
              <li key={creator.username}>
                <Link
                  href={`/u/${creator.username}`}
                  className="flex items-center gap-3 rounded-2xl border border-klik-line bg-klik-card px-4 py-3 hover:border-klik-green/40"
                >
                  {creator.image ? (
                    <span className="relative h-10 w-10 overflow-hidden rounded-full">
                      <RemoteImage src={creator.image} alt="" className="object-cover" sizes="40px" />
                    </span>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-sm font-bold">
                      {creator.displayName.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{creator.displayName}</p>
                    <p className="text-xs text-foreground/45">@{creator.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {products.length > 0 ? (
        <section>
          <h2 className="font-display text-lg font-bold">Cursos y productos</h2>
          <ul className="mt-4 space-y-2">
            {products.map((product) => (
              <li key={product.slug}>
                <Link
                  href={`/c/${product.slug}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-klik-line bg-klik-card px-4 py-3 hover:border-klik-green/40"
                >
                  <div>
                    <p className="font-semibold">{product.title}</p>
                    <p className="text-xs text-foreground/45">Por {product.creatorName}</p>
                  </div>
                  <PriceTag amount={product.price} currency={product.currency} fx={fxRate} size="sm" compact align="right" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {videos.length > 0 ? (
        <section>
          <h2 className="font-display text-lg font-bold">Videos</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {videos.map((video) => (
              <li key={video.id}>
                <Link
                  href={video.lane === "PLAY" ? `/play?v=${video.id}` : `/feed?v=${video.id}`}
                  className="block overflow-hidden rounded-2xl border border-klik-line bg-klik-card"
                >
                  {video.thumbnailUrl ? (
                    <span className="relative block aspect-[9/14]">
                      <RemoteImage src={video.thumbnailUrl} alt={video.title} className="object-contain object-center" />
                    </span>
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
    </div>
  );
}
