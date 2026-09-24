import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/seo/site-url";
import { LOCALES } from "@/i18n/config";

interface LayoutProps {
  params: { locale: string };
}

/**
 * page.tsx here is a client component ("use client", for the rating
 * form's local state), so it can't export generateMetadata itself —
 * that's a server-only API. A sibling layout.tsx is the standard way
 * to attach metadata to a route whose page is client-rendered.
 *
 * Deliberately noindex: this page is a feedback form whose only real
 * content is a rating widget and a comment box (see page.tsx) — there
 * is nothing here for a search result to usefully show, and every
 * submission is stored in the visitor's own browser only (no backend
 * to aggregate results into a page worth ranking). `follow: true` so
 * a crawler can still reach anything genuinely linked from this page.
 */
export async function generateMetadata({ params: { locale } }: LayoutProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "feedback" });
  const siteUrl = getSiteUrl();
  const path = "/feedback";
  return {
    title: t("title"),
    description: t("metaDescription"),
    robots: { index: false, follow: true },
    alternates: {
      canonical: `${siteUrl}/${locale}${path}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${siteUrl}/${l}${path}`])),
    },
  };
}

export default function FeedbackLayout({ children }: LayoutProps & { children: ReactNode }) {
  return children;
}
