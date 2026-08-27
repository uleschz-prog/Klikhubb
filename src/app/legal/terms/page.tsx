import { Logo } from "@/components/brand/Logo";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-white/70">
      <Logo />
      <h1 className="mt-8 font-display text-3xl font-extrabold text-white">Términos de uso</h1>
      <p className="mt-4 text-sm leading-7">
        Qlyk es una red social con comercio y academia. El creador recibe el 85% de cada venta.
        Qlyk (Qlykadmin) cobra siempre un 10% de servicio. Si alguien invitó al comprador, recibe
        el 5% de esa compra. Si no hubo invitación, ese 5% también es del creador. No hay planes
        multinivel. El acceso beta está sujeto a lista de espera. Las ganancias se acreditan tras
        un hold de 14 días. El documento completo se publica antes del launch público.
      </p>
    </main>
  );
}
