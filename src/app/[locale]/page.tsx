import Image from "next/image";
import {ChooseLearningLevelLink} from "@/components/ChooseLearningLevelLink";
import {certificateJourneyCopy} from "@/content/certificate-journey-copy";
import {isSupportedLocale} from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/structured-data";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";

const questCopy: Record<string, readonly string[]> = {
  "en": [
    "Explore the quests",
    "Money Quest",
    "Financial choices and saving",
    "Entrepreneur Quest",
    "Ideas and small businesses",
    "Leadership Quest",
    "Teamwork and responsibility",
    "Real Life Quests",
    "Practice in everyday life",
    "AI Quest",
    "Try AI learning activities",
    "Coming soon"
  ],
  "ro": [
    "Descoperă questurile",
    "Money Quest",
    "Bani, alegeri și economisire",
    "Entrepreneur Quest",
    "Idei și mici afaceri",
    "Leadership Quest",
    "Colaborare și responsabilitate",
    "Real Life Quests",
    "Exersare în viața reală",
    "AI Quest",
    "Încearcă activitățile despre AI",
    "În pregătire"
  ],
  "es": [
    "Explora las misiones",
    "Money Quest",
    "Dinero, decisiones y ahorro",
    "Entrepreneur Quest",
    "Ideas y pequeños negocios",
    "Leadership Quest",
    "Colaboración y responsabilidad",
    "Real Life Quests",
    "Práctica en la vida real",
    "AI Quest",
    "Prueba actividades de IA",
    "Próximamente"
  ],
  "fr": [
    "Explore les parcours",
    "Money Quest",
    "Argent, choix et épargne",
    "Entrepreneur Quest",
    "Idées et petites entreprises",
    "Leadership Quest",
    "Coopération et responsabilité",
    "Real Life Quests",
    "Pratique au quotidien",
    "AI Quest",
    "Découvre les activités IA",
    "À venir"
  ],
  "de": [
    "Entdecke die Quests",
    "Money Quest",
    "Geld, Entscheidungen und Sparen",
    "Entrepreneur Quest",
    "Ideen und kleine Unternehmen",
    "Leadership Quest",
    "Teamarbeit und Verantwortung",
    "Real Life Quests",
    "Üben im Alltag",
    "AI Quest",
    "KI-Aktivitäten ausprobieren",
    "In Vorbereitung"
  ],
  "it": [
    "Esplora i percorsi",
    "Money Quest",
    "Denaro, scelte e risparmio",
    "Entrepreneur Quest",
    "Idee e piccole imprese",
    "Leadership Quest",
    "Collaborazione e responsabilità",
    "Real Life Quests",
    "Pratica nella vita reale",
    "AI Quest",
    "Prova le attività sull’IA",
    "In arrivo"
  ],
  "pt": [
    "Explora as missões",
    "Money Quest",
    "Dinheiro, escolhas e poupança",
    "Entrepreneur Quest",
    "Ideias e pequenos negócios",
    "Leadership Quest",
    "Colaboração e responsabilidade",
    "Real Life Quests",
    "Prática na vida real",
    "AI Quest",
    "Experimenta atividades de IA",
    "Em breve"
  ],
  "nl": [
    "Ontdek de quests",
    "Money Quest",
    "Geld, keuzes en sparen",
    "Entrepreneur Quest",
    "Ideeën en kleine bedrijven",
    "Leadership Quest",
    "Samenwerken en verantwoordelijkheid",
    "Real Life Quests",
    "Oefenen in het dagelijks leven",
    "AI Quest",
    "Probeer AI-activiteiten",
    "Binnenkort"
  ],
  "pl": [
    "Poznaj ścieżki",
    "Money Quest",
    "Pieniądze, wybory i oszczędzanie",
    "Entrepreneur Quest",
    "Pomysły i małe firmy",
    "Leadership Quest",
    "Współpraca i odpowiedzialność",
    "Real Life Quests",
    "Ćwiczenia w codziennym życiu",
    "AI Quest",
    "Wypróbuj ćwiczenia o AI",
    "Wkrótce"
  ]
};

const valueCopy: Record<string, readonly string[]> = {
  "en": [
    "Four skills for the future",
    "Money, business, leadership and AI. Explore each through age-appropriate activities.",
    "Free to explore. No child account required. Progress stays on this device."
  ],
  "ro": [
    "Patru competențe pentru viitor",
    "Bani, antreprenoriat, leadership și AI. Descoperă-le prin activități adaptate vârstei.",
    "Acces gratuit. Fără cont pentru copil. Progresul rămâne pe acest dispozitiv."
  ],
  "es": [
    "Cuatro habilidades para el futuro",
    "Dinero, emprendimiento, liderazgo e IA con actividades para cada edad.",
    "Acceso gratuito. Sin cuenta infantil. El progreso permanece en este dispositivo."
  ],
  "fr": [
    "Quatre compétences pour l’avenir",
    "Argent, entrepreneuriat, leadership et IA, avec des activités adaptées à l’âge.",
    "Accès gratuit. Aucun compte enfant requis. La progression reste sur cet appareil."
  ],
  "de": [
    "Vier Fähigkeiten für die Zukunft",
    "Geld, Unternehmertum, Führung und KI mit altersgerechten Aktivitäten.",
    "Kostenlos nutzbar. Kein Kinderkonto nötig. Fortschritte bleiben auf diesem Gerät."
  ],
  "it": [
    "Quattro competenze per il futuro",
    "Denaro, imprenditorialità, leadership e IA con attività adatte all’età.",
    "Accesso gratuito. Nessun account per bambini. I progressi restano su questo dispositivo."
  ],
  "pt": [
    "Quatro competências para o futuro",
    "Dinheiro, empreendedorismo, liderança e IA com atividades adequadas à idade.",
    "Acesso gratuito. Sem conta infantil. O progresso fica neste dispositivo."
  ],
  "nl": [
    "Vier vaardigheden voor de toekomst",
    "Geld, ondernemen, leiderschap en AI met activiteiten voor elke leeftijd.",
    "Gratis te gebruiken. Geen kinderaccount nodig. Voortgang blijft op dit apparaat."
  ],
  "pl": [
    "Cztery umiejętności na przyszłość",
    "Pieniądze, przedsiębiorczość, przywództwo i AI w ćwiczeniach dopasowanych do wieku.",
    "Bezpłatny dostęp. Bez konta dziecka. Postępy pozostają na tym urządzeniu."
  ]
};

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
  const preview = previewCopy[locale] ?? previewCopy.en!;
  const questLabels = questCopy[locale] ?? questCopy.en!;
  const values = valueCopy[locale] ?? valueCopy.en!;
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

        <section aria-labelledby="quests-heading" className="mx-auto max-w-[1200px] px-sm pb-2xl">
          <h2 id="quests-heading" className="font-display text-2xl font-bold text-ink">{values[0]}</h2>
          <p className="mt-2 max-w-[65ch] text-ink/80">{values[1]}</p>
          <div className="mt-md grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
            {([
              {title:questLabels[1], description:questLabels[2], icon:"🪙", href:"/play"},
              {title:questLabels[3], description:questLabels[4], icon:"💡", href:"/play"},
              {title:questLabels[5], description:questLabels[6], icon:"🤝", href:"/play"},
              {title:questLabels[9], description:questLabels[10], icon:"🤖", href:"/ai-quest"}
            ] as const).map((quest) => (
              <Link key={quest.title} href={quest.href} className="flex min-h-28 items-center gap-3 rounded-2xl border border-teal/20 bg-white p-4 shadow-resting focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
                <span aria-hidden="true" className="text-3xl">{quest.icon}</span>
                <span><span className="block font-display font-bold text-ink">{quest.title}</span><span className="mt-1 block text-sm text-ink/75">{quest.description}</span></span>
              </Link>
            ))}

          </div>
          <p className="mt-4 text-sm text-ink/75">{values[2]}</p>
          <Link href="/real-life-quests" className="mt-3 inline-flex min-h-11 items-center font-semibold text-teal-text underline underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">{questLabels[7]}: {questLabels[8]}</Link>
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
