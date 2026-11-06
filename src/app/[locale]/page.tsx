import Image from "next/image";
import {WelcomeMessage} from "@/components/WelcomeMessage";
import {HomepageReviews} from "@/components/HomepageReviews";
import {isSupportedLocale} from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/structured-data";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const siteUrl = getSiteUrl();
  const orgSchema = buildOrganizationSchema(siteUrl);
  const webSiteSchema = buildWebSiteSchema(siteUrl, locale);

  return (
    <div className="min-h-screen bg-fog">
      {/* WebSite + Organization — the two schema types that genuinely
          describe the site as a whole, so they belong on the homepage
          rather than repeated on every page. Both built from real,
          already-displayed facts (the site's own name and URL, plus the
          platform description used by its structured-data helper) — nothing
          fabricated. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(webSiteSchema) }} />

      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-sm py-xs">
          <span className="font-display text-lg font-bold text-teal-text">{t("common.moneyQuest")}</span>
          {/* Sitewide categorized navigation (Learning Adventures, Explore &
              Discover, Library & Museum, Wellbeing & Inclusion, For Parents,
              Information) is the universal nav drawer rendered once in the
              root layout's PageReadAloud bar above — not duplicated here, so
              there's exactly one accessible, tested nav mechanism covering
              every route, not two different ones on the homepage alone. */}
          <div className="flex flex-wrap items-center gap-sm">
            <Link href="/parents/shop" className="hidden md:inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-parent-action px-4 py-3 font-bold text-white shadow-sm"><span aria-hidden="true">▤</span> {t("nav.parentShop")}</Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {/* Hero */}
        <section className="mx-auto max-w-[1200px] px-sm py-2xl md:py-3xl">
          <div className="grid gap-lg md:grid-cols-2 md:items-center">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
                {t("landing.heroTitle")}
              </h1>
              <p className="mt-sm text-lg text-ink/80">
                {t("landing.heroSubtitle")}
              </p>

            </div>
            <div className="relative overflow-hidden rounded-3xl border border-teal/15 bg-cream shadow-lg">
              <picture data-learning-decoration>
                <source media="(max-width: 767px)" srcSet="/images/money-quest/homepage-family-v2-mobile.webp" />
                <Image unoptimized src="/images/money-quest/homepage-family-v2.webp"
                  alt={t("landing.heroImageAlt")} width={1536} height={1024} priority
                  className="h-auto w-full object-cover" />
              </picture>
              <WelcomeMessage/>
              <div className="bg-white px-4 pb-4"><Link href="/play" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal px-5 py-3 text-center font-bold text-white hover:bg-teal/90">{t("landing.ctaGetStartedFree")}</Link></div>
            </div>
          </div>
        </section>


        {/* Three clear age-level entry points. Existing world artwork is retained. */}
        <section aria-labelledby="levels-heading" className="mx-auto max-w-[1200px] px-sm py-2xl">
          <h2 id="levels-heading" className="text-center font-display text-2xl font-bold">{t("play.chooseYourLevel")}</h2>
          <p className="mx-auto mt-2xs max-w-[65ch] text-center text-ink/70">{t("play.levelChoiceHint")}</p>
          <div className="mt-md grid gap-md sm:grid-cols-3">
            {[
              { image: "coin-cove", label: t("play.earlyLearner"), range: t("play.earlyLearnerRange") },
              { image: "market-town", label: t("play.primary"), range: t("play.primaryRange") },
              { image: "golden-vault", label: t("play.olderLearner"), range: t("play.olderLearnerRange") },
            ].map((level) => (
              <Link key={level.image} href="/play" className="group overflow-hidden rounded-2xl border border-teal/20 bg-white shadow-resting transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
                <Image unoptimized src={`/images/money-quest/worlds/${level.image}-thumb.webp`} alt="" width={640} height={400} loading="lazy" className="h-48 w-full object-contain bg-cream p-3 transition-transform motion-safe:group-hover:scale-[1.02]" />
                <div className="p-md text-center">
                  <h3 className="font-display text-xl font-bold text-teal-text">{level.label}</h3>
                  <p className="mt-1 text-ink/70">{level.range}</p>
                  <span className="mt-sm inline-block font-bold text-teal-text">{t("nav.getStarted")} →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Parent shop stays visible; secondary experiences live in the menu. */}
        <section className="mx-auto max-w-[1200px] px-sm pb-2xl" aria-labelledby="parent-shop-heading">
          <div className="grid items-center gap-md overflow-hidden rounded-3xl border border-teal/15 bg-cream p-md md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:p-lg">
            <Image unoptimized src="/images/money-quest/worlds/coin-cove-thumb.webp" alt="" width={480} height={360} loading="lazy" className="mx-auto h-44 w-full rounded-xl object-contain md:h-56" />
            <div>
              <h2 id="parent-shop-heading" className="font-display text-2xl font-bold text-ink">{t("nav.parentShop")}</h2>
              <p className="mt-xs text-ink/80">{t("landing.parentResourcesLink")}</p>
              <Link href="/parents/shop" className="mt-md inline-flex min-h-12 items-center justify-center rounded-xl bg-parent-action px-5 py-3 font-bold text-white">{t("nav.parentShop")} →</Link>
            </div>
          </div>
        </section>
        <HomepageReviews locale={isSupportedLocale(locale)?locale:"en"}/>
      </main>

      <footer className="border-t border-ink/10 bg-white py-md">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-sm px-sm text-sm text-ink/70">
          <span>{t("landing.copyright", { year: new Date().getFullYear() })}</span>
          <div className="flex flex-wrap gap-sm">
            <Link href="/parent-info" className="hover:text-teal-text">{t("nav.forParents")}</Link>
            <Link href="/privacy" className="hover:text-teal-text">{t("footer.privacy")}</Link>
            <Link href="/reviews" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-teal/30 px-3 py-2 font-semibold text-teal-text hover:bg-teal/5"><span aria-hidden="true" className="text-xl text-amber-500">★</span>{t("footer.feedback")}</Link>
            <Link href="/contact" className="hover:text-teal-text">{t("footer.contact")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
