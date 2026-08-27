import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { CommunityWall } from "@/components/community/CommunityWall";
import { getDbUserId } from "@/lib/auth/session";
import { loadCommunity } from "@/lib/community";

export const dynamic = "force-dynamic";

export default async function CommunitySpacePage({ params }: { params: { slug: string } }) {
  const userId = await getDbUserId();
  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/community/${params.slug}`)}`);
  }

  const space = await loadCommunity(userId, params.slug);
  if (space === "not_found") notFound();
  if (space === "forbidden") {
    redirect(`/checkout/${params.slug}`);
  }

  return (
    <PlatformShell title={space.name}>
      <Link href="/community" className="text-sm font-semibold text-klik-cyan hover:underline">
        Volver a Community
      </Link>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
        {space.role === "creator" ? "Tu espacio" : "Miembro"}
        {` · ${space.memberCount} ${space.memberCount === 1 ? "miembro" : "miembros"}`}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{space.name}</h1>
      {space.description ? <p className="mt-2 max-w-2xl text-sm text-white/55">{space.description}</p> : null}
      <CommunityWall slug={space.slug} initialPosts={space.posts} />
    </PlatformShell>
  );
}
