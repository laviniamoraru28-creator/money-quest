import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function ContactPage() {
  const t = await getTranslations();
  return (
    <div className="min-h-screen bg-fog px-sm py-2xl">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm text-teal">
          ← {t("contact.backHome")}
        </Link>
        <main>
          <h1 className="mt-sm font-display text-2xl font-bold">{t("contact.title")}</h1>
          <p className="mt-sm text-base text-ink/80">{t("contact.intro")}</p>

          <div className="mt-md rounded-md border border-ink/10 bg-white p-md">
            <h2 className="font-display text-lg font-bold">{t("contact.safetyTitle")}</h2>
            <p className="mt-2xs text-base text-ink/80">
              {t("contact.safetyBodyPrefix")}{" "}
              <a href="mailto:safety@moneyquest.example" className="font-medium text-teal">
                safety@moneyquest.example
              </a>
              . {t("contact.safetyBodySuffix")}
            </p>
          </div>

          <div className="mt-sm rounded-md border border-ink/10 bg-white p-md">
            <h2 className="font-display text-lg font-bold">{t("contact.everythingElseTitle")}</h2>
            <p className="mt-2xs text-base text-ink/80">
              {t("contact.everythingElseBodyPrefix")}{" "}
              <a href="mailto:hello@moneyquest.example" className="font-medium text-teal">
                hello@moneyquest.example
              </a>
              . {t("contact.everythingElseBodySuffix")}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
