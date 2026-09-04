import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { BuyButton } from "@/components/commerce/BuyButton";
import { getPublicCreatorByUsername } from "@/lib/profile/public-creator";
import { formatProductPrice } from "@/lib/commerce/billing";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const profile = await getPublicCreatorByUsername(params.username);
  if (!profile) return { title: "Creador no encontrado" };
  const title = `${profile.displayName} (@${profile.username}) · Qlyk`;
  const description = profile.bio || `Cursos y videos de ${profile.displayName} en Qlyk.`;
  return {
    title,
    description,
    openGraph: { title, description, url: `${site.url}/u/${profile.username}` },
    twitter: { title, description },
  };
}

export default async function PublicCreatorPage({ params }: { params: { username: string } }) {
  const profile = await getPublicCreatorByUsername(params.username);
  if (!profile) notFound();

  return (
    <PlatformShell title={`@${profile.username}`}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image}
              alt=""
              className="h-20 w-20 rounded-full object-cover ring-2 ring-klik-cyan/40"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-klik-cyan/30 to-klik-green/20 font-display text-2xl font-bold">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Creador</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold">{profile.displayName}</h1>
            <p className="mt-1 text-sm text-white/50">@{profile.username}</p>
            {profile.bio ? <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">{profile.bio}</p> : null}
            <p className="mt-3 text-xs text-white/40">
              {profile.followerCount} seguidores · {profile.videoCount} videos · {profile.productCount}{" "}
              productos
            </p>
          </div>
        </div>
        <Link
          href={`/feed`}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold"
        >
          Ver en el feed
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Productos</h2>
        {profile.products.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">Aún no hay productos a la venta.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.products.map((product) => (
              <article key={product.slug} className="rounded-2xl border border-klik-line bg-klik-card p-5">
                <p className="text-[11px] uppercase tracking-wider text-white/40">{product.type}</p>
                <h3 className="mt-2 font-display text-lg font-bold">{product.title}</h3>
                {product.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-white/55">{product.description}</p>
                ) : null}
                <p className="mt-4 font-display text-xl font-extrabold text-klik-pastel">
                  {formatProductPrice(product.price, product.currency)}
                </p>
                <div className="mt-4">
                  <BuyButton
                    price={product.price}
                    currency={product.currency}
                    href={`/checkout/${product.slug}`}
                    label="Comprar"
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold">Videos</h2>
        {profile.videos.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">Aún no hay clips publicados.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {profile.videos.map((video) => (
              <Link
                key={video.id}
                href={video.lane === "PLAY" ? `/play?v=${video.id}` : `/feed?v=${video.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-black/40"
              >
                {video.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnailUrl} alt="" className="aspect-[9/14] w-full object-cover" />
                ) : (
                  <div className="aspect-[9/14] bg-gradient-to-br from-emerald-950 to-cyan-950" />
                )}
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold group-hover:text-klik-cyan">{video.title}</p>
                  <p className="mt-1 text-[11px] text-white/40">{video.likeCount} likes</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PlatformShell>
  );
}
