/** Short, word-preserving chunks for browser voices which struggle with long utterances. */
export function speechChunks(text: string, limit = 1100): string[] {
  if (!Number.isSafeInteger(limit) || limit < 40) throw new Error("Speech chunk limit must be at least 40");
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && current.length + word.length + 1 > limit) { chunks.push(current); current = ""; }
    current = current ? `${current} ${word}` : word;
  }
  if (current) chunks.push(current);
  return chunks;
}
