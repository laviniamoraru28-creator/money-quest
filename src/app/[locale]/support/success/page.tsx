import {cookies} from "next/headers";
import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {confirmedSupport} from "@/lib/support/server";
export const dynamic = "force-dynamic";
export const metadata = {robots: {index: false, follow: false}, referrer: "no-referrer" as const};
export default async function SupportSuccess({searchParams}: {searchParams: Promise<{session_id?: string}>}) {
  const query = await searchParams;
  const token = (await cookies()).get("mq_support")?.value || "";
  let paid = false;
  try {paid = await confirmedSupport(query.session_id || "", token);} catch {/* Never infer success from a redirect. */}
  const t = await getTranslations("support");
  return <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-12">
    <h1 className="text-3xl font-bold">{t("title")}</h1>
    <p role="status" className="mt-6 rounded-2xl bg-cream p-6">{t(paid ? "success" : "pending")}</p>
    <p className="mt-4">{t("free")}</p><p className="mt-4">{t("contact")}</p>
    <Link href="/" className="mt-6 inline-block text-teal-text underline">{t("home")}</Link>
  </main>;
}
