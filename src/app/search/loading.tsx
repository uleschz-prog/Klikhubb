import { PlatformShell } from "@/components/layout/PlatformShell";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <PlatformShell title="Buscar">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-6 h-12 w-full rounded-full" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </PlatformShell>
  );
}
