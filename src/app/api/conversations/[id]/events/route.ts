import { route, intParam } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { conversationDetails } from "@/lib/server/dm";
import { subscribeConversation } from "@/lib/server/realtime";

export const GET = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  conversationDetails(id, me.id);
  const encoder = new TextEncoder();
  let unsubscribe: () => void = () => undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: { type: string; messageId?: number }) => {
        controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
      };
      send({ type: "ready" });
      unsubscribe = subscribeConversation(id, send);
      heartbeat = setInterval(() => send({ type: "ping" }), 20_000);
    },
    cancel() {
      unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    },
  });
  req.signal.addEventListener("abort", () => {
    unsubscribe();
    if (heartbeat) clearInterval(heartbeat);
  }, { once: true });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
});
