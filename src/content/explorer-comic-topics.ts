/** Explorer topics with a supplied English comic strip, replacing the
 * usual illustration+prose lesson panel — all 10 Explorer topics now
 * have one. Every non-English locale keeps its existing presentation
 * for every topic until translated comics are supplied — see
 * ExplorerComicLesson's own doc comment. */
export const EXPLORER_COMIC_TOPICS = [
  "money_basics",
  "needs_wants",
  "saving",
  "currencies",
  "scams",
  "long_term_thinking",
  "giving",
  "digital_money",
  "investing_basics",
  "junior_isa",
] as const;
export type ExplorerComicTopic = (typeof EXPLORER_COMIC_TOPICS)[number];

export function hasExplorerComic(topicId: string): topicId is ExplorerComicTopic {
  return (EXPLORER_COMIC_TOPICS as readonly string[]).includes(topicId);
}
