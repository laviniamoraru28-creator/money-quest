import type { ArticleStructure } from "./types";

/**
 * Structural data only — locale-independent facts about each article.
 * Every word of actual prose (title, meta description, section
 * headings, paragraphs, lists, FAQs) lives in messages/*.json under
 * `articles.<slug>`, one full copy per supported language — the exact
 * same structural/translatable split already used for curriculum,
 * games, and the Simulator. See get-article.ts for how the two halves
 * are merged into the Article shape every page actually consumes.
 */
export const ARTICLE_STRUCTURES: ArticleStructure[] = [
  {
    slug: "saving-money-for-kids",
    targetKeywords: ["saving money for kids", "how to teach kids to save"],
    audience: ["parents", "families"],
    relatedSlugs: ["budgeting-for-kids", "needs-vs-wants"],
    publishedDate: "2026-01-15",
    updatedDate: "2026-01-15",
  },
  {
    slug: "budgeting-for-kids",
    targetKeywords: ["budgeting for kids", "teach kids budgeting"],
    audience: ["parents", "teachers", "families"],
    relatedSlugs: ["saving-money-for-kids", "needs-vs-wants"],
    publishedDate: "2026-01-15",
    updatedDate: "2026-01-15",
  },
  {
    slug: "needs-vs-wants",
    targetKeywords: ["needs vs wants", "needs vs wants for kids"],
    audience: ["parents", "teachers", "families"],
    relatedSlugs: ["budgeting-for-kids", "saving-money-for-kids"],
    publishedDate: "2026-01-15",
    updatedDate: "2026-01-15",
  },
  {
    slug: "money-games-for-kids",
    targetKeywords: ["money games for kids", "financial literacy activities"],
    audience: ["parents", "teachers", "families"],
    relatedSlugs: ["money-worksheets", "budgeting-for-kids"],
    publishedDate: "2026-01-15",
    updatedDate: "2026-01-15",
  },
  {
    slug: "money-worksheets",
    targetKeywords: ["money worksheets", "financial literacy worksheets"],
    audience: ["teachers", "parents"],
    relatedSlugs: ["money-games-for-kids", "needs-vs-wants"],
    publishedDate: "2026-01-15",
    updatedDate: "2026-01-15",
  },
  {
    slug: "currency-education",
    targetKeywords: ["currency education", "teaching kids about currency"],
    audience: ["parents", "teachers", "families"],
    relatedSlugs: ["needs-vs-wants", "money-games-for-kids"],
    publishedDate: "2026-01-15",
    updatedDate: "2026-01-15",
  },
];

export function getArticleStructureBySlug(slug: string): ArticleStructure | undefined {
  return ARTICLE_STRUCTURES.find((a) => a.slug === slug);
}
