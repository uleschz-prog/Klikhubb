/**
 * Prueba PATCH /api/me/avatar (guardar y quitar) con sesión de credenciales.
 */
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL ?? "maya@klikhubb.dev";
const PASSWORD = process.env.TEST_PASSWORD ?? "KlikHubb2026!";
const TEST_IMAGE =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=face";

function parseCookies(setCookie) {
  const jar = {};
  for (const raw of setCookie ?? []) {
    const [pair] = raw.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) jar[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
  return jar;
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function main() {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  let cookies = parseCookies(csrfRes.headers.getSetCookie?.() ?? []);

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(cookies),
    },
    body: new URLSearchParams({
      csrfToken,
      email: EMAIL,
      password: PASSWORD,
      callbackUrl: `${BASE}/dashboard`,
      json: "true",
    }),
  });
  cookies = { ...cookies, ...parseCookies(loginRes.headers.getSetCookie?.() ?? []) };

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader(cookies) },
  });
  const session = await sessionRes.json();
  if (!session?.user?.email) {
    console.error("LOGIN_FAIL", session);
    process.exit(1);
  }
  console.log("LOGIN_OK", session.user.email);

  const saveRes = await fetch(`${BASE}/api/me/avatar`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader(cookies),
    },
    body: JSON.stringify({ imageUrl: TEST_IMAGE }),
  });
  const saved = await saveRes.json();
  if (!saveRes.ok) {
    console.error("SAVE_FAIL", saveRes.status, saved);
    process.exit(1);
  }
  console.log("SAVE_OK", saved.imageUrl?.slice(0, 60) + "…", saved.mode);

  const dashRes = await fetch(`${BASE}/dashboard`, {
    headers: { Cookie: cookieHeader(cookies) },
  });
  const html = await dashRes.text();
  const hasImage = html.includes(TEST_IMAGE.split("?")[0]);
  console.log("DASHBOARD_HAS_IMAGE", hasImage);

  const removeRes = await fetch(`${BASE}/api/me/avatar`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader(cookies),
    },
    body: JSON.stringify({ imageUrl: null }),
  });
  const removed = await removeRes.json();
  if (!removeRes.ok || removed.imageUrl !== null) {
    console.error("REMOVE_FAIL", removeRes.status, removed);
    process.exit(1);
  }
  console.log("REMOVE_OK", removed.mode);
  console.log("ALL_PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
