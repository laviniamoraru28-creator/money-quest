import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLocalizedArticle, getAllArticleSlugs } from "@/lib/seo/get-article";
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqSchema } from "@/lib/seo/structured-data";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { getSiteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo/site-url";
import { LOCALES } from "@/i18n/config";
import { Breadcrumbs } from "@/components/marketing/Breadcrumbs";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface PageProps {
  params: { locale: string; slug: string };
}

/**
 * One template renders every /learn article — this is what makes the
 * content architecture scalable: adding article #7 means adding one
 * entry to src/content/articles.ts, never touching this file. Handles,
 * generically for any article: unique per-page metadata, canonical URL,
 * hreflang alternates, Open Graph, Article + BreadcrumbList + (when
 * real FAQs exist) FAQPage structured data, and the internal linking
 * strategy (breadcrumbs up, related articles across, a CTA into the
 * product).
 */
export function generateStaticParams() {
  return getAllArticleSlugs().flatMap((slug) => LOCALES.map((locale) => ({ locale, slug })));
}

export async function generateMetadata({ params: { locale, slug } }: PageProps): Promise<Metadata> {
  const article = await getLocalizedArticle(slug, locale);
  if (!article) return {};

  const siteUrl = getSiteUrl();
  const path = `/learn/${slug}`;

  return {
    title: article.title,
    description: article.metaDescription,
    alternates: {
      canonical: `${siteUrl}/${locale}${path}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${siteUrl}/${l}${path}`])),
    },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url: `${siteUrl}/${locale}${path}`,
      type: "article",
      locale,
      siteName: "Money Quest",
      publishedTime: article.publishedDate,
      modifiedTime: article.updatedDate,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.metaDescription,
    },
  };
}

export default async function ArticlePage({ params: { locale, slug } }: PageProps) {
  const article = await getLocalizedArticle(slug, locale);
  if (!article) notFound();

  const t = await getTranslations({ locale });
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${locale}/learn/${slug}`;

  const breadcrumbItems = [
    { name: "Home", url: `${siteUrl}/${locale}` },
    { name: "Learn", url: `${siteUrl}/${locale}/learn` },
    { name: article.title, url: pageUrl },
  ];

  const articleSchema = buildArticleSchema(article, pageUrl);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
  const faqSchema = article.faqs && article.faqs.length > 0 ? buildFaqSchema(article) : null;

  const relatedArticles = (
    await Promise.all(article.relatedSlugs.map((s) => getLocalizedArticle(s, locale)))
  ).filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <div className="min-h-screen bg-fog">
      {/* Structured data — each one built directly from the same
          `article` object rendered below, so it can never drift from
          what's actually visible on the page. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }} />}

      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-sm py-xs">
          <Link href="/" className="font-display text-lg font-bold text-teal">
            {t("common.moneyQuest")}
          </Link>
          <div className="flex items-center gap-sm">
            <Link href="/learn" className="text-sm text-ink/70 hover:text-teal">
              {t("nav.learn")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[700px] px-sm py-lg">
        <Breadcrumbs
          ariaLabel={t("a11y.breadcrumbLabel")}
          items={[
            { label: t("learnArticle.homeBreadcrumb"), href: "/" },
            { label: t("nav.learn"), href: "/learn" },
            { label: article.title },
          ]}
        />

        <h1 className="mt-sm font-display text-3xl font-bold">{article.title}</h1>
        <p className="mt-2xs text-sm text-ink/70">
          {t("learnArticle.updatedPrefix")} {new Date(article.updatedDate).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-md grid gap-lg">
          {article.sections.map((section, i) => (
            <section key={i}>
              <h2 className="font-display text-xl font-bold">{section.heading}</h2>
              <div className="mt-2xs grid gap-sm text-base leading-relaxed text-ink/80">
                {section.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
              {section.list && (
                <ul className="mt-sm grid gap-2xs pl-md text-base text-ink/80" style={{ listStyleType: "disc" }}>
                  {section.list.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {article.faqs && article.faqs.length > 0 && (
          <section className="mt-lg">
            <h2 className="font-display text-xl font-bold">{t("learnArticle.faqHeading")}</h2>
            <div className="mt-sm grid gap-sm">
              {article.faqs.map((faq, i) => (
                <div key={i} className="rounded-md border border-ink/10 bg-white p-sm">
                  <h3 className="font-medium">{faq.question}</h3>
                  <p className="mt-2xs text-sm text-ink/70">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Internal linking strategy, part 1: related content within
            the topic cluster (see seo-strategy.md §6) — driven by
            article.relatedSlugs, not hand-placed links in prose. */}
        {relatedArticles.length > 0 && (
          <section className="mt-lg border-t border-ink/10 pt-md">
            <h2 className="font-display text-lg font-bold">{t("learnArticle.relatedHeading")}</h2>
            <ul className="mt-sm grid gap-2xs">
              {relatedArticles.map((related) => (
                <li key={related.slug}>
                  <Link href={`/learn/${related.slug}`} className="font-medium text-teal hover:underline">
                    {related.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Internal linking strategy, part 2: a single, honest
            conversion link into the product — not a repeated or
            pushy CTA, one clear next step. */}
        <div className="mt-lg rounded-lg border-2 border-teal bg-teal/5 p-md text-center">
          <p className="font-display text-lg font-bold">{t("learnArticle.ctaTitle")}</p>
          <p className="mt-2xs text-sm text-ink/70">{t("learnArticle.ctaBody")}</p>
          <Link
            href="/play"
            className="mt-sm inline-block rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting hover:bg-teal/90"
          >
            {t("landing.ctaGetStartedFree")}
          </Link>
        </div>
      </main>
    </div>
  );
}
