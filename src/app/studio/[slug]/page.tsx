import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { CourseBuilder } from "@/components/studio/CourseBuilder";
import { getDbUserId } from "@/lib/auth/session";
import { loadStudioCourse } from "@/lib/commerce/studio";
import { isBlobConfigured } from "@/lib/video/types";

export const dynamic = "force-dynamic";

export default async function StudioCoursePage({ params }: { params: { slug: string } }) {
  const userId = await getDbUserId();
  if (!userId) redirect(`/login?callbackUrl=${encodeURIComponent(`/studio/${params.slug}`)}`);

  const course = await loadStudioCourse(userId, params.slug);
  if (!course) notFound();

  return (
    <PlatformShell title={course.title}>
      <CourseBuilder initial={course} blobEnabled={isBlobConfigured()} />
      <p className="mt-8 text-sm text-white/40">
        ¿Prefieres un clip corto para el feed?{" "}
        <Link href="/publish" className="text-klik-cyan">
          Publicar en Tienda →
        </Link>
      </p>
    </PlatformShell>
  );
}
