import { describe, expect, it } from "vitest";
import { ORDER_TRANSITIONS } from "../src/lib/marketplace";

describe("marketplace order lifecycle", () => {
  it("allows only forward delivery states and cancellation", () => {
    expect(ORDER_TRANSITIONS.quoted).toEqual(["agreed", "cancelled"]);
    expect(ORDER_TRANSITIONS.delivered).toContain("paid");
    expect(ORDER_TRANSITIONS.paid).toBeUndefined();
    expect(ORDER_TRANSITIONS.quoted).not.toContain("paid");
  });
});
