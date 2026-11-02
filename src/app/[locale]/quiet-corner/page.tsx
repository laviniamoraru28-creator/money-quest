import QuietCorner from "@/components/QuietCorner";
import {quietCopy} from "@/content/quiet-corner";
import {learningMetadata} from "@/lib/seo/learning-metadata";
import {isSupportedLocale} from "@/i18n/config";
import {notFound} from "next/navigation";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;if(!isSupportedLocale(locale))notFound();
 const copy=quietCopy[locale];
 const metadata=learningMetadata(copy.title,copy.intro,"/quiet-corner","quiet/max-v1.webp",locale);
 return {...metadata,openGraph:{...metadata.openGraph,images:[{url:"/images/money-quest/quiet/max-v1.webp",width:1200,height:675}]}};
}
export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <QuietCorner locale={locale}/>;
}
