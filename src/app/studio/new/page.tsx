import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { CreateCourseForm } from "@/components/studio/CreateCourseForm";
import { getDbUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NewStudioCoursePage() {
  const userId = await getDbUserId();
  if (!userId) redirect("/login?callbackUrl=/studio/new");

  return (
    <PlatformShell title="Nuevo curso">
      <Link href="/studio" className="text-sm font-semibold text-klik-cyan hover:underline">
        Volver al Studio
      </Link>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Nuevo</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Crea tu academia</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Empieza con el nombre y el precio. Después armas módulos, videos y archivos.
      </p>
      <div className="mt-8">
        <CreateCourseForm />
      </div>
    </PlatformShell>
  );
}
