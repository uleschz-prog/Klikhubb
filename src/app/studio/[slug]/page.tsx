import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CourseBuilder } from "@/components/studio/CourseBuilder";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { loadStudioCourse } from "@/lib/commerce/studio";
import { isBlobConfigured } from "@/lib/video/types";

export const dynamic = "force-dynamic";

export default async function StudioCoursePage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  const userId = (await getDbUserId()) ?? session?.user?.id ?? null;
  if (!userId) redirect(`/login?callbackUrl=${encodeURIComponent(`/studio/${params.slug}`)}`);

  const course = await loadStudioCourse(userId, params.slug);
  if (!course) notFound();

  return (
    <div>
      <CourseBuilder initial={course} blobEnabled={isBlobConfigured()} />
      <p className="mt-8 text-sm text-white/40">
        ¿Prefieres un clip corto para el feed?{" "}
        <Link href="/publish" className="text-klik-cyan">
          Publicar en Tienda →
        </Link>
      </p>
    </div>
  );
}
