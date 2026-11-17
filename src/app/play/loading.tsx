export default function PlayLoading() {
  return (
    <div className="theme-media relative h-[100dvh] overflow-hidden bg-black" aria-busy="true" aria-label="Cargando el feed">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-neutral-950 to-black" />
      <div className="overlay-vignette-top pointer-events-none absolute inset-x-0 top-0 h-36" />
      <div className="overlay-vignette-bottom pointer-events-none absolute inset-x-0 bottom-0 h-56" />
      <div className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] h-11 w-28 animate-pulse rounded-full bg-white/10" />
      <div className="absolute left-1/2 top-[max(1rem,env(safe-area-inset-top))] h-11 w-52 -translate-x-1/2 animate-pulse rounded-full bg-white/10 max-md:left-36 max-md:translate-x-0 max-md:w-40" />
      <div className="absolute right-3 top-[max(1rem,env(safe-area-inset-top))] h-11 w-11 animate-pulse rounded-full bg-white/10 md:right-6 md:w-72" />
      <div className="absolute right-3 top-1/3 flex flex-col items-center gap-3 md:right-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
        ))}
      </div>
      <div className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 h-36 w-[min(20rem,calc(100%-6.5rem))] animate-pulse rounded-3xl bg-white/10 md:bottom-20 md:left-8" />
    </div>
  );
}
