import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Found during an earlier audit: no custom not-found page existed
 * anywhere in the app, meaning a mistyped URL or a stale link (a real,
 * likely scenario for a child clicking around, or a link surviving
 * after seeded content changes) fell through to Next.js's generic,
 * unbranded default 404 — jarring and potentially confusing for a
 * young child, and not something a parent encountering it would read
 * as "safe, nothing's wrong here." Unlike error.tsx (which must stay
 * English and translation-independent, since a broken translation
 * context could itself be the reason a real error occurred), this
 * page has no such constraint — a 404 for a genuinely missing route
 * doesn't imply the i18n system itself is broken, so it's safe and
 * correct for this one to be fully localized. A Server Component
 * (not Client) deliberately: no interactivity is needed here, and
 * getTranslations() reads directly from the request's own locale
 * rather than depending on the client-side NextIntlClientProvider
 * having already mounted.
 */
export default async function NotFound() {
  const t = await getTranslations();
  return (
    <div className="grid min-h-screen place-items-center bg-fog px-sm text-center">
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
    </div>
  );
}
