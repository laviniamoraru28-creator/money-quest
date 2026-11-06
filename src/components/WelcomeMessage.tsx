"use client";
import {useLocale} from "next-intl";
import {experienceCopy} from "@/content/experience-copy";
import {isSupportedLocale} from "@/i18n/config";
export function WelcomeMessage() {
 const locale=useLocale(),t=experienceCopy[isSupportedLocale(locale)?locale:"en"];
 return <div className="border-t border-teal/15 bg-white px-4 py-3 text-ink"><p className="font-semibold">{t.welcome}</p></div>;
}
