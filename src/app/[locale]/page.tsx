import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { HeroIllustration } from "@/components/marketing/HeroIllustration";

export default async function LandingPage() {
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-fog">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-sm py-xs">
          <span className="font-display text-lg font-bold text-teal">{t("common.moneyQuest")}</span>
          <nav className="hidden gap-md text-base md:flex" aria-label={t("a11y.mainNavigationLabel")}>
            <Link href="/learn" className="hover:text-teal">{t("nav.learn")}</Link>
            <Link href="/#how-it-works" className="hover:text-teal">{t("nav.howItWorks")}</Link>
            <Link href="/parent-info" className="hover:text-teal">{t("nav.forParents")}</Link>
            <Link href="/#safety" className="hover:text-teal">{t("nav.safety")}</Link>
          </nav>
          <div className="flex items-center gap-sm">
            <LanguageSwitcher />
            <Link href="/play">
              <Button variant="portal-primary">{t("nav.getStarted")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
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
                <Link href="/play">
                  <Button variant="portal-primary" size="large">{t("landing.ctaGetStartedFree")}</Button>
                </Link>
                <Link href="/#how-it-works">
                  <Button variant="secondary" size="large">{t("landing.ctaSeeHowItWorks")}</Button>
                </Link>
              </div>
              <Link href="/parent-info" className="mt-sm inline-block text-sm text-teal hover:underline">
                {t("nav.forParents")}
              </Link>
            </div>
            <div aria-hidden="true" className="flex justify-center">
              <HeroIllustration className="h-64 w-64 md:h-80 md:w-80" />
            </div>
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
            <Link href="/parent-info" className="mt-sm inline-block text-teal hover:underline">
              Read our full Parent Information page →
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
            <Link href="/parent-info" className="hover:text-teal">{t("nav.forParents")}</Link>
            <Link href="/privacy" className="hover:text-teal">{t("footer.privacy")}</Link>
            <Link href="/feedback" className="hover:text-teal">{t("footer.feedback")}</Link>
            <Link href="/contact" className="hover:text-teal">{t("footer.contact")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
