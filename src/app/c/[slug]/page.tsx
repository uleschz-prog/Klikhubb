import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { CoursePlayer } from "@/components/course/CoursePlayer";
import { BuyButton } from "@/components/commerce/BuyButton";
import { CourseReviewForm } from "@/components/course/CourseReviewForm";
import { getDbUserId } from "@/lib/auth/session";
import { groupLessonsByModule, loadPublicCourse } from "@/lib/commerce/public-course";
import { formatProductPrice } from "@/lib/commerce/billing";
import { courseWatchHref } from "@/lib/commerce/course";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Curso",
  MEMBERSHIP: "Membresía",
  DIGITAL: "Digital",
  PHYSICAL: "Físico",
};

function formatAverage(value: number) {
  if (!value) return "Sin calificar";
  return `${value.toFixed(1).replace(".", ",")} de 5`;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const userId = await getDbUserId();
  const course = await loadPublicCourse(params.slug, userId);
  if (!course) return { title: "Curso no encontrado" };
  const title = `${course.title} · Qlyk`;
  const description = course.description || `Curso de ${course.creatorName} en Qlyk.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${site.url}/c/${course.slug}`,
      images: [{ url: `${site.url}/c/${course.slug}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicCoursePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { l?: string };
}) {
  const userId = await getDbUserId();
  const course = await loadPublicCourse(params.slug, userId);
  if (!course) notFound();

  const previewLessons = course.lessons.filter((lesson) => lesson.isFreePreview);
  const requested = course.lessons.find((lesson) => lesson.id === searchParams.l) ?? null;
  const selected = requested?.isFreePreview ? requested : requested ? null : previewLessons[0] ?? null;
  const lockedSelected = requested && !requested.isFreePreview ? requested : null;
  const modules = groupLessonsByModule(course.lessons);
  const checkoutHref = `/checkout/${course.slug}`;
  const learnHref = courseWatchHref(course.slug);
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/c/${course.slug}`)}`;

  return (
    <PlatformShell title={course.title}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">
        {TYPE_LABEL[course.type] ?? course.type}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{course.title}</h1>
      <p className="mt-2 text-sm text-white/55">
        Por{" "}
        {course.creatorUsername ? (
          <Link href={`/u/${course.creatorUsername}`} className="text-klik-cyan hover:underline">
            {course.creatorName}
          </Link>
        ) : (
          course.creatorName
        )}
        {course.reviews.count > 0
          ? ` · ${formatAverage(course.reviews.average)} (${course.reviews.count})`
          : " · Aún sin opiniones"}
      </p>
      {course.description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">{course.description}</p> : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {course.access === "student" ? (
          <Link
            href={learnHref}
            className="inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
          >
            Continuar
          </Link>
        ) : course.access === "creator" ? (
          <Link
            href={`/studio/${course.slug}`}
            className="inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
          >
            Abrir Studio
          </Link>
        ) : (
          <BuyButton href={checkoutHref} price={course.price} currency={course.currency} label="Comprar" className="w-auto min-w-[240px]" />
        )}
        {course.access === "guest" && !userId ? (
          <Link href={loginHref} className="text-sm font-semibold text-white/50 hover:text-white">
            Ya lo compré — entrar
          </Link>
        ) : null}
        <p className="text-sm text-white/40">
          {course.lessonCount} {course.lessonCount === 1 ? "lección" : "lecciones"}
          {course.previewCount > 0 ? ` · ${course.previewCount} preview gratis` : ""}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {selected ? (
            <>
              <CoursePlayer
                title={selected.title}
                videoUrl={selected.videoUrl}
                thumbnailUrl={selected.thumbnailUrl}
                content={selected.content}
              />
              <p className="mt-3 text-[11px] uppercase tracking-wider text-white/40">Preview gratis</p>
              <h2 className="mt-1 font-display text-xl font-bold">{selected.title}</h2>
            </>
          ) : lockedSelected ? (
            <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-klik-line bg-klik-card px-6 text-center">
              <p className="font-display text-xl font-bold">Esta lección es del curso</p>
              <p className="mt-2 max-w-md text-sm text-white/50">
                {lockedSelected.title}. Cómpralo y la ves completa en el curso.
              </p>
              {course.access === "student" ? (
                <Link
                  href={courseWatchHref(course.slug, lockedSelected.id)}
                  className="mt-5 inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
                >
                  Ver el curso
                </Link>
              ) : (
                <Link
                  href={checkoutHref}
                  className="mt-5 inline-flex min-h-11 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black"
                >
                  Comprar {formatProductPrice(course.price, course.currency)}
                </Link>
              )}
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-klik-line bg-klik-card px-6 text-center">
              {course.lessonCount === 0 ? (
                <>
                  <p className="font-display text-xl font-bold">
                    {course.access === "creator" ? "Sube la primera lección" : "Todavía no hay lecciones"}
                  </p>
                  <p className="mt-2 max-w-md text-sm text-white/50">
                    {course.access === "creator"
                      ? "En Studio agrega un módulo, sube un video y márcalo Preview gratis. Así se ve esta ficha cuando la compartes."
                      : "El creador todavía no subió el contenido. En cuanto lo haga, el preview aparece aquí."}
                  </p>
                  {course.access === "creator" ? (
                    <Link
                      href={`/studio/${course.slug}`}
                      className="mt-5 inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
                    >
                      Ir a Studio
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="font-display text-xl font-bold">
                    {course.access === "creator" ? "Marca un preview gratis" : "Este curso aún no tiene preview"}
                  </p>
                  <p className="mt-2 max-w-md text-sm text-white/50">
                    {course.access === "creator"
                      ? "El temario ya está. En Studio, en la primera lección toca Preview para que la gente la pruebe sin pagar."
                      : "El temario de la derecha te dice qué incluye. Compra para verlo completo."}
                  </p>
                  {course.access === "creator" ? (
                    <Link
                      href={`/studio/${course.slug}`}
                      className="mt-5 inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black"
                    >
                      Ir a Studio
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-klik-line bg-klik-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Temario</p>
          {course.lessons.length === 0 ? (
            <p className="mt-3 text-sm text-white/50">
              {course.access === "creator"
                ? "Nadie ve lecciones aquí hasta que subas la primera en Studio."
                : "Aún no hay lecciones."}
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {modules.map((module, moduleIndex) => (
                <div key={`${moduleIndex}-${module.title}`}>
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-klik-cyan/80">
                    {module.title}
                  </p>
                  <ol className="mt-2 space-y-1">
                    {module.lessons.map((lesson) => {
                      const active = selected?.id === lesson.id || lockedSelected?.id === lesson.id;
                      const href = `/c/${course.slug}?l=${encodeURIComponent(lesson.id)}`;
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={href}
                            className={`flex items-start gap-3 rounded-xl px-3 py-3 text-sm transition ${
                              active
                                ? "bg-klik-cyan/15 text-white"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span className="mt-0.5 w-4 shrink-0 text-xs text-white/35" aria-hidden>
                              {lesson.isFreePreview ? "▷" : "🔒"}
                            </span>
                            <span>
                              <span className="font-semibold leading-5">{lesson.title}</span>
                              {lesson.isFreePreview ? (
                                <span className="mt-1 block text-[10px] uppercase tracking-wider text-klik-green">
                                  Preview
                                </span>
                              ) : (
                                <span className="mt-1 block text-[10px] uppercase tracking-wider text-white/35">
                                  En el curso
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <section className="mt-10 max-w-2xl">
        <h2 className="font-display text-xl font-bold">Opiniones</h2>
        <p className="mt-2 text-sm text-white/50">
          {course.reviews.count === 0
            ? "Todavía nadie calificó. Cuando un alumno compra y ve, puede dejar estrellas aquí."
            : formatAverage(course.reviews.average)}
        </p>
        {course.access === "student" ? (
          <div className="mt-5">
            <CourseReviewForm
              slug={course.slug}
              initialRating={course.reviews.mine?.rating ?? 0}
              initialComment={course.reviews.mine?.comment ?? ""}
            />
          </div>
        ) : course.access === "guest" ? (
          <p className="mt-4 text-sm text-white/40">Las opiniones salen de quien ya pagó, no de visitas.</p>
        ) : null}

        <ul className="mt-6 space-y-3">
          {course.reviews.items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-white/10 px-4 py-4">
              <p className="text-sm font-semibold">
                {item.displayName}{" "}
                <span className="font-normal text-klik-cyan">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</span>
              </p>
              {item.comment ? <p className="mt-2 text-sm leading-6 text-white/70">{item.comment}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </PlatformShell>
  );
}
