import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import { ARTICLE_STRUCTURES } from "@/content/articles";
import { LOCALES } from "@/i18n/config";

/**
 * Covers every genuinely public, indexable page — the landing page,
 * the /learn hub, every /learn article, and the static /privacy and
 * /contact pages — each with one entry per locale and a full set of
 * hreflang `languages` alternates pointing at every other locale's
 * version of the same page. No authenticated route appears here at
 * all, matching robots.ts's disallow list — there's no reason to list
 * a URL in a sitemap that robots.txt then tells crawlers not to fetch.
 *
 * Uses ARTICLE_STRUCTURES directly (structural data: slug +
 * updatedDate) rather than the localized Article — a sitemap entry is
 * the same URL regardless of which locale's content happens to be
 * loaded, so there's no reason to load any locale's article text just
 * to build it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  const staticPaths = ["", "/learn", "/privacy", "/contact"];
  const articlePaths = ARTICLE_STRUCTURES.map((a) => `/learn/${a.slug}`);
  const allPaths = [...staticPaths, ...articlePaths];

  const entries: MetadataRoute.Sitemap = [];

  for (const path of allPaths) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: getLastModifiedForPath(path),
        changeFrequency: path.startsWith("/learn/") ? "monthly" : "weekly",
        priority: path === "" ? 1.0 : path === "/learn" ? 0.9 : path.startsWith("/learn/") ? 0.8 : 0.5,
        alternates: {
          languages: Object.fromEntries(LOCALES.map((l) => [l, `${siteUrl}/${l}${path}`])),
        },
      });
    }
  }

  return entries;
}

function getLastModifiedForPath(path: string): string {
  if (path.startsWith("/learn/")) {
    const slug = path.replace("/learn/", "");
    const article = ARTICLE_STRUCTURES.find((a) => a.slug === slug);
    if (article) return article.updatedDate;
  }
  return new Date().toISOString().slice(0, 10);
}
