import { referralLink } from "@/config/site";

export function InviteCard({ code, invitedCount }: { code: string; invitedCount: number }) {
  const link = code ? referralLink(code) : "";

  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Invita, no reclutes</p>
      <h3 className="mt-1 font-display text-xl font-bold text-white">Trae a tu gente</h3>
      <p className="mt-3 text-sm leading-6 text-white/60">
        Si un amigo entra con tu código y compra, ganas el 5% de esa venta. Un solo gracias. Sin
        reclutar a nadie. Qlyk siempre se queda el 10% de servicio.
      </p>
      {code ? (
        <>
          <p className="mt-5 rounded-2xl border border-klik-cyan/25 bg-klik-cyan/5 px-4 py-3 font-display text-2xl font-extrabold tracking-wide text-klik-cyan">
            {code}
          </p>
          <p className="mt-3 break-all text-xs text-white/45">{link}</p>
        </>
      ) : null}
      <p className="mt-3 text-xs text-white/40">
        {invitedCount === 0
          ? "Todavía no ha entrado nadie con tu código. Compártelo donde ya te escuchan."
          : `${invitedCount} ${invitedCount === 1 ? "persona entró" : "personas entraron"} con tu código.`}
      </p>
    </div>
  );
}
