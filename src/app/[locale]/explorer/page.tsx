import {experienceCopy} from "@/content/experience-copy";
import {visualCopy} from "@/content/visual-learning";
import {notFound} from "next/navigation";
import VisualExplorer from "@/components/VisualExplorer";
import {isSupportedLocale} from "@/i18n/config";
import {learningMetadata} from "@/lib/seo/learning-metadata";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isSupportedLocale(locale))notFound();return learningMetadata(experienceCopy[locale].visual,visualCopy[locale].intro,"/explorer",undefined,locale);}
export default async function Page({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;if(!isSupportedLocale(locale))notFound();return <VisualExplorer locale={locale}/>;
}
