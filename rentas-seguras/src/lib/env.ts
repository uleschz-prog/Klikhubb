export function getPublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Copia rentas-seguras/.env.example a .env.local."
    );
  }

  return { url, anonKey };
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
  if (!key) return null;
  return key;
}

export function getOpenAiModel() {
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}

export function getMercadoPagoAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return null;
  return token;
}

export function getMercadoPagoWebhookSecret() {
  return process.env.MERCADOPAGO_WEBHOOK_SECRET ?? null;
}
