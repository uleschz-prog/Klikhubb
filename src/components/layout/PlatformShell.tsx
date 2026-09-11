import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { PlatformHeader } from "@/components/layout/PlatformHeader";

export function PlatformShell({
  title,
  children,
  flush = false,
}: {
  title?: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <div className="min-h-app bg-klik-black text-white">
      <PlatformHeader title={title} />
      <div className={flush ? "" : "mx-auto max-w-6xl px-4 pb-tabbar pt-6 md:pb-10"}>{children}</div>
      <MobileTabBar />
    </div>
  );
}
