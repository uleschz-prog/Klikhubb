import Link from "next/link";
import { LogoMark } from "@/components/brand/LogoMark";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#050505] px-6 text-center text-white">
      <LogoMark className="h-16 w-16 drop-shadow-[0_0_24px_rgba(0,240,255,0.35)]" framed />
      <h1 className="mt-6 font-display text-2xl font-extrabold">Sin conexión</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
        Qlyk necesita internet para el feed y los pagos. Revisa tu red e inténtalo de nuevo.
      </p>
      <Link
        href="/play"
        className="mt-8 rounded-full bg-klik-green px-6 py-3 text-sm font-bold text-klik-black"
      >
        Reintentar
      </Link>
    </div>
  );
}
