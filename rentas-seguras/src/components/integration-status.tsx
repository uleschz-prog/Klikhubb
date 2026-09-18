import { getIntegrationStatus } from "@/lib/env";

export function IntegrationStatus() {
  const status = getIntegrationStatus();
  const rows: { ok: boolean; label: string }[] = [
    {
      ok: status.supabase,
      label:
        "Supabase Auth (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    },
    { ok: status.openai, label: "OpenAI (OPENAI_API_KEY)" },
    {
      ok: status.mercadopago,
      label: "MercadoPago $499 MXN (MERCADOPAGO_ACCESS_TOKEN)",
    },
    {
      ok: status.mercadopagoWebhook,
      label: "Webhook MercadoPago (MERCADOPAGO_WEBHOOK_SECRET, opcional)",
    },
  ];
  const ready = status.supabase && status.openai && status.mercadopago;

  return (
    <aside className="paper-card rounded-2xl p-6">
      <p className="stamp text-[10px] text-cedar-700">Entorno</p>
      <h2 className="font-serif text-2xl">
        {ready ? "Integraciones listas" : "Faltan claves para el e2e"}
      </h2>
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex gap-2">
            <span className={row.ok ? "text-moss-800" : "text-cedar-700"}>
              {row.ok ? "Listo" : "Falta"}
            </span>
            <span>{row.label}</span>
          </li>
        ))}
      </ul>
      {ready ? null : (
        <p className="mt-3 text-sm text-ink-700">
          Completa <code>rentas-seguras/.env.local</code> (nunca se commitea) y
          reinicia el servidor. <code>SUPABASE_SERVICE_ROLE_KEY</code> no es
          necesaria para Auth ni para este flujo.
        </p>
      )}
    </aside>
  );
}
