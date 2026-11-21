import Image from "next/image";
import {WORLDS} from "@/content/worlds";
import {ChooseLearningLevelLink} from "@/components/ChooseLearningLevelLink";
import {certificateJourneyCopy} from "@/content/certificate-journey-copy";
import {isSupportedLocale} from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/structured-data";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";

const previewCopy: Record<string, readonly string[]> = {
  "en": [
    "Explore what children actually do",
    "A learning journey, not just a list of lessons",
    "Discover places, make choices and practise skills at your own pace.",
    "Explore the library",
    "Visit the museum",
    "See the learning journey",
    "For parents and teachers",
    "Explore the activities before you choose an age level. Progress stays on this device.",
    "Explore the seven money worlds"
  ],
  "ro": [
    "Descoperă ce fac copiii",
    "O aventură de învățare, nu doar o listă de lecții",
    "Descoperă locuri, ia decizii și exersează în ritmul tău.",
    "Explorează biblioteca",
    "Vizitează muzeul",
    "Vezi parcursul educațional",
    "Pentru părinți și profesori",
    "Explorează activitățile înainte de a alege nivelul. Progresul rămâne pe acest dispozitiv.",
    "Explorează cele șapte lumi ale banilor"
  ],
  "es": [
    "Descubre lo que hacen los niños",
    "Un recorrido de aprendizaje, no solo lecciones",
    "Explora lugares, toma decisiones y practica a tu ritmo.",
    "Explora la biblioteca",
    "Visita el museo",
    "Descubre el recorrido",
    "Para familias y docentes",
    "Explora las actividades antes de elegir un nivel. El progreso se guarda en este dispositivo.",
    "Explora los siete mundos del dinero"
  ],
  "fr": [
    "Découvrez les activités des enfants",
    "Un parcours éducatif, pas seulement des leçons",
    "Explore des lieux, fais des choix et progresse à ton rythme.",
    "Explorer la bibliothèque",
    "Visiter le musée",
    "Voir le parcours",
    "Pour les parents et enseignants",
    "Découvrez les activités avant de choisir un niveau. La progression reste sur cet appareil.",
    "Explore les sept mondes de l’argent"
  ],
  "de": [
    "Entdecke, was Kinder hier tun",
    "Ein Lernabenteuer statt einer Liste von Lektionen",
    "Erkunde Orte, triff Entscheidungen und übe in deinem Tempo.",
    "Bibliothek entdecken",
    "Museum besuchen",
    "Lernweg ansehen",
    "Für Eltern und Lehrkräfte",
    "Sieh dir die Aktivitäten an, bevor du eine Altersstufe wählst. Fortschritte bleiben auf diesem Gerät.",
    "Entdecke die sieben Geldwelten"
  ],
  "it": [
    "Scopri cosa fanno i bambini",
    "Un percorso di apprendimento, non solo lezioni",
    "Esplora luoghi, prendi decisioni e impara al tuo ritmo.",
    "Esplora la biblioteca",
    "Visita il museo",
    "Scopri il percorso",
    "Per genitori e insegnanti",
    "Esplora le attività prima di scegliere un livello. I progressi restano su questo dispositivo.",
    "Esplora i sette mondi del denaro"
  ],
  "pt": [
    "Descobre o que as crianças fazem",
    "Uma jornada de aprendizagem, não apenas lições",
    "Explora lugares, toma decisões e aprende ao teu ritmo.",
    "Explorar a biblioteca",
    "Visitar o museu",
    "Ver o percurso",
    "Para pais e professores",
    "Explora as atividades antes de escolher um nível. O progresso fica neste dispositivo.",
    "Explora os sete mundos do dinheiro"
  ],
  "nl": [
    "Ontdek wat kinderen doen",
    "Een leeravontuur, niet alleen lessen",
    "Verken plekken, maak keuzes en oefen in je eigen tempo.",
    "Ontdek de bibliotheek",
    "Bezoek het museum",
    "Bekijk het leertraject",
    "Voor ouders en leerkrachten",
    "Bekijk de activiteiten voordat je een niveau kiest. Voortgang blijft op dit apparaat.",
    "Ontdek de zeven geldwerelden"
  ],
  "pl": [
    "Zobacz, co robią dzieci",
    "Przygoda edukacyjna, nie tylko lista lekcji",
    "Odkrywaj miejsca, podejmuj decyzje i ucz się we własnym tempie.",
    "Odkryj bibliotekę",
    "Odwiedź muzeum",
    "Zobacz ścieżkę nauki",
    "Dla rodziców i nauczycieli",
    "Poznaj aktywności przed wyborem poziomu. Postępy pozostają na tym urządzeniu.",
    "Odkryj siedem światów pieniędzy"
  ]
};

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const journey=certificateJourneyCopy[isSupportedLocale(locale)?locale:"en"];
  const siteUrl = getSiteUrl();
  const preview = previewCopy[locale] ?? previewCopy.en;
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
              <picture data-homepage-hero>
                <source media="(max-width: 767px)" srcSet="/images/money-quest/homepage-family-v2-mobile.webp" />
                <Image unoptimized src="/images/money-quest/homepage-family-v2.webp"
                  alt={t("landing.heroImageAlt")} width={1536} height={1024} priority
                  className="h-auto w-full object-cover" />
              </picture>
              <div className="bg-white px-4 pb-4"><Link href="/play" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal px-5 py-3 text-center font-bold text-white hover:bg-teal/90">{t("landing.ctaGetStartedFree")}</Link></div>
            </div>
          </div>
        </section>


        {/* Three clear age-level entry points. Existing world artwork is retained. */}
        <section aria-labelledby="levels-heading" className="mx-auto max-w-[1200px] px-sm py-2xl">
          <h2 id="levels-heading" className="text-center font-display text-2xl font-bold">{t("play.chooseYourLevel")}</h2>
          <p className="mx-auto mt-2xs max-w-[65ch] text-center text-ink/70">{t("play.levelChoiceHint")}</p>
          <div className="mt-md grid gap-md sm:grid-cols-3">
            {([
              { ageBand: "explorer", image: "coin-cove", label: t("play.earlyLearner"), range: t("play.earlyLearnerRange") },
              { ageBand: "builder", image: "market-town", label: t("play.primary"), range: t("play.primaryRange") },
              { ageBand: "strategist", image: "golden-vault", label: t("play.olderLearner"), range: t("play.olderLearnerRange") },
            ] as const).map((level) => (
              <ChooseLearningLevelLink key={level.image} ageBand={level.ageBand} className="group overflow-hidden rounded-2xl border border-teal/20 bg-white shadow-resting transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
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

        <section aria-labelledby="worlds-preview-heading" className="mx-auto max-w-[1200px] px-sm pb-2xl">
          <h2 id="worlds-preview-heading" className="font-display text-2xl font-bold text-ink">{preview[8]}</h2>
          <div className="mt-md grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
            {WORLDS.map((world) => (
              <Link key={world.id} href="/play" className="group flex items-center gap-3 rounded-2xl border-2 bg-white p-3 shadow-resting focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal" style={{borderColor:world.themeColor}}>
                <Image unoptimized src={`/images/money-quest/worlds/${world.id}-thumb.webp`} alt="" width={112} height={112} loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-ink/70">{world.orderIndex} / {WORLDS.length}</span>
                  <span className="block font-display font-bold text-ink">{world.name}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Show genuine existing destinations instead of invented product claims. */}
        <section aria-labelledby="discover-heading" className="mx-auto max-w-[1200px] px-sm pb-2xl">
          <div className="rounded-3xl border border-teal/20 bg-white p-md md:p-lg">
            <p className="font-bold text-teal-text">{preview[0]}</p>
            <h2 id="discover-heading" className="mt-2 font-display text-2xl font-bold text-ink">{preview[1]}</h2>
            <p className="mt-3 max-w-[65ch] text-ink/80">{preview[2]}</p>
            <div className="mt-md grid gap-md sm:grid-cols-2">
              <Link href="/library" className="group overflow-hidden rounded-2xl border border-teal/20 bg-cream focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
                <Image unoptimized src="/images/money-quest/sections/library.webp" alt="" width={720} height={420} loading="lazy" className="h-48 w-full object-contain p-3 transition-transform motion-safe:group-hover:scale-[1.02]" />
                <span className="block p-4 font-bold text-teal-text">{preview[3]} →</span>
              </Link>
              <Link href="/museum" className="group overflow-hidden rounded-2xl border border-teal/20 bg-cream focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
                <Image unoptimized src="/images/money-quest/sections/museum.webp" alt="" width={720} height={420} loading="lazy" className="h-48 w-full object-contain p-3 transition-transform motion-safe:group-hover:scale-[1.02]" />
                <span className="block p-4 font-bold text-teal-text">{preview[4]} →</span>
              </Link>
            </div>
            <div className="mt-md flex flex-wrap gap-3">
              <Link href="/play" className="inline-flex min-h-12 items-center rounded-xl bg-teal px-5 py-3 font-bold text-white hover:bg-teal/90">{preview[5]} →</Link>
              <Link href="/parent-info" className="inline-flex min-h-12 items-center rounded-xl border border-teal px-5 py-3 font-bold text-teal-text hover:bg-cream">{preview[6]} →</Link>
            </div>
            <p className="mt-4 text-sm text-ink/70">{preview[7]}</p>
          </div>
        </section>

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
