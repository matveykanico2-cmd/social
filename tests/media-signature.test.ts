import { describe, expect, it } from "vitest";
import { validateFileSignature } from "../src/lib/media-signature";

describe("media signature validation", () => {
  it("accepts known container signatures", () => {
    expect(validateFileSignature("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(validateFileSignature("video/mp4", new TextEncoder().encode("....ftyp"))).toBe(true);
  });

  it("rejects a mismatched image payload", () => {
    expect(validateFileSignature("image/png", new TextEncoder().encode("not a png"))).toBe(false);
  });
});
