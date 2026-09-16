import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllArticles } from "@/lib/seo/get-article";
import { buildBreadcrumbSchema, buildOrganizationSchema } from "@/lib/seo/structured-data";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";
import { LOCALES } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "learnHub" });
  const siteUrl = getSiteUrl();
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${siteUrl}/${locale}/learn`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${siteUrl}/${l}/learn`])),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${siteUrl}/${locale}/learn`,
      type: "website",
      locale,
      siteName: "Money Quest",
    },
  };
}

export default async function LearnHubPage({ params: { locale } }: PageProps) {
  const t = await getTranslations({ locale });
  const articles = await getAllArticles(locale);
  const siteUrl = getSiteUrl();

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: `${siteUrl}/${locale}` },
    { name: "Learn", url: `${siteUrl}/${locale}/learn` },
  ]);
  const orgSchema = buildOrganizationSchema(siteUrl);

  return (
    <div className="min-h-screen bg-fog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgSchema) }} />

      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-sm py-xs">
          <Link href="/" className="font-display text-lg font-bold text-teal">
            {t("common.moneyQuest")}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-sm py-lg">
        <h1 className="font-display text-3xl font-bold">{t("learnHub.title")}</h1>
        <p className="mt-sm max-w-[65ch] text-lg text-ink/70">
          {t("learnHub.introPrefix")}{" "}
          <Link href="/" className="text-teal hover:underline">
            {t("common.moneyQuest")}
          </Link>
          {t("learnHub.introSuffix")}
        </p>

        <div className="mt-lg grid gap-md sm:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/learn/${article.slug}`}
              className="block rounded-lg border border-ink/10 bg-white p-md shadow-resting transition-shadow duration-quick hover:shadow-floating"
            >
              <h2 className="font-display text-lg font-bold text-ink">{article.title}</h2>
              <p className="mt-2xs text-sm text-ink/70">{article.metaDescription}</p>
              <p className="mt-sm text-xs uppercase tracking-wide text-ink/70">
                {article.audience.join(" · ")}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-lg rounded-lg border-2 border-teal bg-teal/5 p-md text-center">
          <p className="font-display text-lg font-bold">{t("learnHub.ctaTitle")}</p>
          <p className="mt-2xs text-sm text-ink/70">{t("learnHub.ctaBody")}</p>
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
