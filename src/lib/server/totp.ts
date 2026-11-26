import crypto from "node:crypto";

/** RFC 4226/6238 compatible 6-digit SHA-1 authenticator codes (30-second steps). */
const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function generateTotpSecret() {
  let bits = 0, accumulator = 0, result = "";
  for (const octet of crypto.randomBytes(20)) {
    accumulator = (accumulator << 8) | octet;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += ABC[(accumulator >>> bits) & 31];
    }
  }
  return result;
}
function decodeBase32(value: string) {
  if (!/^[A-Z2-7]{16,64}$/.test(value)) return null;
  let bits = 0, accumulator = 0;
  const bytes: number[] = [];
  for (const letter of value) {
    accumulator = (accumulator << 5) | ABC.indexOf(letter);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((accumulator >>> bits) & 255);
    }
  }
  return Buffer.from(bytes);
}

export function totpAt(secret: string, counter: number, digits = 6) {
  const key = decodeBase32(secret);
  if (!key || !Number.isSafeInteger(counter) || counter < 0) return null;
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const numeric = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return String(numeric).padStart(digits, "0");
}

/** Returns the accepted counter, or null. Reuse is prevented by storing the counter. */
export function verifyTotp(secret: string, input: string, lastCounter = -1, timeMs = Date.now()) {
  if (!/^\d{6}$/.test(input)) return null;
  const base = Math.floor(timeMs / 30000);
  for (const delta of [-1, 0, 1]) {
    const counter = base + delta;
    if (counter <= lastCounter) continue;
    const candidate = totpAt(secret, counter);
    if (candidate && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(input))) return counter;
  }
  return null;
}
export function authenticatorUri(username: string, secret: string) {
  const issuer = "SHALTER";
  return `otpauth://totp/${encodeURIComponent(issuer + ":" + username)}?secret=${encodeURIComponent(secret)}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
