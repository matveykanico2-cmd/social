import { describe, expect, it } from "vitest";
import { authenticatorUri, generateTotpSecret, totpAt, verifyTotp } from "../src/lib/server/totp";

describe("TOTP authentication", () => {
  // RFC 6238 SHA1 test vector at T=59 seconds, 8 digit output.
  const fixture = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  it("matches the RFC 6238 vector", () => {
    expect(totpAt(fixture, 1, 8)).toBe("94287082");
  });
  it("accepts a six-digit code once and rejects replay", () => {
    const code = totpAt(fixture, 2)!;
    expect(verifyTotp(fixture, code, -1, 60000)).toBe(2);
    expect(verifyTotp(fixture, code, 2, 60000)).toBeNull();
    expect(verifyTotp(fixture, "123", -1, 60000)).toBeNull();
  });
  it("generates compatible secrets and authenticator enrollment URIs", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(totpAt(secret, 1)).toMatch(/^\d{6}$/);
    expect(authenticatorUri("demo", secret)).toContain("issuer=SHALTER");
  });
});
