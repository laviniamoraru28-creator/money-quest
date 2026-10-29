"use client";
import {useLocale} from "next-intl";
import {experienceCopy} from "@/content/experience-copy";
import {isSupportedLocale} from "@/i18n/config";
import {useReadAloud} from "@/lib/accessibility/use-read-aloud";
export function WelcomeMessage() {
 const locale=useLocale(),t=experienceCopy[isSupportedLocale(locale)?locale:"en"];
 const {isSupported,isSpeaking,speak,stop}=useReadAloud(locale==="en"?"en-GB":locale);
 return <div className="border-t border-teal/15 bg-white p-4 text-ink"><p className="font-semibold">{t.welcome}</p><button type="button" disabled={!isSupported} onClick={()=>isSpeaking?stop():speak(t.welcome)} className="mt-3 min-h-12 rounded-xl border border-teal px-4 py-3 font-semibold text-teal-text disabled:opacity-60">{isSpeaking?t.stop:t.listenWelcome}</button><p className="mt-2 text-sm">{t.still}</p></div>;
}
