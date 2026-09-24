import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildBreadcrumbSchema } from "@/lib/seo/structured-data";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { getSiteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo/site-url";
import { LOCALES } from "@/i18n/config";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "privacyPage" });
  const siteUrl = getSiteUrl();
  const path = "/privacy";
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${siteUrl}/${locale}${path}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${siteUrl}/${l}${path}`])),
    },
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      url: `${siteUrl}/${locale}${path}`,
      type: "website",
      locale,
      siteName: "Money Quest",
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

/**
 * Rewritten for the privacy-first redesign — the previous version of
 * this page described the old account-based architecture, which is no
 * longer true. See docs/privacy-policy.md for the full, lawyer-
 * reviewable version; this in-app page is the plain-language summary.
 * Fully wired into the translation system (privacyPage.* namespace) —
 * found missing during a later audit and fixed then.
 */
export default async function PrivacyPage({ params: { locale } }: PageProps) {
  const t = await getTranslations();
  const siteUrl = getSiteUrl();
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: `${siteUrl}/${locale}` },
    { name: t("privacyPage.title"), url: `${siteUrl}/${locale}/privacy` },
  ]);

  return (
    <div className="min-h-screen bg-fog px-sm py-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-teal">
          {t("nav.backHome")}
        </Link>
        <main>
          <h1 className="mt-sm font-display text-2xl font-bold">{t("privacyPage.title")}</h1>
          <p className="mt-2xs text-sm text-ink/70">{t("privacyPage.subtitle")}</p>

          <div className="mt-md rounded-md border border-ink/10 bg-white p-md">
            <h2 className="font-display text-lg font-bold">{t("privacyPage.section1Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("privacyPage.section1Body")}</p>
          </div>

          <div className="mt-sm rounded-md border border-ink/10 bg-white p-md">
            <h2 className="font-display text-lg font-bold">{t("privacyPage.section2Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("privacyPage.section2Body")}</p>
          </div>

          <div className="mt-sm rounded-md border border-ink/10 bg-white p-md">
            <h2 className="font-display text-lg font-bold">{t("privacyPage.section3Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("privacyPage.section3Body")}</p>
          </div>

          <div className="mt-sm rounded-md border border-ink/10 bg-white p-md">
            <h2 className="font-display text-lg font-bold">{t("privacyPage.section4Title")}</h2>
            <ul className="mt-2xs list-inside list-disc space-y-2xs text-base text-ink/80">
              <li>{t("privacyPage.neverDo1")}</li>
              <li>{t("privacyPage.neverDo2")}</li>
              <li>{t("privacyPage.neverDo3")}</li>
              <li>{t("privacyPage.neverDo4")}</li>
            </ul>
          </div>

          <p className="mt-md text-sm text-ink/70">
            {t("privacyPage.readMorePrefix")}{" "}
            <Link href="/parent-info" className="text-teal">
              {t("privacyPage.parentInfoLink")}
            </Link>
            {t("privacyPage.readMoreMiddle")}{" "}
            <Link href="/contact" className="text-teal">
              {t("privacyPage.contactUsLink")}
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
