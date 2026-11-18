import {cookies} from "next/headers";
import {ADULT_COOKIE, verifiedAdult} from "@/lib/support/adult-gate";
import {SupportAdultGate} from "@/components/SupportAdultGate";
import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {SupportForm} from "@/components/SupportForm";
import {supportReady} from "@/lib/support/server";
export const dynamic = "force-dynamic";
export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params; const t = await getTranslations({locale, namespace: "support"});
  return {title: t("title"), description: t("intro")};
}
export default async function SupportPage({params, searchParams}: {params: Promise<{locale: string}>; searchParams: Promise<{cancelled?: string}>}) {
  if (!verifiedAdult((await cookies()).get(ADULT_COOKIE)?.value)) return <SupportAdultGate/>;
  const {locale} = await params; const query = await searchParams;
  const t = await getTranslations("support");
  return <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-8 text-ink">
    <Link href="/" className="text-teal-text underline">{t("home")}</Link>
    <p className="mt-6 text-sm font-bold text-teal-text">{t("parents")}</p>
    <h1 className="mt-2 font-display text-3xl font-bold">{t("title")} <span aria-hidden="true">💚</span></h1>
    <div className="mt-5 space-y-3">{(["intro", "project", "invitation", "optional", "free", "thanks"] as const).map(key => <p key={key}>{t(key)}</p>)}</div>
    {query.cancelled === "1" && <p role="status" className="mt-4 rounded-xl bg-cream p-4">{t("cancelled")}</p>}
    <SupportForm locale={locale} enabled={supportReady()}/>
    <section className="mt-6 text-sm" aria-labelledby="support-privacy-title">
      <h2 id="support-privacy-title" className="font-bold">{t("privacyTitle")}</h2>
      <p className="mt-2">{t("privacyBody")}</p>
      <Link href="/privacy" className="mt-2 inline-block text-teal-text underline">{t("privacy")}</Link>
      <p className="mt-3">{t("contact")}</p>
    </section>
  </main>;
}
