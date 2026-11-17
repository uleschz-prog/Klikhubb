import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PriceTag } from "@/components/ui/PriceTag";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDbUserId } from "@/lib/auth/session";
import { listMyCourses, listPublicCatalog } from "@/lib/commerce/catalog";
import { courseWatchHref } from "@/lib/commerce/course";
import { resolveDisplayFxUsdMxn } from "@/lib/commerce/display-fx";

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Curso",
  MEMBERSHIP: "Membresía",
  DIGITAL: "Digital",
  PHYSICAL: "Físico",
};

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const userId = await getDbUserId();
  const fxRate = resolveDisplayFxUsdMxn();
  const [enrollments, catalog] = await Promise.all([
    userId ? listMyCourses(userId) : Promise.resolve([]),
    listPublicCatalog().catch(() => []),
  ]);

  return (
    <PlatformShell title="Cursos">
      <p className="page-kicker">Catálogo</p>
      <h1 className="page-title font-display">Cursos</h1>
      <p className="page-lead">
        Explora lo que publican los creadores en Qlyk. Entras, ves el preview y, si te gusta, lo compras.
      </p>

      {userId ? (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">Tus cursos</h2>
              <p className="mt-1 text-sm text-foreground/55">Lo que ya pagaste o lo que tú publicaste.</p>
            </div>
            <Link href="/studio" className="btn-primary inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold">
              Crear curso
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/50">Todavía no tienes cursos en tu cuenta.</p>
          ) : (
            <div className="mt-4 space-y-3">
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
                      <h3 className="mt-1 font-display text-lg font-bold">
                        <Link href={href} className="hover:text-klik-green">
                          {course.title}
                        </Link>
                      </h3>
                      {course.description ? <p className="mt-1 text-sm text-foreground/50">{course.description}</p> : null}
                    </div>
                    <Link href={href} className="btn-primary inline-flex min-h-11 shrink-0 items-center rounded-full px-5 text-sm font-bold">
                      {cta}
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">{userId ? "Explorar catálogo" : "Cursos a la venta"}</h2>
        {catalog.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              kicker="Próximamente"
              title="Aún no hay cursos publicados"
              body="Cuando un creador publique su primer curso, aparecerá aquí. Si quieres ser de los primeros, crea tu cuenta y súbelo."
              actionHref="/register"
              actionLabel="Crear cuenta"
              secondaryHref="/studio"
              secondaryLabel="Ir a Studio"
            />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((item) => (
              <Link
                key={item.slug}
                href={`/c/${item.slug}`}
                className="flex h-full flex-col rounded-2xl border border-klik-line bg-klik-card p-5 transition hover:-translate-y-0.5 hover:border-klik-green/40"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-klik-green">
                  {TYPE_LABEL[item.type] ?? item.type}
                </p>
                <h3 className="mt-2 font-display text-lg font-bold leading-snug">{item.title}</h3>
                <p className="mt-1 text-sm text-foreground/50">
                  {item.creatorUsername ? `@${item.creatorUsername}` : item.creatorName}
                </p>
                {item.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground/60">{item.description}</p>
                ) : null}
                <div className="mt-auto pt-4">
                  <PriceTag amount={item.price} currency={item.currency} fx={fxRate} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PlatformShell>
  );
}
