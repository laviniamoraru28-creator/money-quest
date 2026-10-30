import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {GuidePanel} from "@/components/GuidePanel";
import {MoneyExamples} from "@/components/MoneyExamples";
import {AccessibilityMenu} from "@/components/ui/AccessibilityMenu";
import {learningMetadata} from "@/lib/seo/learning-metadata";
import {inclusiveLearningCopy} from "@/content/inclusive-learning-copy";
import {publicNavigationCopy} from "@/content/public-navigation-copy";
import {laboratoryCopy} from "@/content/laboratory-copy";
import {discoveryCopy} from "@/content/discovery-copy";
import {isSupportedLocale,REGIONAL_LOCALES} from "@/i18n/config";
import {notFound} from "next/navigation";
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const {locale}=await params;if(!isSupportedLocale(locale))notFound();const copy=inclusiveLearningCopy[locale];return learningMetadata(publicNavigationCopy[locale].inclusive,copy.intro,"/inclusive-learning","sections/inclusive-learning.webp",locale);}
export default async function Page({params}:Props){
 const {locale}=await params;if(!isSupportedLocale(locale))notFound();
 const copy=inclusiveLearningCopy[locale],labels=laboratoryCopy[locale],nav=publicNavigationCopy[locale],discovery=discoveryCopy[locale];
 return <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-5 py-6"><nav aria-label={labels.navigation} className="flex flex-wrap items-center gap-4"><Link className="min-h-11 py-2 text-teal-text underline" href="/">{labels.home}</Link><Link className="min-h-11 py-2 text-teal-text underline" href="/play">{labels.map}</Link><AccessibilityMenu/></nav><h1 className="mt-5 text-3xl">{copy.title}</h1><Image unoptimized data-learning-decoration src="/images/money-quest/sections/inclusive-learning.webp" alt="" width={640} height={640} className="mt-5 max-h-80 w-full rounded-2xl object-contain"/><GuidePanel message={copy.intro} uiLocale={REGIONAL_LOCALES[locale]} labels={labels}/><section className="my-6 grid gap-4 sm:grid-cols-2">{[
 [copy.supportTitle,copy.support],[copy.stepTitle,copy.step],[copy.responseTitle,copy.response],[copy.paceTitle,copy.pace]
 ].map(([title,text])=><article key={title} className="rounded-2xl border border-ink/10 bg-white p-5"><h2 className="text-xl">{title}</h2><p className="mt-2">{text}</p></article>)}</section><MoneyExamples/><nav aria-label={copy.spaces} className="flex flex-wrap gap-3">{[
 ["library",discovery.library],["museum",discovery.museum],["brain-lab",nav.brain],["mind-lab",nav.mind],["future-skills",nav.future]
 ].map(([slug,title])=><Link className="min-h-12 rounded-xl bg-teal px-4 py-3 text-white" key={slug} href={`/${slug}`}>{title}</Link>)}</nav></main>;
}
