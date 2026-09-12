import { Logo } from "@/components/brand/Logo";
import { PlatformNav } from "@/components/layout/PlatformNav";
import { ThemeToggle } from "@/components/theme/ThemeProvider";

export function PlatformHeader({ title }: { title?: string }) {
  return (
    <header className="pwa-native-top sticky top-0 z-30 border-b border-klik-line bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo className="text-foreground" />
        {title ? <p className="text-sm font-semibold tracking-tight text-foreground md:hidden">{title}</p> : null}
        <div className="flex items-center gap-2 sm:gap-3">
          <PlatformNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
