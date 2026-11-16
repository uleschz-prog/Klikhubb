import { afterEach, describe, expect, it, vi } from "vitest";
import { isCronAuthorized } from "@/lib/cron/auth";

afterEach(() => {
  vi.unstubAllEnvs();
});

function requestWithAuth(value?: string) {
  const headers = new Headers();
  if (value) headers.set("authorization", value);
  headers.set("x-vercel-cron", "1");
  return new Request("https://qlyk.vercel.app/api/cron/release-wallets", { headers });
}

describe("isCronAuthorized", () => {
  it("acepta Bearer con el secreto correcto", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "super-secret");
    expect(isCronAuthorized(requestWithAuth("Bearer super-secret"))).toBe(true);
  });

  it("rechaza un Bearer incorrecto", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "super-secret");
    expect(isCronAuthorized(requestWithAuth("Bearer other"))).toBe(false);
  });

  it("en producción no basta el header x-vercel-cron", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "super-secret");
    expect(isCronAuthorized(requestWithAuth())).toBe(false);
  });

  it("en desarrollo, si no hay CRON_SECRET, permite la llamada local", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "");
    expect(isCronAuthorized(requestWithAuth())).toBe(true);
  });
});
