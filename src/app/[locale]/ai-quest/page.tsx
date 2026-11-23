"use client";
import Image from "next/image";
import {useState} from "react";
import {useLocale,useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {useLocalProgress} from "@/lib/local-progress/use-local-progress";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";
import {Button} from "@/components/ui/Button";
import {Card} from "@/components/ui/Card";
import {AcademyCertificateReward} from "@/components/AcademyCertificateReward";
import type {AgeBand} from "@/types/database.types";

const scenarios={
 explorer:{prompt:"privacy.quizQuestion",intro:"privacy.intro",answers:["privacy.quizOptions.real-address","privacy.quizOptions.product-name"],correct:1},
 builder:{prompt:"promptQuality.question",intro:"promptQuality.intro",answers:["promptQuality.options.best","promptQuality.options.poor","promptQuality.options.better"],correct:0},
 strategist:{prompt:"wrongAnswer.realData",intro:"wrongAnswer.aiSuggestion",answers:["wrongAnswer.choices.trust-the-ai.label","wrongAnswer.choices.ask-ai-to-explain.label","wrongAnswer.choices.check-the-data-first.label"],correct:2}
};
function Challenge({band}:{band:AgeBand}){
 const locale=useLocale(), t=useTranslations(), lab=useTranslations("entrepreneurQuest.aiLab");
 const {state,completeActivity}=useLocalProgress();
 const [retry,setRetry]=useState(false);
 const id=`ai-quest-${band}`,done=state.completedActivityIds.includes(id),s=scenarios[band];
 return <Card variant="activity" className="space-y-4">
 {done?<><Image unoptimized className="mx-auto" alt="" src="/cinematic/rewards/badge-ai.webp" width={120} height={120}/><p role="status">{lab(band==="strategist"?"wrongAnswer.choices.check-the-data-first.consequence":s.intro)}</p><Link href="/play" className="block min-h-12 underline">{t("nav.backToWorldMap")}</Link></>:
 <><p>{lab(s.intro)}</p><h2 className="text-xl font-bold">{lab(s.prompt)}</h2>
 <ReadAloudButton uiLocale={locale} text={[s.intro,s.prompt,...s.answers].map(key=>lab(key)).join(". ")}/>
 <div className="grid gap-3">{s.answers.map((key,index)=><Button key={key} variant="secondary" onClick={()=>{if(index===s.correct)completeActivity(id,true,0,0);else setRetry(true);}}>{lab(key)}</Button>)}</div>
 <p role="status">{retry?t("common.tryAgain"):""}</p></>}
 <AcademyCertificateReward/></Card>;
}
export default function AiQuest(){
 const {state,isLoaded}=useLocalProgress(),t=useTranslations();
 return <main id="main-content" className="mx-auto min-h-screen max-w-2xl space-y-6 p-5"><h1 className="font-display text-3xl font-bold">AI Quest</h1>
 {isLoaded && (state.ageBand?<Challenge key={state.ageBand} band={state.ageBand}/>:<Link href="/#levels-heading">{t("play.chooseYourLevel")}</Link>)}</main>;
}
