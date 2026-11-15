/** Explorer topics with a supplied English comic strip, replacing the
 * usual illustration+prose lesson panel. needs_wants and
 * investing_basics have no comic yet and keep their existing
 * presentation; every non-English locale keeps its existing
 * presentation for every topic until translated comics are supplied —
 * see ExplorerComicLesson's own doc comment. */
export const EXPLORER_COMIC_TOPICS = [
  "money_basics",
  "saving",
  "currencies",
  "scams",
  "long_term_thinking",
  "giving",
  "digital_money",
  "junior_isa",
] as const;
export type ExplorerComicTopic = (typeof EXPLORER_COMIC_TOPICS)[number];

export function hasExplorerComic(topicId: string): topicId is ExplorerComicTopic {
  return (EXPLORER_COMIC_TOPICS as readonly string[]).includes(topicId);
}
