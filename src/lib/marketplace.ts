export const ORDER_TRANSITIONS: Record<string, string[]> = {
  quoted: ["agreed", "cancelled"],
  agreed: ["in_progress", "cancelled"],
  in_progress: ["delivered", "cancelled"],
  delivered: ["paid", "cancelled"],
};
