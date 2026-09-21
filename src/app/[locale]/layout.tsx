import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Space_Grotesk, Atkinson_Hyperlegible } from "next/font/google";
import { LOCALES, getTextDirection, isSupportedLocale, type Locale } from "@/i18n/config";
import "../globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});

// Pre-renders a static page per locale at build time rather than
// resolving locale only at request time — this is also what makes the
// /en/, /ro/, /es/ ... URL structure genuinely crawlable (brief
// requirement 14), not just technically reachable.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Explicit, rather than relying on Next.js's implicit default —
 * self-documents a real accessibility decision: zoom is deliberately
 * NEVER disabled anywhere in this app. `maximum-scale=1,
 * user-scalable=no` is a common but genuinely harmful pattern (it
 * breaks pinch-zoom for low-vision users who rely on it, violating
 * WCAG 1.4.4 Resize Text) — this export exists so a future edit adding
 * that pattern "for a more native feel" has to consciously override an
 * explicit, documented choice rather than just add an implicit
 * default that happened to be safe.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximumScale, no userScalable: false — zoom stays available.
};

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isSupportedLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    title: { default: t("defaultTitle"), template: `%s - Money Quest` },
    description: t("defaultDescription"),
    // hreflang alternates (brief requirement 14) — one entry per
    // supported locale, pointing at the same page in each language, so
    // search engines know these pages are translations of each other
    // rather than duplicate content.
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      locale,
      alternateLocale: LOCALES.filter((l) => l !== locale),
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = getTextDirection(locale as Locale);

  return (
    <html lang={locale} dir={direction} className={`${spaceGrotesk.variable} ${atkinsonHyperlegible.variable}`}>
      <body>
        {/* locale={locale} is required here, not optional — without it,
            next-intl's CLIENT-side context (what useLocale()/useTranslations()
            read from inside every "use client" component) doesn't reliably
            know which locale it's in, independent of the SERVER-rendered
            messages already being correct above. This was the actual root
            cause of /ro loading but showing English: every client
            component, including LanguageSwitcher (which calls useLocale()
            directly to know both what to display as "current" and what to
            switch away from), was reading an unreliable/default locale
            regardless of the URL. */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
