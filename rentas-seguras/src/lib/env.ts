function looksLikePlaceholder(value: string | undefined | null) {
  if (!value) return true;
  const v = value.trim();
  if (!v) return true;
  return /your_|YOUR_PROJECT|placeholder|example\.supabase\.co|sk-your_|APP_USR-your_/i.test(
    v
  );
}

export function isConfiguredSecret(value: string | undefined | null) {
  return !looksLikePlaceholder(value);
}

export function getPublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isConfiguredSecret(url) || !isConfiguredSecret(anonKey)) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Copia rentas-seguras/.env.example a .env.local y usa claves reales (no de ejemplo)."
    );
  }

  return { url: url as string, anonKey: anonKey as string };
}

export function getAppUrl(request?: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (request) {
    const origin = request.headers.get("origin");
    if (origin) return origin.replace(/\/$/, "");
    const host = request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  }

  return "http://localhost:3001";
}

export function getOpenAiKey() {
  const key = process.env.OPENAI_API_KEY;
  return isConfiguredSecret(key) ? key!.trim() : null;
}

export function getOpenAiModel() {
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}

export function getMercadoPagoAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  return isConfiguredSecret(token) ? token!.trim() : null;
}

export function getMercadoPagoWebhookSecret() {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  return isConfiguredSecret(secret) ? secret!.trim() : null;
}

export function getIntegrationStatus() {
  return {
    supabase: isConfiguredSecret(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      isConfiguredSecret(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    openai: Boolean(getOpenAiKey()),
    mercadopago: Boolean(getMercadoPagoAccessToken()),
    mercadopagoWebhook: Boolean(getMercadoPagoWebhookSecret()),
  };
}
