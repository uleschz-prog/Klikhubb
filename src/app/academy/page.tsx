import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { getDbUserId } from "@/lib/auth/session";
import { listMyAcademy } from "@/lib/commerce/catalog";

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Academia",
  MEMBERSHIP: "Membresía",
  DIGITAL: "Digital",
  PHYSICAL: "Físico",
};

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const userId = await getDbUserId();
  const enrollments = userId ? await listMyAcademy(userId) : [];

  return (
    <PlatformShell title="Academy">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Educación</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">Academy</h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            El video te descubre. La academia te queda. Entra y ves las lecciones de lo que ya pagaste o de lo
            que tú publicaste.
          </p>
        </div>
        {userId ? (
          <Link
            href="/studio"
            className="inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
          >
            Abrir Studio
          </Link>
        ) : null}
      </div>

      {!userId ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Entra para ver tu academy</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            El acceso se guarda en tu cuenta, no en el teléfono.
          </p>
          <Link
            href="/login?callbackUrl=/academy"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black"
          >
            Entrar
          </Link>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Todavía no tienes academias</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            En el feed, toca Llevar. Cuando Stripe confirma el pago, el curso aparece aquí.
          </p>
          <Link
            href="/feed"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black"
          >
            Ir al feed
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {enrollments.map((course) => (
            <Link
              key={course.slug}
              href={`/academy/${course.slug}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-klik-line bg-klik-card px-5 py-4 transition hover:border-klik-cyan/40"
            >
              <div>
                <p className="font-display text-xs text-klik-green">
                  {TYPE_LABEL[course.type] ?? course.type}
                  {course.role === "creator" ? " · Tu curso" : " · Acceso activo"}
                </p>
                <h2 className="mt-1 font-display text-lg font-bold">{course.title}</h2>
                {course.description ? <p className="mt-1 text-sm text-white/50">{course.description}</p> : null}
                <p className="mt-2 text-xs text-white/40">
                  {course.lessonCount === 0
                    ? "Sin lecciones todavía"
                    : `${course.lessonCount} ${course.lessonCount === 1 ? "lección" : "lecciones"}`}
                  {course.role === "student" && course.progressPct > 0
                    ? ` · ${Math.round(course.progressPct)}% visto`
                    : ""}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-klik-cyan">Ver</span>
            </Link>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
