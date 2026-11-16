import { createPrivateKey, createPublicKey, generateKeyPairSync, sign as cryptoSign, verify as cryptoVerify } from "crypto";

export function normalizePem(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const pem = raw.trim().replace(/\\n/g, "\n").replace(/\\r/g, "");
  return pem.includes("BEGIN") ? pem : null;
}

export function signPayoutBody(privateKeyPem: string, body: string | Buffer): string {
  const key = createPrivateKey(normalizePem(privateKeyPem) ?? privateKeyPem);
  const bytes = typeof body === "string" ? Buffer.from(body, "utf8") : body;
  return cryptoSign(null, bytes, key).toString("base64");
}

export function verifyPayoutBodySignature(
  publicKeyPem: string,
  body: string | Buffer,
  signatureBase64: string,
): boolean {
  try {
    const key = createPublicKey(normalizePem(publicKeyPem) ?? publicKeyPem);
    const bytes = typeof body === "string" ? Buffer.from(body, "utf8") : body;
    return cryptoVerify(null, bytes, key, Buffer.from(signatureBase64, "base64"));
  } catch {
    return false;
  }
}

export function generateEd25519PemPair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}
