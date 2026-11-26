import { beforeEach, describe, expect, it } from "vitest";
import { publishConversation, resetRealtime, subscribeConversation } from "../src/lib/server/realtime";

describe("conversation realtime bus", () => {
  beforeEach(() => resetRealtime());

  it("delivers events only to subscribers of the matching conversation", () => {
    const first: number[] = [];
    const second: number[] = [];
    const stop = subscribeConversation(1, (event) => first.push(event.messageId ?? 0));
    subscribeConversation(2, (event) => second.push(event.messageId ?? 0));
    publishConversation(1, { type: "message", messageId: 8 });
    expect(first).toEqual([8]);
    expect(second).toEqual([]);
    stop();
    publishConversation(1, { type: "message", messageId: 9 });
    expect(first).toEqual([8]);
  });
});
