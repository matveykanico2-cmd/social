type RealtimeEvent = { type: "message" | "sync"; messageId?: number };
type Listener = (event: RealtimeEvent) => void;

const channels = new Map<number, Set<Listener>>();

export function subscribeConversation(conversationId: number, listener: Listener) {
  const listeners = channels.get(conversationId) ?? new Set<Listener>();
  listeners.add(listener);
  channels.set(conversationId, listeners);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) channels.delete(conversationId);
  };
}

export function publishConversation(conversationId: number, event: RealtimeEvent) {
  for (const listener of channels.get(conversationId) ?? []) listener(event);
}

export function resetRealtime() {
  channels.clear();
}
