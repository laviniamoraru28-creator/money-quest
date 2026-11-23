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
    targetKeywords: ["saving money for kids", "how to teach kids to save", "teach kids to save money by age"],
    audience: ["parents", "families"],
    relatedSlugs: ["budgeting-for-kids", "needs-vs-wants"],
    publishedDate: "2026-01-15",
    updatedDate: "2026-11-23",
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
    targetKeywords: ["needs vs wants", "needs vs wants for kids", "how to teach needs vs wants"],
    audience: ["parents", "teachers", "families"],
    relatedSlugs: ["budgeting-for-kids", "saving-money-for-kids"],
    publishedDate: "2026-01-15",
    updatedDate: "2026-11-23",
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
  {
    // First article produced by the Parent Copywriting Strategist
    // (scripts/parent_copywriting_agent.py, PR #95) — drafted and
    // lint-checked there, wired into the live catalog here only as a
    // separate, human-reviewed Draft PR per the owner's "do not
    // publish articles automatically" instruction.
    slug: "naming-big-feelings-about-money",
    targetKeywords: ["child upset about money", "money meltdown kids", "child anxious about money", "emotional regulation money"],
    audience: ["parents", "families"],
    relatedSlugs: ["needs-vs-wants", "saving-money-for-kids"],
    publishedDate: "2026-11-18",
    updatedDate: "2026-11-18",
  },
  {
    slug: "entrepreneurial-thinking-in-children",
    targetKeywords: ["entrepreneurial thinking for kids", "teaching children entrepreneurship", "problem solving activities for children", "entrepreneurship skills for kids"],
    audience: ["parents", "teachers"],
    relatedSlugs: ["how-to-teach-leadership-skills-to-children", "budgeting-for-kids"],
    publishedDate: "2026-11-23",
    updatedDate: "2026-11-23",
  },
  {
    slug: "financial-literacy-age-of-ai",
    targetKeywords: ["financial literacy children AI", "kids money decisions AI", "teaching children about AI and money"],
    audience: ["parents", "teachers"],
    relatedSlugs: ["teaching-children-ai-money-safety", "needs-vs-wants"],
    publishedDate: "2026-11-23",
    updatedDate: "2026-11-23",
  },
  {
    slug: "financial-literacy-send-accessible-activities",
    targetKeywords: ["financial literacy SEND activities", "accessible money lessons for children with SEND", "AAC money activities"],
    audience: ["parents", "teachers"],
    relatedSlugs: ["needs-vs-wants", "money-games-for-kids"],
    publishedDate: "2026-11-23",
    updatedDate: "2026-11-23",
  },
  {
    slug: "free-financial-literacy-activities-primary-school",
    targetKeywords: ["free financial literacy activities for primary school", "classroom money activities no prep", "financial literacy games for primary school groups"],
    audience: ["teachers", "parents"],
    relatedSlugs: ["needs-vs-wants", "money-games-for-kids"],
    publishedDate: "2026-11-23",
    updatedDate: "2026-11-23",
  },
  {
    slug: "free-money-lesson-plans-primary-teachers",
    targetKeywords: ["free money lesson plans primary teachers", "money lesson plans for primary school", "financial literacy lesson plans KS1 KS2"],
    audience: ["teachers"],
    relatedSlugs: ["money-worksheets", "budgeting-for-kids"],
    publishedDate: "2026-11-23",
    updatedDate: "2026-11-23",
  },
  {
    slug: "how-to-teach-kids-about-money",
    targetKeywords: ["how to teach kids about money", "teaching children about money by age", "money conversations with kids"],
    audience: ["parents", "families"],
    relatedSlugs: ["saving-money-for-kids", "needs-vs-wants"],
    publishedDate: "2026-11-23",
    updatedDate: "2026-11-23",
  },
  {
    slug: "how-to-teach-leadership-skills-to-children",
    targetKeywords: ["leadership skills for children", "how to teach kids leadership", "leadership activities for children", "fair decision making for kids"],
    audience: ["parents", "teachers"],
    relatedSlugs: ["entrepreneurial-thinking-in-children", "money-games-for-kids"],
    publishedDate: "2026-11-23",
    updatedDate: "2026-11-23",
  },
  {
    slug: "skills-for-ai-powered-future",
    targetKeywords: ["skills children need AI future", "future readiness skills for kids", "critical thinking skills children"],
    audience: ["parents", "teachers", "families"],
    relatedSlugs: ["budgeting-for-kids", "needs-vs-wants"],
    publishedDate: "2026-11-23",
    updatedDate: "2026-11-23",
  },
  {
    slug: "teaching-children-ai-money-safety",
    targetKeywords: ["teach children AI money safety", "AI financial advice kids safety", "how to discuss AI shopping suggestions with children"],
    audience: ["parents", "teachers"],
    relatedSlugs: ["financial-literacy-age-of-ai", "budgeting-for-kids"],
    publishedDate: "2026-11-23",
    updatedDate: "2026-11-23",
  },
  {
    slug: "why-critical-thinking-matters-for-children",
    targetKeywords: ["critical thinking for children", "teaching kids to evaluate evidence", "how to teach children to question claims"],
    audience: ["parents", "teachers", "families"],
    relatedSlugs: ["needs-vs-wants", "naming-big-feelings-about-money"],
    publishedDate: "2026-11-23",
    updatedDate: "2026-11-23",
  },
];

export function getArticleStructureBySlug(slug: string): ArticleStructure | undefined {
  return ARTICLE_STRUCTURES.find((a) => a.slug === slug);
}
