import { Logo } from "@/components/brand/Logo";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-white/70">
      <Logo />
      <h1 className="mt-8 font-display text-3xl font-extrabold text-white">Privacidad</h1>
      <p className="mt-4 text-sm leading-7">
        Recogemos email, nombre, usuario, idioma, zona horaria y eventos de producto necesarios para operar
        el feed, las compras y la comunidad. No vendemos tu lista. La política completa se publica antes
        del launch público.
      </p>
    </main>
  );
}
