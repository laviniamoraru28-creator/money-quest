/**
 * The content model behind every /learn page. Scalable in the way that
 * matters for SEO content specifically: adding a new article is adding
 * one entry to the catalog (src/content/articles.ts) — never a new page
 * component, a new route file, or new metadata-wiring code. The single
 * template at src/app/[locale]/learn/[slug]/page.tsx handles metadata,
 * structured data, canonical URLs, Open Graph, and internal linking
 * generically for every article, driven entirely by this data.
 */

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  /** An optional bullet list rendered after the section's paragraphs —
   * used for genuinely list-shaped content (steps, examples), never as
   * a keyword-stuffing device. */
  list?: string[];
}

export interface ArticleFaq {
  question: string;
  answer: string;
}

export type Audience = "parents" | "teachers" | "families";

/** The locale-independent half of an article — same split as
 * curriculum/game/simulator content: structural facts here, all
 * translatable prose in messages/*.json under `articles.<slug>` (see
 * ArticleLocalizedText below and get-article.ts for how the two are
 * merged at request time). */
export interface ArticleStructure {
  slug: string;
  /** The specific search terms this page is written for — used only
   * for internal documentation/traceability (see the "target keywords"
   * column in seo-strategy.md), never injected verbatim and repeatedly
   * into the visible copy. English-only by design: these are search
   * terms for traceability, not user-facing prose, so they don't need
   * the same per-locale translation as the article's actual content. */
  targetKeywords: string[];
  audience: Audience[];
  /** Slugs of other articles to link to from this one — the internal
   * linking strategy expressed as data, not ad-hoc links scattered
   * through prose. See seo-strategy.md §6. */
  relatedSlugs: string[];
  publishedDate: string; // ISO date — real, not backdated for SEO effect
  updatedDate: string;
}

/** The translatable half — one of these per locale, stored at
 * `articles.<slug>` in each messages/*.json file. */
export interface ArticleLocalizedText {
  /** Page <title> and H1 — kept under ~60 characters where practical so
   * search results don't truncate it, but never at the expense of
   * accurately describing the page's actual content (see the "no
   * misleading SEO techniques" principle in seo-strategy.md). */
  title: string;
  /** Meta description — under ~160 characters, written as genuine
   * ad-copy-style summary of what's actually on the page, never a
   * keyword list. */
  metaDescription: string;
  sections: ArticleSection[];
  faqs?: ArticleFaq[];
}

/** The merged, request-ready shape every page/component actually
 * consumes — built by combining one ArticleStructure with the right
 * locale's ArticleLocalizedText. See get-article.ts. */
export type Article = ArticleStructure & ArticleLocalizedText;
