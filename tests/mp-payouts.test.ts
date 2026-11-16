import { describe, expect, it } from "vitest";
import { usdToMxn } from "@/lib/payments/fx";
import { generateEd25519PemPair, signPayoutBody, verifyPayoutBodySignature } from "@/lib/payments/mp-payout-sign";
import {
  extractPayoutIdFromNotification,
  isValidMpPayoutEmail,
  mapMpTransactionStatus,
  nextPayoutTransition,
  normalizeMpPayoutEmail,
  payoutExternalReference,
} from "@/lib/commerce/payout-state";

describe("retiros Mercado Pago: estado e idempotencia", () => {
  it("mapea estados remotos a requested/processing/paid/failed", () => {
    expect(mapMpTransactionStatus("created")).toBe("PROCESSING");
    expect(mapMpTransactionStatus("pending")).toBe("PROCESSING");
    expect(mapMpTransactionStatus("in_process")).toBe("PROCESSING");
    expect(mapMpTransactionStatus("success", "accredited")).toBe("COMPLETED");
    expect(mapMpTransactionStatus("error")).toBe("FAILED");
    expect(mapMpTransactionStatus("canceled")).toBe("FAILED");
    expect(mapMpTransactionStatus("???")).toBe("UNKNOWN");
  });

  it("transiciona pending → processing → paid y no reabre un pagado", () => {
    expect(nextPayoutTransition("PENDING", "PROCESSING")).toEqual({
      next: "PROCESSING",
      reverseBalance: false,
      ignore: false,
    });
    expect(nextPayoutTransition("PROCESSING", "COMPLETED")).toEqual({
      next: "COMPLETED",
      reverseBalance: false,
      ignore: false,
    });
    expect(nextPayoutTransition("COMPLETED", "FAILED")).toEqual({
      next: "COMPLETED",
      reverseBalance: false,
      ignore: true,
    });
    expect(nextPayoutTransition("COMPLETED", "COMPLETED")).toEqual({
      next: "COMPLETED",
      reverseBalance: false,
      ignore: true,
    });
  });

  it("al fallar desde pending o processing revierte el saldo una sola vez en la transición", () => {
    const fromPending = nextPayoutTransition("PENDING", "FAILED");
    const fromProcessing = nextPayoutTransition("PROCESSING", "FAILED");
    const alreadyFailed = nextPayoutTransition("FAILED", "FAILED");
    expect(fromPending).toEqual({ next: "FAILED", reverseBalance: true, ignore: false });
    expect(fromProcessing).toEqual({ next: "FAILED", reverseBalance: true, ignore: false });
    expect(alreadyFailed).toEqual({ next: "FAILED", reverseBalance: false, ignore: true });
  });
});

describe("retiros Mercado Pago: FX, referencia y correo", () => {
  it("convierte el retiro de USD a MXN con dos decimales", () => {
    expect(usdToMxn(10, 18.5)).toBe(185);
    expect(usdToMxn(12.34, 17.1234)).toBe(211.3);
  });

  it("genera una referencia numérica determinista y válida para México", () => {
    const a = payoutExternalReference("clxyz123");
    const b = payoutExternalReference("clxyz123");
    const c = payoutExternalReference("otro");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^\d{1,18}$/);
  });

  it("normaliza y valida el correo de la cuenta Mercado Pago", () => {
    expect(isValidMpPayoutEmail("Creador@Qlyk.app")).toBe(true);
    expect(normalizeMpPayoutEmail("  Creador@Qlyk.app ")).toBe("creador@qlyk.app");
    expect(isValidMpPayoutEmail("no-es-correo")).toBe(false);
    expect(isValidMpPayoutEmail("")).toBe(false);
  });
});

describe("retiros Mercado Pago: firma Ed25519 y notificaciones", () => {
  it("firma el cuerpo exacto y verifica la firma", () => {
    const { publicKeyPem, privateKeyPem } = generateEd25519PemPair();
    const body = JSON.stringify({ external_reference: "123", transactions: [{ type: "account" }] });
    const signature = signPayoutBody(privateKeyPem, body);
    expect(verifyPayoutBodySignature(publicKeyPem, body, signature)).toBe(true);
    expect(verifyPayoutBodySignature(publicKeyPem, body + "x", signature)).toBe(false);
  });

  it("extrae el id POP de una notificación de payout", () => {
    expect(
      extractPayoutIdFromNotification({
        body: { id: "POP01KV681P6SJ38NQHWX3XK162SS", type: "payout" },
      }),
    ).toBe("POP01KV681P6SJ38NQHWX3XK162SS");
    expect(
      extractPayoutIdFromNotification({
        query: { payout_id: "POP01ABC" },
      }),
    ).toBe("POP01ABC");
    expect(extractPayoutIdFromNotification({ body: { id: "12345", type: "payment" } })).toBeNull();
  });
});
