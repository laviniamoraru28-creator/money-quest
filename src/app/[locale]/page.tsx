import {publicNavigationCopy} from "@/content/public-navigation-copy";
import {discoveryCopy} from "@/content/discovery-copy";
import Image from "next/image";
import {WelcomeMessage} from "@/components/WelcomeMessage";
import {experienceCopy} from "@/content/experience-copy";
import {isSupportedLocale} from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/structured-data";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const language=isSupportedLocale(locale)?locale:"en",copy=publicNavigationCopy[language],discovery=discoveryCopy[language];
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
          <nav className="hidden gap-md text-base md:flex" aria-label={t("a11y.mainNavigationLabel")}>
            <Link href="/library" className="hover:text-teal-text">{discovery.library}</Link>
            <Link href="/museum" className="hover:text-teal-text">{discovery.museum}</Link>
            <Link href="/learn" className="hover:text-teal-text">{t("nav.learn")}</Link>
            <Link href="/#how-it-works" className="hover:text-teal-text">{t("nav.howItWorks")}</Link>
            <Link href="/parent-info" className="hover:text-teal-text">{t("nav.forParents")}</Link>
            <Link href="/#safety" className="hover:text-teal-text">{t("nav.safety")}</Link>
          </nav>
          <div className="flex w-full flex-wrap items-center gap-sm md:w-auto">
            <Link href="/parents/shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-parent-action px-4 py-3 font-bold text-white shadow-sm"><span aria-hidden="true">▤</span> {t("nav.parentShop")}</Link>
            <Link href="/play" className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 font-medium bg-teal text-white hover:bg-teal/90">{t("nav.getStarted")}</Link>
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
              <div className="mt-md flex flex-wrap gap-xs">
                <Link href="/play" className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 font-medium bg-teal text-white hover:bg-teal/90">{t("landing.ctaGetStartedFree")}</Link>
                <Link href="/#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 font-medium border border-teal text-teal-text hover:bg-teal/5">{t("landing.ctaSeeHowItWorks")}</Link>
              </div>
              <Link href="/explorer" className="mt-4 block min-h-12 rounded-xl border-2 border-teal bg-white px-4 py-3 font-bold text-teal-text">{experienceCopy[isSupportedLocale(locale)?locale:"en"].visual} →</Link>
              <Link href="/parent-info" className="mt-sm inline-block text-sm text-teal-text hover:underline">
                {t("nav.forParents")}
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-teal/15 bg-cream shadow-lg">
              <picture>
                <source media="(max-width: 767px)" srcSet="/images/money-quest/homepage-family-v2-mobile.webp" />
                <Image unoptimized src="/images/money-quest/homepage-family-v2.webp"
                  alt={t("landing.heroImageAlt")} width={1536} height={1024} priority
                  className="h-auto w-full object-cover" />
              </picture>
              <WelcomeMessage/>
            </div>
          </div>
        </section>

        {/* Authored, interactive learning spaces. */}
        {(
          <section aria-labelledby="future-labs-heading" className="mx-auto max-w-[1200px] px-sm py-2xl">
            <h2 id="future-labs-heading" className="font-display text-2xl font-bold">{copy.discover}</h2>
            <p className="mt-2xs text-base text-ink/70">{copy.discoverIntro}</p>
            <div className="mt-md grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                { slug:"brain-lab",name:copy.brain },
                { slug:"mind-lab",name:copy.mind },
                { slug:"future-skills",name:copy.future },
                { slug:"inclusive-learning",name:copy.inclusive },
              ].map((lab) => (
                <Link href={`/${lab.slug}`} key={lab.slug} className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-resting">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image unoptimized src={`/images/money-quest/sections/${lab.slug === "brain-lab" ? "brain-lab-v2" : lab.slug}-thumb.webp`} alt="" width={320} height={320} loading="lazy" className="h-auto w-full" />
                  <div className="p-sm">
                    <h3 className="font-display text-lg font-bold">{lab.name}</h3>
                    <p className="mt-2xs text-sm text-teal-text">{copy.explore} →</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Independent discovery experiences, no Godot required */}
        <section className="mx-auto max-w-[1200px] px-sm py-xl" aria-labelledby="discovery-heading">
          <h2 id="discovery-heading" className="font-display text-2xl font-bold">{copy.discoveryTitle}</h2>
          <p className="mt-xs text-ink/70">{copy.discoveryIntro}</p>
          <div className="mt-md grid gap-md md:grid-cols-2">
            <Link href="/library" className="rounded-2xl border border-ink/10 bg-white p-lg hover:border-teal focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
              <Image unoptimized src="/images/money-quest/sections/library-thumb.webp" alt="" width={320} height={320} loading="lazy" className="mb-4 h-44 w-full rounded-xl object-contain"/><h3 className="mt-xs font-display text-xl font-bold">{discovery.libraryTitle}</h3>
              <p className="mt-xs">{copy.libraryBody}</p>
              <span className="mt-sm inline-block font-bold text-teal-text">{discovery.visitLibrary} →</span>
            </Link>
            <Link href="/museum" className="rounded-2xl border border-ink/10 bg-white p-lg hover:border-teal focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
              <Image unoptimized src="/images/money-quest/sections/museum-thumb.webp" alt="" width={320} height={320} loading="lazy" className="mb-4 h-44 w-full rounded-xl object-contain"/><h3 className="mt-xs font-display text-xl font-bold">{discovery.museumTitle}</h3>
              <p className="mt-xs">{copy.museumBody}</p>
              <span className="mt-sm inline-block font-bold text-teal-text">{discovery.visitMuseum} →</span>
            </Link>
          </div>
        </section>
        {/* Why free */}
        <section className="border-y border-ink/10 bg-white py-lg">
          <div className="mx-auto max-w-[1200px] px-sm text-center">
            <p className="text-base text-ink/70">
              {t("landing.whyFree")}
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-[1200px] px-sm py-2xl">
          <h2 className="font-display text-2xl font-bold">{t("landing.howItWorksTitle")}</h2>
          <div className="mt-md grid gap-md md:grid-cols-3">
            <Card variant="activity">
              <h3 className="font-display text-lg font-bold">{t("landing.step1Title")}</h3>
              <p className="mt-2xs text-base text-ink/70">{t("landing.step1Body")}</p>
            </Card>
            <Card variant="activity">
              <h3 className="font-display text-lg font-bold">{t("landing.step2Title")}</h3>
              <p className="mt-2xs text-base text-ink/70">{t("landing.step2Body")}</p>
            </Card>
            <Card variant="activity">
              <h3 className="font-display text-lg font-bold">{t("landing.step3Title")}</h3>
              <p className="mt-2xs text-base text-ink/70">{t("landing.step3Body")}</p>
            </Card>
          </div>
        </section>

        {/* For parents */}
        <section id="for-parents" className="bg-white py-2xl">
          <div className="mx-auto max-w-[1200px] px-sm">
            <h2 className="font-display text-2xl font-bold">{t("landing.forParentsTitle")}</h2>
            <ul className="mt-md grid gap-xs text-base text-ink/80 md:grid-cols-2">
              <li>✓ {t("landing.trust1")}</li>
              <li>✓ {t("landing.trust2")}</li>
              <li>✓ {t("landing.trust3")}</li>
              <li>✓ {t("landing.trust4")}</li>
            </ul>
            <Link href="/parents/resources" className="mt-6 mr-5 inline-flex min-h-12 items-center rounded-xl bg-parent-action px-5 py-3 font-bold text-white">{t("landing.parentResourcesLink")}</Link>
            <Link href="/explorer" className="mt-4 block min-h-12 rounded-xl border-2 border-teal bg-white px-4 py-3 font-bold text-teal-text">{experienceCopy[isSupportedLocale(locale)?locale:"en"].visual} →</Link>
              <Link href="/parent-info" className="mt-sm inline-block text-teal-text hover:underline">
              {t("landing.readFullParentInfoLink")}
            </Link>
          </div>
        </section>

        {/* Safety */}
        <section id="safety" className="mx-auto max-w-[1200px] px-sm py-2xl">
          <h2 className="font-display text-2xl font-bold">{t("landing.safetyTitle")}</h2>
          <p className="mt-sm max-w-[70ch] text-base text-ink/80">
            {t("landing.safetyBody")}
          </p>
        </section>
      </main>

      <footer className="border-t border-ink/10 bg-white py-md">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-sm px-sm text-sm text-ink/70">
          <span>{t("landing.copyright", { year: new Date().getFullYear() })}</span>
          <div className="flex flex-wrap gap-sm">
            <Link href="/parent-info" className="hover:text-teal-text">{t("nav.forParents")}</Link>
            <Link href="/privacy" className="hover:text-teal-text">{t("footer.privacy")}</Link>
            <Link href="/feedback" className="hover:text-teal-text">{t("footer.feedback")}</Link>
            <Link href="/contact" className="hover:text-teal-text">{t("footer.contact")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
