import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Missing routes use the current request locale. */
export default async function NotFound() {
  const t = await getTranslations();
  return (
    <main id="main-content" tabIndex={-1} className="grid min-h-screen place-items-center bg-fog px-sm text-center">
      <div className="max-w-sm">
        <span className="text-5xl" aria-hidden="true">
          🧭
        </span>
        <h1 className="mt-sm font-display text-2xl font-bold">{t("notFound.title")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("notFound.body")}</p>
        <Link
          href="/"
          className="mt-md inline-block rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting hover:bg-teal/90"
        >
          {t("notFound.homeLink")}
        </Link>
      </div>
    </main>
  );
}
