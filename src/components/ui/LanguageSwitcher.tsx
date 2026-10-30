"use client";

import {useLocale, useTranslations} from "next-intl";
import {ACTIVE_LOCALES, LOCALE_LABELS, isSupportedLocale, type Locale} from "@/i18n/config";

/** Change only the leading language segment. Keep the route, query and anchor. */
export function languageDestination(href:string,locale:Locale):string {
 const url=new URL(href,"https://moneyquesteducation.com");
 const segments=url.pathname.split("/");
 if(isSupportedLocale(segments[1]??""))segments[1]=locale;
 else segments.splice(1,0,locale);
 return `${segments.join("/")}${url.search}${url.hash}`;
}

/** Native select supports touch, keyboard and long language names. */
export function LanguageSwitcher({locales=ACTIVE_LOCALES}:{locales?:readonly Locale[]}) {
 const locale=useLocale(),t=useTranslations("language");
 return <label data-read-aloud-ignore className="flex min-h-12 max-w-full items-center gap-2 text-sm font-semibold text-ink">
  <span aria-hidden="true">🌐</span><span>{t("selectorLabel")}</span>
  <select aria-label={t("changeLanguage")} value={locale} onChange={event=>{
   const next=event.target.value;
   if(isSupportedLocale(next)&&locales.includes(next)&&next!==locale)window.location.assign(languageDestination(window.location.href,next));
  }} className="min-h-12 min-w-0 max-w-full rounded-xl border border-teal/40 bg-white px-3 py-2 text-base text-ink focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
   {locales.map(value=><option key={value} value={value} lang={value}>{LOCALE_LABELS[value].nativeName}</option>)}
  </select>
 </label>;
}
