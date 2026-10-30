import {notFound} from "next/navigation";
import VisualExplorer from "@/components/VisualExplorer";
import {isSupportedLocale} from "@/i18n/config";
import {learningMetadata} from "@/lib/seo/learning-metadata";
export const metadata=learningMetadata("Learn with pictures: money, paying and saving","Three free visual money activities with optional narration, picture choices and repeatable examples. No account or scores.","/explorer");
export default async function Page({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;if(!isSupportedLocale(locale))notFound();return <VisualExplorer locale={locale}/>;
}
