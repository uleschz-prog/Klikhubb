import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PublishVideoForm } from "@/components/video/PublishVideoForm";
import { getDbUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { isConnectionError } from "@/lib/demo/store";
import { isBlobConfigured } from "@/lib/video/types";

export const dynamic = "force-dynamic";

export default async function PublishPage({
  searchParams,
}: {
  searchParams: { lane?: string };
}) {
  const userId = await getDbUserId();
  const lane = searchParams.lane === "play" ? "PLAY" : "SHOP";
  if (!userId) {
    redirect(`/login?callbackUrl=${lane === "PLAY" ? "/publish?lane=play" : "/publish"}`);
  }

  let products: { slug: string; title: string }[] = [];
  try {
    products = await prisma.product.findMany({
      where: { creatorId: userId, status: "ACTIVE" },
      select: { slug: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch (error) {
    if (!isConnectionError(error)) throw error;
  }

  return (
    <PlatformShell title={lane === "PLAY" ? "Subir clip" : "Publicar"}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">
        {lane === "PLAY" ? "Play" : "Feed"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        {lane === "PLAY" ? "Sube un clip" : "Publica y vende"}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        {lane === "PLAY"
          ? "Estilo Douyin. Un video corto, swipe, likes. Si quieres vender, marca la casilla."
          : "Un video corto. Un producto. El botón de compra vive dentro del clip. Sube el archivo o pega un YouTube."}
      </p>
      <p className="mt-3 text-sm">
        {lane === "PLAY" ? (
          <Link href="/publish" className="text-klik-cyan">
            ¿Prefieres vender? Publica en Tienda →
          </Link>
        ) : (
          <Link href="/publish?lane=play" className="text-klik-cyan">
            ¿Solo entretenimiento? Súbelo a Play →
          </Link>
        )}
      </p>
      <div className="mt-8">
        <PublishVideoForm blobEnabled={isBlobConfigured()} products={products} lane={lane} />
      </div>
    </PlatformShell>
  );
}
