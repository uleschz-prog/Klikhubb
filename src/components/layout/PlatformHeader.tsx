import { Logo } from "@/components/brand/Logo";
import { PlatformNav } from "@/components/layout/PlatformNav";

export function PlatformHeader({ title }: { title?: string }) {
  return (
    <header className="pwa-native-top sticky top-0 z-30 border-b border-klik-line bg-klik-black/90 backdrop-blur-xl supports-[backdrop-filter]:bg-klik-black/75">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Logo className="text-white" />
        {title ? <p className="text-sm font-semibold tracking-tight text-white md:hidden">{title}</p> : null}
        <PlatformNav />
      </div>
    </header>
  );
}
