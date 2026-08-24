import { PlatformShell } from "@/components/layout/PlatformShell";
import { mockCourses } from "@/data/mock";

export default function AcademyPage() {
  return (
    <PlatformShell title="Academy">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Educación</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Academy</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        El video te descubre. La academia te queda. Lecciones y membresías ligadas a lo que compraste.
      </p>
      <div className="mt-8 space-y-3">
        {mockCourses.map((course, index) => (
          <article
            key={course.slug}
            className="flex items-center justify-between gap-4 rounded-2xl border border-klik-line bg-klik-card px-5 py-4"
          >
            <div>
              <p className="font-display text-xs text-klik-green">Módulo {String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-1 font-display text-lg font-bold">{course.title}</h2>
            </div>
            <span className="text-sm text-white/45">{course.students} alumnos</span>
          </article>
        ))}
      </div>
    </PlatformShell>
  );
}
