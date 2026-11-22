import Image from "next/image";
import { LivingWorldHero } from "@/components/LivingWorldHero";
import { HomepageMissionPreview } from "@/components/HomepageMissionPreview";
import {ChooseLearningLevelLink} from "@/components/ChooseLearningLevelLink";
import {certificateJourneyCopy} from "@/content/certificate-journey-copy";
import {isSupportedLocale} from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/structured-data";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";

const audienceCopy: Record<string, readonly string[]> = {"en":["Built for curious kids. Useful for adults.","For parents","See how learning works and support your child without an account.","Parent information","For teachers","Explore learning topics and activities to adapt for your classroom.","Explore resources","Designed with privacy in mind","No child account is needed. Progress stays on this device, so switching devices or clearing browser storage can remove it."],"ro":["Pentru copiii curioși. Util și pentru adulți.","Pentru părinți","Află cum funcționează învățarea și cum îți poți sprijini copilul fără cont.","Informații pentru părinți","Pentru profesori","Explorează teme și activități pe care le poți adapta pentru clasă.","Descoperă resursele","Confidențialitatea contează","Copilul nu are nevoie de cont. Progresul rămâne pe dispozitiv și se poate pierde dacă ștergi datele browserului."],"es":["Para niños curiosos y adultos.","Para familias","Descubre cómo apoyar el aprendizaje sin crear una cuenta.","Información para familias","Para docentes","Explora temas y actividades para el aula.","Explorar recursos","Privacidad desde el diseño","No se necesita cuenta infantil. El progreso queda en este dispositivo y puede perderse al borrar el navegador."],"fr":["Pour les enfants curieux et les adultes.","Pour les parents","Découvrez comment accompagner votre enfant sans compte.","Informations parents","Pour les enseignants","Explorez des activités à adapter en classe.","Explorer les ressources","Respect de la vie privée","Aucun compte enfant. La progression reste sur cet appareil et peut disparaître si les données du navigateur sont effacées."],"de":["Für neugierige Kinder und Erwachsene.","Für Eltern","Erfahren Sie, wie Sie Ihr Kind ohne Konto begleiten.","Elterninformationen","Für Lehrkräfte","Entdecken Sie Themen und Aktivitäten für den Unterricht.","Materialien entdecken","Datenschutz im Mittelpunkt","Kein Kinderkonto nötig. Fortschritte bleiben auf diesem Gerät und können beim Löschen der Browserdaten verloren gehen."],"it":["Per bambini curiosi e adulti.","Per i genitori","Scopri come sostenere tuo figlio senza account.","Informazioni per genitori","Per insegnanti","Esplora attività da adattare in classe.","Esplora risorse","Privacy al centro","Nessun account bambino. I progressi restano sul dispositivo e possono sparire cancellando i dati del browser."],"pt":["Para crianças curiosas e adultos.","Para pais","Descobre como apoiar a aprendizagem sem conta.","Informações para pais","Para professores","Explora atividades para a sala de aula.","Explorar recursos","Privacidade em primeiro lugar","Sem conta infantil. O progresso fica neste dispositivo e pode perder-se ao apagar os dados do navegador."],"nl":["Voor nieuwsgierige kinderen en volwassenen.","Voor ouders","Ontdek hoe je leren ondersteunt zonder account.","Informatie voor ouders","Voor leerkrachten","Ontdek activiteiten voor in de klas.","Bekijk bronnen","Privacy voorop","Geen kinderaccount. Voortgang blijft op dit apparaat en kan verdwijnen als browsergegevens worden gewist."],"pl":["Dla ciekawych dzieci i dorosłych.","Dla rodziców","Dowiedz się, jak wspierać dziecko bez konta.","Informacje dla rodziców","Dla nauczycieli","Odkryj zajęcia do wykorzystania w klasie.","Zobacz materiały","Prywatność ma znaczenie","Bez konta dziecka. Postępy pozostają na urządzeniu i mogą zniknąć po wyczyszczeniu danych przeglądarki."]};
const heroCopy: Record<string, readonly string[]> = {"en":["Real-world skills start with one decision.","Explore money, entrepreneurship, leadership and AI through interactive quests where every choice teaches something new.","Start Your Adventure","Free to explore. No child account required. Progress stays on this device."],"ro":["Abilitățile pentru viață încep cu o decizie.","Descoperă banii, antreprenoriatul, leadershipul și inteligența artificială prin misiuni interactive.","Începe aventura","Acces gratuit. Fără cont pentru copil. Progresul rămâne pe acest dispozitiv."],"es":["Las habilidades para la vida empiezan con una decisión.","Explora dinero, emprendimiento, liderazgo e IA con misiones interactivas.","Empieza tu aventura","Gratis. Sin cuenta infantil. Progreso guardado en este dispositivo."],"fr":["Les compétences de la vie commencent par un choix.","Explore l'argent, l'entrepreneuriat, le leadership et l'IA avec des missions interactives.","Commence l'aventure","Gratuit. Sans compte enfant. Progression sur cet appareil."],"de":["Wichtige Fähigkeiten beginnen mit einer Entscheidung.","Entdecke Geld, Unternehmertum, Führung und KI in interaktiven Quests.","Abenteuer starten","Kostenlos. Kein Kinderkonto. Fortschritt auf diesem Gerät."],"it":["Le competenze per la vita iniziano con una scelta.","Esplora denaro, imprenditorialità, leadership e IA con missioni interattive.","Inizia l'avventura","Gratis. Nessun account bambino. Progressi su questo dispositivo."],"pt":["As competências para a vida começam com uma decisão.","Explora dinheiro, empreendedorismo, liderança e IA em missões interativas.","Começa a aventura","Grátis. Sem conta infantil. Progresso neste dispositivo."],"nl":["Vaardigheden voor het leven beginnen met één keuze.","Ontdek geld, ondernemen, leiderschap en AI met interactieve quests.","Begin je avontuur","Gratis. Geen kinderaccount. Voortgang op dit apparaat."],"pl":["Umiejętności życiowe zaczynają się od jednej decyzji.","Poznaj pieniądze, przedsiębiorczość, przywództwo i AI w interaktywnych misjach.","Rozpocznij przygodę","Bezpłatnie. Bez konta dziecka. Postępy na tym urządzeniu."]};

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const journey=certificateJourneyCopy[isSupportedLocale(locale)?locale:"en"];
  const hero=heroCopy[locale] ?? heroCopy.en!;
  const audience=audienceCopy[locale] ?? audienceCopy.en!;
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
        {/* Hero */}
        <section className="mx-auto max-w-[1200px] px-sm py-2xl md:py-3xl">
          <div className="grid gap-lg md:grid-cols-2 md:items-center">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
                {hero[0]}
              </h1>
              <p className="mt-sm text-lg text-ink/80">
                {hero[1]}
              </p>
              <Link href="/play" className="mt-md inline-flex min-h-12 items-center justify-center rounded-xl bg-teal px-6 py-3 text-center font-bold text-white hover:bg-teal/90 focus-visible:outline focus-visible:outline-4 focus-visible:outline-ink">{hero[2]} →</Link>
              <p className="mt-3 text-sm text-ink/70">{hero[3]}</p>
            </div>
            <LivingWorldHero locale={locale} />
          </div>
        </section>


        <HomepageMissionPreview locale={locale} />

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

        <section aria-labelledby="audience-heading" className="mx-auto max-w-[1200px] px-sm pb-2xl">
          <h2 id="audience-heading" className="font-display text-2xl font-bold text-ink">{audience[0]}</h2>
          <div className="mt-md grid gap-md md:grid-cols-2">
            <div className="rounded-2xl border border-teal/20 bg-white p-md">
              <h3 className="font-display text-xl font-bold">{audience[1]}</h3>
              <p className="mt-2 text-ink/80">{audience[2]}</p>
              <Link href="/parent-info" className="mt-4 inline-flex min-h-11 items-center font-bold text-teal-text underline underline-offset-4">{audience[3]} →</Link>
            </div>
            <div className="rounded-2xl border border-teal/20 bg-white p-md">
              <h3 className="font-display text-xl font-bold">{audience[4]}</h3>
              <p className="mt-2 text-ink/80">{audience[5]}</p>
              <Link href="/learn" className="mt-4 inline-flex min-h-11 items-center font-bold text-teal-text underline underline-offset-4">{audience[6]} →</Link>
            </div>
          </div>
          <div className="mt-md rounded-2xl border border-teal/20 bg-cream p-md">
            <h3 className="font-display text-lg font-bold">{audience[7]}</h3>
            <p className="mt-2 text-ink/80">{audience[8]}</p>
            <Link href="/privacy" className="mt-3 inline-flex min-h-11 items-center font-bold text-teal-text underline underline-offset-4">{t("footer.privacy")} →</Link>
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
