import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";

export async function SupportCard() {
  const t = await getTranslations("support");
  return <section className="mx-auto max-w-3xl px-4 py-8" aria-labelledby="support-parents-heading">
    <div className="rounded-2xl border border-teal/20 bg-cream p-6">
      <h2 id="support-parents-heading" className="text-xl font-bold">{t("parents")}</h2>
      <p className="mt-2">{t("optional")} {t("free")}</p>
      <Link href="/support" className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-teal px-5 py-3 font-bold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">{t("title")}</Link>
    </div>
  </section>;
}
