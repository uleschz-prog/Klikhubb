import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { getDbUserId } from "@/lib/auth/session";
import { listStudioCourses } from "@/lib/commerce/studio";
import { formatMoney } from "@/lib/commerce/split";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "A la venta",
  PAUSED: "Pausado",
  ARCHIVED: "Archivado",
};

export default async function StudioPage() {
  const userId = await getDbUserId();
  if (!userId) redirect("/login?callbackUrl=/studio");

  const courses = await listStudioCourses(userId);

  return (
    <PlatformShell title="Studio">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Creador</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">Studio</h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Arma tu academia: módulos, lecciones con video o archivos, y publícala cuando esté lista.
          </p>
        </div>
        <Link
          href="/studio/new"
          className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black"
        >
          Nuevo curso
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Todavía no tienes cursos</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            Crea tu primera academia, sube lecciones y ponla a la venta cuando quieras.
          </p>
          <Link
            href="/studio/new"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
          >
            Crear curso
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {courses.map((course) => (
            <Link
              key={course.slug}
              href={`/studio/${course.slug}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-klik-line bg-klik-card px-5 py-4 transition hover:border-klik-cyan/40"
            >
              <div>
                <p className="font-display text-xs text-klik-green">
                  {STATUS_LABEL[course.status] ?? course.status} · {formatMoney(course.price)}
                </p>
                <h2 className="mt-1 font-display text-lg font-bold">{course.title}</h2>
                <p className="mt-1 text-xs text-white/40">
                  {course.moduleCount} {course.moduleCount === 1 ? "módulo" : "módulos"} ·{" "}
                  {course.lessonCount} {course.lessonCount === 1 ? "lección" : "lecciones"}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-klik-cyan">Editar</span>
            </Link>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
