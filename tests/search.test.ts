import { describe, expect, it } from "vitest";
import { topHashtags } from "../src/lib/search";

describe("search trends", () => {
  it("normalizes and ranks hashtags from captions", () => {
    expect(topHashtags(["A #Shalter #social", "B #shalter", "C #новости"])).toEqual([
      { tag: "#shalter", count: 2 },
      { tag: "#social", count: 1 },
      { tag: "#новости", count: 1 },
    ]);
  });
});
