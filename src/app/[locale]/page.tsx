import {cinematicCopy} from "@/content/cinematic-copy";
import {CinematicScene} from "@/components/CinematicScene";
import Image from "next/image";
import {CinematicWorldHero} from "@/components/CinematicWorldHero";
import "@/styles/cinematic-universe.css";
import { HomepageMissionPreview } from "@/components/HomepageMissionPreview";
import {ChooseLearningLevelLink} from "@/components/ChooseLearningLevelLink";
import {certificateJourneyCopy} from "@/content/certificate-journey-copy";
import {isSupportedLocale} from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/structured-data";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const journey=certificateJourneyCopy[isSupportedLocale(locale)?locale:"en"];
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

      <main id="main-content" tabIndex={-1}>
        <CinematicWorldHero
          title={t("landing.heroTitle")}
          subtitle={t("landing.heroSubtitle")}
          cta={cinematicCopy[isSupportedLocale(locale)?locale:"en"][3]}
          href="#levels-heading"
          poster="/cinematic/world/homepage-worlds-original.webp"
          video="/cinematic/world/homepage-worlds-original.mp4"
        />

        

        {/* Three clear age-level entry points. Existing world artwork is retained. */}
        <section aria-labelledby="levels-heading" className="mx-auto max-w-[1200px] px-sm py-2xl">
          <h2 id="levels-heading" className="text-center font-display text-2xl font-bold">{t("play.chooseYourLevel")}</h2>
          <p className="mx-auto mt-2xs max-w-[65ch] text-center text-ink/70">{t("play.levelChoiceHint")}</p>
          <CinematicScene src="/cinematic/world/age-portals.mp4" poster="/cinematic/world/age-portals.webp" className="mx-auto mt-4 max-h-60 w-full rounded-2xl object-contain"/>
          <div className="mq-cinematic mt-md grid gap-md sm:grid-cols-3">
            {([
              { ageBand: "explorer", image: "coin-cove", label: t("play.earlyLearner"), range: t("play.earlyLearnerRange") },
              { ageBand: "builder", image: "market-town", label: t("play.primary"), range: t("play.primaryRange") },
              { ageBand: "strategist", image: "golden-vault", label: t("play.olderLearner"), range: t("play.olderLearnerRange") },
            ] as const).map((level) => (
              <ChooseLearningLevelLink key={level.image} ageBand={level.ageBand} className="mq-age-portal group overflow-hidden rounded-2xl border border-teal/20 bg-white shadow-resting transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
                <Image unoptimized src={`/images/money-quest/worlds/${level.image}-thumb.webp`} alt="" width={640} height={400} loading="lazy" className="h-48 w-full object-contain bg-cream p-3 transition-transform motion-safe:group-hover:scale-[1.02]" />
                <div className="p-md text-center">
                  <h3 className="font-display text-xl font-bold text-teal-text">{level.label}</h3>
                  <p className="mt-1 text-ink/70">{level.range}</p>
                  <span className="mt-sm inline-block font-bold text-teal-text">{t("nav.getStarted")} →</span>
                </div>
              </ChooseLearningLevelLink>
            ))}
          </div>
        </section>

        <HomepageMissionPreview locale={locale} />
        <section aria-labelledby="how-it-works-heading" className="mx-auto max-w-[1200px] px-sm pb-2xl">
          <div className="rounded-2xl border border-teal/20 bg-white p-md md:p-lg">
            <h2 id="how-it-works-heading" className="font-display text-2xl font-bold">{journey.heading}</h2>
            <p className="mt-3">{journey.steps}</p>
            <p className="mt-3">{journey.print}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10 bg-white py-md">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-sm px-sm text-sm text-ink/70">
          <span>{t("landing.copyright", { year: new Date().getFullYear() })}</span>
          <div className="flex flex-wrap gap-sm">
            <Link href="/parent-info" className="hover:text-teal-text">{t("nav.forParents")}</Link>
            <Link href="/privacy" className="hover:text-teal-text">{t("footer.privacy")}</Link>
            <Link href="/contact" className="hover:text-teal-text">{t("footer.contact")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
