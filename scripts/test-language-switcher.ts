import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {NextIntlClientProvider} from "next-intl";
import {LOCALES,LOCALE_LABELS} from "../src/i18n/config";
import {LanguageSwitcher,languageDestination} from "../src/components/ui/LanguageSwitcher";
import {MoneyExamples,MoneyDiagram} from "../src/components/MoneyExamples";
import {moneyExamplesCopy} from "../src/content/money-examples-copy";
import {publicNavigationCopy} from "../src/content/public-navigation-copy";
import {inclusiveLearningCopy} from "../src/content/inclusive-learning-copy";
import {learningMetadata} from "../src/lib/seo/learning-metadata";
(globalThis as typeof globalThis & {React:typeof React}).React=React;
const escape=(value:string)=>value.replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("'","&#x27;").replaceAll("<","&lt;").replaceAll(">","&gt;");
for(const locale of LOCALES){
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 const render=(children:React.ReactElement)=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children}));
 const html=render(React.createElement(LanguageSwitcher,{locales:LOCALES}));
 assert.equal((html.match(/<option /g)||[]).length,9);
 assert(html.includes(`value="${locale}" lang="${locale}" selected=""`));
 assert(html.includes(escape(messages.language.changeLanguage)));
 for(const language of LOCALES)assert(html.includes(LOCALE_LABELS[language].nativeName));
 for(const target of LOCALES){
  assert.equal(languageDestination(`https://moneyquesteducation.com/${locale}/museum/from-barter?view=pictures&x=a%20b#activity`,target),`/${target}/museum/from-barter?view=pictures&x=a%20b#activity`);
  assert.equal(languageDestination(`/${locale}`,target),`/${target}`);
  assert.equal(languageDestination(`/${locale}/`,target),`/${target}/`);
 }
 assert.equal(languageDestination("/parents/shop?from=home#free-preview",locale),`/${locale}/parents/shop?from=home#free-preview`);
 const moneyHtml=render(React.createElement(MoneyExamples)),money=moneyExamplesCopy[locale];
 for(const key of ["title","intro","coins","notes","account","card","phone","money","coinDetail","question","coinChoice","cardChoice","illustration"] as const)assert(moneyHtml.includes(escape(money[key])),`${locale}: ${key}`);
 const account=render(React.createElement(MoneyDiagram,{kind:"account",locale}));
 assert(account.includes(escape(money.balance)));assert(account.includes("12"));
 const metadata=learningMetadata(inclusiveLearningCopy[locale].title,inclusiveLearningCopy[locale].intro,"/inclusive-learning",undefined,locale);
 assert.equal(metadata.alternates?.canonical,`https://moneyquesteducation.com/${locale}/inclusive-learning`);
 assert.equal(metadata.openGraph?.url,`https://moneyquesteducation.com/${locale}/inclusive-learning`);
 for(const group of [moneyExamplesCopy,publicNavigationCopy,inclusiveLearningCopy]){
  assert.deepEqual(Object.keys(group[locale]),Object.keys(group.en));
  for(const value of Object.values(group[locale])){assert(value.trim());assert.equal(value,value.normalize("NFC"));assert(!/[\uFFFDŞşŢţ]/u.test(value));}
 }
 assert.notEqual(publicNavigationCopy[locale].brain,publicNavigationCopy[locale].mind);
}
for(const locale of LOCALES.filter(value=>value!=="en")){
 for(const key of Object.keys(moneyExamplesCopy.en) as (keyof typeof moneyExamplesCopy.en)[])assert.notEqual(moneyExamplesCopy[locale][key],moneyExamplesCopy.en[key],`${locale}/${key}`);
}
console.log("PASS: nine-language selector SSR, 81 route/query/anchor switches, localized navigation and inclusive copy, money examples and bank balance SSR, locale canonical/Open Graph URLs. Activation and browser journeys are separate release checks.");
