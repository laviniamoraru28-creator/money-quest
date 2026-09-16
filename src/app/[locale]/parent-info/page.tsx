import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * The dedicated "Parent Information" section required by the privacy-
 * first redesign — a plain-language explanation of the actual
 * architecture, not a legal document (see privacy-policy.md for that).
 * Every claim on this page is something verified directly in this
 * codebase, not asserted from memory. Fully wired into the translation
 * system (parentInfo.* namespace) — found missing during a later audit
 * and fixed then, not part of the original build.
 */
export default async function ParentInfoPage() {
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link href="/" className="text-sm text-teal hover:underline">
          ← {t("common.moneyQuest")}
        </Link>
        <h1 className="mt-2xs font-display text-2xl font-bold">{t("parentInfo.title")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("parentInfo.intro")}</p>

        <h2 className="mt-lg font-display text-xl font-bold text-teal">{t("parentInfo.aboutSectionTitle")}</h2>
        <div className="mt-md grid gap-md">
          <section>
            <h3 className="font-display text-lg font-bold">{t("parentInfo.pq1Title")}</h3>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.pq1Body")}</p>
          </section>
          <section>
            <h3 className="font-display text-lg font-bold">{t("parentInfo.pq2Title")}</h3>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.pq2Body")}</p>
          </section>
          <section>
            <h3 className="font-display text-lg font-bold">{t("parentInfo.pq3Title")}</h3>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.pq3Body")}</p>
          </section>
          <section>
            <h3 className="font-display text-lg font-bold">{t("parentInfo.pq4Title")}</h3>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.pq4Body")}</p>
          </section>
          <section className="rounded-md border-2 border-coral/30 bg-coral/10 p-sm">
            <h3 className="font-display text-lg font-bold">{t("parentInfo.pq5Title")}</h3>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.pq5Body")}</p>
          </section>
          <section className="rounded-md border-2 border-soft-blue/40 bg-soft-blue/10 p-sm">
            <h3 className="font-display text-lg font-bold">{t("parentInfo.pq6Title")}</h3>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.pq6Body")}</p>
          </section>
        </div>

        <h2 className="mt-lg font-display text-xl font-bold text-teal">{t("parentInfo.privacySectionTitle")}</h2>
        <div className="mt-md grid gap-md">
          <section>
            <h2 className="font-display text-lg font-bold">{t("parentInfo.q1Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.q1Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">{t("parentInfo.q2Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.q2Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">{t("parentInfo.q3Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.q3Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">{t("parentInfo.q4Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.q4Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">{t("parentInfo.q5Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.q5Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">{t("parentInfo.q6Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.q6Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">{t("parentInfo.q7Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.q7Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">{t("parentInfo.q8Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">
              {t("parentInfo.q8BodyPrefix")}{" "}
              <Link href="/contact" className="text-teal hover:underline">
                {t("parentInfo.contactPageLink")}
              </Link>
              {t("parentInfo.q8BodySuffix")}
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">{t("parentInfo.q9Title")}</h2>
            <p className="mt-2xs text-base text-ink/80">{t("parentInfo.q9Body")}</p>
          </section>
        </div>

        <p className="mt-lg text-sm text-ink/60">
          {t("parentInfo.footerPrefix")}{" "}
          <Link href="/privacy" className="text-teal hover:underline">
            {t("parentInfo.privacyPolicyLink")}
          </Link>{" "}
          {t("parentInfo.footerSuffix")}
        </p>
      </main>
    </div>
  );
}
