import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PublishVideoForm } from "@/components/video/PublishVideoForm";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { isConnectionError } from "@/lib/demo/store";
import { isBlobConfigured } from "@/lib/video/types";

export const dynamic = "force-dynamic";

export default async function PublishPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/publish");
  }

  let products: { slug: string; title: string }[] = [];
  try {
    products = await prisma.product.findMany({
      where: { creatorId: session.user.id, status: "ACTIVE" },
      select: { slug: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch (error) {
    if (!isConnectionError(error)) throw error;
  }

  return (
    <PlatformShell title="Publicar">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Feed</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Publica el momento</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Vertical, corto, con o sin botón de compra. Queda en el feed de KlikHubb.
      </p>
      <div className="mt-8">
        <PublishVideoForm blobEnabled={isBlobConfigured()} products={products} />
      </div>
    </PlatformShell>
  );
}
