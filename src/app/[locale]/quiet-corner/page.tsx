import QuietCorner from "@/components/QuietCorner";
import {quietCopy} from "@/content/quiet-corner";
import {learningMetadata} from "@/lib/seo/learning-metadata";
import {isSupportedLocale} from "@/i18n/config";
import {notFound} from "next/navigation";
const copy = quietCopy.en;
export const metadata = {
  ...learningMetadata(copy.title, copy.intro, "/quiet-corner", "quiet/max-v1.webp"),
  openGraph: {...learningMetadata(copy.title, copy.intro, "/quiet-corner").openGraph, images: [{url:"/images/money-quest/quiet/max-v1.webp",width:1200,height:675}]}
};
export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <QuietCorner locale={locale}/>;
}
