import { createHash } from "crypto";

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function sha256(data: Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

function base58Decode(value: string): Buffer | null {
  let num = BigInt(0);
  for (const char of value) {
    const idx = BASE58.indexOf(char);
    if (idx < 0) return null;
    num = num * BigInt(58) + BigInt(idx);
  }
  let hex = num.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  const bytes = Buffer.from(hex, "hex");
  let leading = 0;
  for (const char of value) {
    if (char !== "1") break;
    leading += 1;
  }
  return Buffer.concat([Buffer.alloc(leading), bytes]);
}

export function normalizeTrc20Address(value: string): string {
  return value.trim();
}

/** Dirección USDT en Tron (TRC20): empieza por T, 34 chars, base58check con version 0x41. */
export function isValidTrc20Address(value: string): boolean {
  const address = normalizeTrc20Address(value);
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return false;
  const decoded = base58Decode(address);
  if (!decoded || decoded.length !== 25) return false;
  if (decoded[0] !== 0x41) return false;
  const payload = decoded.subarray(0, 21);
  const checksum = decoded.subarray(21, 25);
  const digest = sha256(sha256(payload)).subarray(0, 4);
  return digest.equals(checksum);
}
