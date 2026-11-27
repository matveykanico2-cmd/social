export function topHashtags(captions: string[]) {
  const counts = new Map<string, number>();
  for (const caption of captions) for (const tag of caption.match(/#[\p{L}\p{N}_]+/gu) ?? []) counts.set(tag.toLowerCase(), (counts.get(tag.toLowerCase()) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20).map(([tag, count]) => ({ tag, count }));
}
