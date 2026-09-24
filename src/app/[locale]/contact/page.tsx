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
  const t = await getTranslations({ locale, namespace: "contact" });
  const siteUrl = getSiteUrl();
  const path = "/contact";
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

export default async function ContactPage({ params: { locale } }: PageProps) {
  const t = await getTranslations();
  const siteUrl = getSiteUrl();
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: `${siteUrl}/${locale}` },
    { name: t("contact.title"), url: `${siteUrl}/${locale}/contact` },
  ]);
  return (
    <div className="min-h-screen bg-fog px-sm py-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm text-teal">
          ← {t("contact.backHome")}
        </Link>
        <main>
          <h1 className="mt-sm font-display text-2xl font-bold">{t("contact.title")}</h1>
          <p className="mt-sm text-base text-ink/80">{t("contact.intro")}</p>

          <div className="mt-md rounded-md border border-ink/10 bg-white p-md">
            <h2 className="font-display text-lg font-bold">{t("contact.safetyTitle")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("contact.safetyBody")}</p>
          </div>

          <div className="mt-sm rounded-md border border-ink/10 bg-white p-md">
            <h2 className="font-display text-lg font-bold">{t("contact.everythingElseTitle")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("contact.everythingElseBody")}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
