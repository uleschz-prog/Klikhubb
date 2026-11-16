import { PlatformShell } from "@/components/layout/PlatformShell";
import { CatalogSkeletonGrid } from "@/components/ui/Skeleton";

export default function CursosLoading() {
  return (
    <PlatformShell title="Cursos">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-24 rounded-full bg-foreground/10" />
        <div className="h-8 w-48 rounded-full bg-foreground/10" />
        <div className="h-4 w-72 rounded-full bg-foreground/10" />
      </div>
      <div className="mt-8">
        <CatalogSkeletonGrid count={6} />
      </div>
    </PlatformShell>
  );
}
