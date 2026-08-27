import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { AcademyPlayer } from "@/components/academy/AcademyPlayer";
import { getDbUserId } from "@/lib/auth/session";
import { loadAcademyCourse, markLessonProgress } from "@/lib/commerce/academy";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Academia",
  MEMBERSHIP: "Membresía",
  DIGITAL: "Digital",
  PHYSICAL: "Físico",
};

export default async function AcademyCoursePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { l?: string };
}) {
  const userId = await getDbUserId();
  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/academy/${params.slug}`)}`);
  }

  const course = await loadAcademyCourse(userId, params.slug);
  if (course === "not_found") notFound();
  if (course === "forbidden") {
    redirect(`/checkout/${params.slug}`);
  }

  const selected =
    course.lessons.find((lesson) => lesson.id === searchParams.l) ?? course.lessons[0] ?? null;
  const selectedIndex = selected ? course.lessons.findIndex((lesson) => lesson.id === selected.id) : -1;

  if (selected && selectedIndex >= 0) {
    await markLessonProgress(userId, course.productId, selectedIndex, course.lessons.length).catch(() => undefined);
  }

  return (
    <PlatformShell title={course.title}>
      <Link href="/academy" className="text-sm font-semibold text-klik-cyan hover:underline">
        Volver a Academy
      </Link>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
        {TYPE_LABEL[course.type] ?? course.type}
        {course.role === "creator" ? " · Tu curso" : " · Tuyo"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{course.title}</h1>
      {course.description ? <p className="mt-2 max-w-2xl text-sm text-white/55">{course.description}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {selected ? (
            <AcademyPlayer
              title={selected.title}
              videoUrl={selected.videoUrl}
              thumbnailUrl={selected.thumbnailUrl}
              content={selected.content}
              resourceUrl={selected.resourceUrl}
              resourceName={selected.resourceName}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-klik-line bg-klik-card px-6 text-center">
              <div>
                <p className="font-display text-xl font-bold">Aún no hay lecciones</p>
                <p className="mt-2 text-sm text-white/50">
                  {course.role === "creator"
                    ? "Abre el Studio y agrega módulos, videos o archivos."
                    : "El creador todavía no subió el contenido. En cuanto lo haga, lo ves aquí."}
                </p>
                {course.role === "creator" ? (
                  <Link
                    href={`/studio/${course.slug}`}
                    className="mt-5 inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
                  >
                    Abrir Studio
                  </Link>
                ) : null}
              </div>
            </div>
          )}
          {selected ? (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40">{selected.moduleTitle}</p>
              <h2 className="mt-1 font-display text-xl font-bold">{selected.title}</h2>
            </div>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-klik-line bg-klik-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Lecciones</p>
          {course.lessons.length === 0 ? (
            <p className="mt-3 text-sm text-white/50">Todavía no hay nada que ver.</p>
          ) : (
            <ol className="mt-3 space-y-1">
              {course.lessons.map((lesson, index) => {
                const active = selected?.id === lesson.id;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/academy/${course.slug}?l=${lesson.id}`}
                      className={`flex items-start gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        active ? "bg-klik-cyan/15 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className={`mt-0.5 font-display text-xs ${active ? "text-klik-cyan" : "text-white/35"}`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <span className="font-semibold leading-5">{lesson.title}</span>
                        {lesson.isFreePreview ? (
                          <span className="mt-1 block text-[10px] uppercase tracking-wider text-klik-green">
                            Preview
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>
      </div>
    </PlatformShell>
  );
}
