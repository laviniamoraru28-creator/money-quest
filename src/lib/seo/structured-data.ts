import type { Article } from "@/content/types";

/**
 * Every function here builds a schema.org JSON-LD object that MUST
 * describe something genuinely visible on the same page — this is the
 * concrete implementation of "do not use misleading SEO techniques"
 * for structured data specifically. FAQPage schema is only ever built
 * from an article's own real faqs array (never fabricated to game a
 * rich-result eligibility check), and Article schema's dates/author
 * fields are the article's own real data, never backdated or invented.
 */

const SITE_NAME = "Money Quest";

export function buildArticleSchema(article: Article, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedDate,
    dateModified: article.updatedDate,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    audience: article.audience.map((a) => ({ "@type": "Audience", audienceType: a })),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export interface BreadcrumbEntry {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(entries: BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.url,
    })),
  };
}

/**
 * Only called for an article that actually HAS a real faqs array with
 * at least one entry — see the [slug]/page.tsx template, which checks
 * `article.faqs && article.faqs.length > 0` before calling this. Never
 * built from an empty or synthetic FAQ list.
 */
export function buildFaqSchema(article: Article) {
  if (!article.faqs || article.faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function buildOrganizationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    description: "A free financial literacy platform for children 6-14, built with families and teachers in mind.",
  };
}
