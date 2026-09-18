import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { getDbUserId } from "@/lib/auth/session";
import { listMyCourses } from "@/lib/commerce/catalog";
import { courseWatchHref } from "@/lib/commerce/course";

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Curso",
  MEMBERSHIP: "Membresía",
  DIGITAL: "Digital",
  PHYSICAL: "Físico",
};

export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const userId = await getDbUserId();
  const enrollments = userId ? await listMyCourses(userId) : [];

  return (
    <PlatformShell title="Mis cursos">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Cursos</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Mis cursos</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Lecciones de lo que ya pagaste o de lo que tú publicaste.
      </p>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        {userId ? (
          <Link
            href="/studio"
            className="inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
          >
            Crear curso
          </Link>
        ) : null}
      </div>

      {!userId ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Entra para ver tus cursos</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            El acceso se guarda en tu cuenta, no en el teléfono.
          </p>
          <Link
            href="/login?callbackUrl=/cursos"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black"
          >
            Entrar
          </Link>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Todavía no tienes cursos</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            En Tienda toca Comprar. Cuando confirmemos el pago (tarjeta o SPEI), el curso aparece aquí.
          </p>
          <Link
            href="/feed"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black"
          >
            Ir a Tienda
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {enrollments.map((course) => {
            const href = courseWatchHref(course.slug, course.resumeLessonId);
            const cta =
              course.role === "creator"
                ? "Ver curso"
                : course.resumeLessonId || course.progressPct > 0
                  ? "Continuar"
                  : "Empezar";
            return (
              <article
                key={`${course.role}-${course.slug}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-klik-line bg-klik-card px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs text-klik-green">
                    {TYPE_LABEL[course.type] ?? course.type}
                    {course.role === "creator" ? " · Tu curso" : " · Acceso activo"}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-bold">
                    <Link href={href} className="hover:text-klik-cyan">
                      {course.title}
                    </Link>
                  </h2>
                  {course.description ? <p className="mt-1 text-sm text-white/50">{course.description}</p> : null}
                  <p className="mt-2 text-xs text-white/40">
                    {course.lessonCount === 0
                      ? "Sin lecciones todavía"
                      : `${course.lessonCount} ${course.lessonCount === 1 ? "lección" : "lecciones"}`}
                    {course.role === "student" && course.progressPct > 0
                      ? ` · ${Math.round(course.progressPct)}% visto`
                      : ""}
                    {course.role === "student" && course.resumeLessonTitle
                      ? ` · Sigues en ${course.resumeLessonTitle}`
                      : ""}
                  </p>
                  {course.role === "student" && course.lessonCount > 0 ? (
                    <div className="mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-klik-cyan"
                        style={{ width: `${Math.min(100, Math.max(0, course.progressPct))}%` }}
                      />
                    </div>
                  ) : null}
                </div>
                <Link
                  href={href}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
                >
                  {cta}
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </PlatformShell>
  );
}
