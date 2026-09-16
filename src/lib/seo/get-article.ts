import { ARTICLE_STRUCTURES, getArticleStructureBySlug } from "@/content/articles";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/i18n/config";
import type { Article, ArticleLocalizedText } from "@/content/types";

/**
 * Loads one locale's messages file and reads its `articles.<slug>`
 * entry — the same dynamic-import approach src/i18n/request.ts already
 * uses to load a locale's UI strings, applied here to article content
 * instead. Falls back to the default locale's file if the requested
 * locale isn't supported, matching that file's own fallback logic.
 */
async function loadLocalizedText(slug: string, locale: string): Promise<ArticleLocalizedText | undefined> {
  const safeLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = (await import(`../../../messages/${safeLocale}.json`)).default as {
    articles?: Record<string, ArticleLocalizedText>;
  };
  return messages.articles?.[slug];
}

/**
 * Returns a fully merged article (structure + this locale's text) for
 * a given slug, or undefined if the slug doesn't exist at all. Every
 * /learn page already calls this function rather than reading
 * structural data directly, so this is the one place that needed to
 * change to make articles genuinely multilingual — no call site
 * needed to change.
 */
export async function getLocalizedArticle(slug: string, locale: string): Promise<Article | undefined> {
  const structure = getArticleStructureBySlug(slug);
  if (!structure) return undefined;
  const text = await loadLocalizedText(slug, locale);
  if (!text) return undefined;
  return { ...structure, ...text };
}

export async function getAllArticles(locale: string): Promise<Article[]> {
  const articles = await Promise.all(ARTICLE_STRUCTURES.map((structure) => getLocalizedArticle(structure.slug, locale)));
  return articles.filter((a): a is Article => a !== undefined);
}

/** Slugs only, locale-independent — used by generateStaticParams,
 * which needs the full slug × locale matrix up front and doesn't need
 * (or want) to load every locale's article text just to build a list
 * of paths. */
export function getAllArticleSlugs(): string[] {
  return ARTICLE_STRUCTURES.map((a) => a.slug);
}
