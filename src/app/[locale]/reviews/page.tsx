import PublicReviews from "@/components/PublicReviews";
import {learningMetadata} from "@/lib/seo/learning-metadata";
import {publicParentLocale} from "@/lib/i18n/parent-presentation";
import {reviewsCopy} from "@/content/reviews-copy";
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const {locale}=await params;const language=publicParentLocale(locale),copy=reviewsCopy[language];return learningMetadata(copy.title,copy.intro,"/reviews",undefined,language);}
export default async function Page({params}:Props){const {locale}=await params;return <PublicReviews locale={publicParentLocale(locale)}/>;}
