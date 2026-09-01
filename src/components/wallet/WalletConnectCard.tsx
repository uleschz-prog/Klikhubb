export function WalletConnectCard() {
  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Depósito</p>
      <h2 className="mt-1 font-display text-xl font-bold">Retiros manuales</h2>
      <p className="mt-3 text-sm leading-6 text-white/60">
        El comprador paga a Qlyk por transferencia. Cuando pides retiro, el equipo te deposita a mano (SPEI,
        PayPal u otro método acordado). Asegúrate de tener tus datos bancarios actualizados en tu perfil.
      </p>
    </div>
  );
}
