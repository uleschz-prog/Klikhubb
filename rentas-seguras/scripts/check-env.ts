import { isConfiguredSecret } from "../src/lib/env";

const cases: [string | undefined, boolean][] = [
  [undefined, false],
  ["", false],
  ["your_supabase_anon_key", false],
  ["https://YOUR_PROJECT.supabase.co", false],
  ["https://example.supabase.co", false],
  ["sk-your_openai_api_key", false],
  ["APP_USR-your_mercadopago_access_token", false],
  ["https://abcdxyz.supabase.co", true],
  ["sk-live-real-key", true],
  ["TEST-abc", true],
];

for (const [value, expected] of cases) {
  const got = isConfiguredSecret(value);
  if (got !== expected) {
    console.error("fail", value, "expected", expected, "got", got);
    process.exit(1);
  }
}

console.log("env-placeholders: ok");
