import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {PathnameContext} from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import {readFileSync} from "node:fs";
import {PageReadAloud} from "../src/components/ui/PageReadAloud";
import {siteControlsCopy,siteControlsText} from "../src/content/site-controls-copy";
import {offlineStatusText,parseOfflineWorkerMessage,offlineExceptionCode,OFFLINE_ERROR_COPY,type OfflineStatus} from "../src/lib/offline/messages";
import {offlineFallbackHtml} from "../src/lib/offline/fallback-page";
import {sourceFingerprint} from "../src/lib/i18n/content-translations";
import {LOCALES,ACTIVE_LOCALES,REGIONAL_LOCALES} from "../src/i18n/config";
import manifest from "../src/content/translations/site-controls.sources.json";
(globalThis as typeof globalThis & {React:typeof React}).React=React;
assert.equal(manifest.sourceHash,sourceFingerprint(siteControlsCopy.en));
assert.deepEqual(manifest.locales,LOCALES);assert.equal(manifest.stringsPerLocale,35);assert.equal(manifest.translatedStrings,280);
const escape=(text:string)=>text.replaceAll("&","&amp;").replaceAll("'","&#x27;").replaceAll('"',"&quot;");
for(const locale of LOCALES){
 const copy=siteControlsCopy[locale];
 assert.deepEqual(Object.keys(copy).sort(),Object.keys(siteControlsCopy.en).sort());
 for(const [key,value] of Object.entries(copy)){
  assert(value.trim().length>0);assert.equal(value,value.normalize("NFC"));assert(!/[\uFFFD<>|]/u.test(value));
  const source=siteControlsCopy.en[key as keyof typeof copy];
  assert.deepEqual(value.match(/\{\w+\}/g)||[],source.match(/\{\w+\}/g)||[]);
  // Offline is the ordinary borrowed word in these languages too.
  if(locale!=="en"&&!(key==="offlineTitle"&&["de","nl","pl"].includes(locale)))assert.notEqual(value,source,`${locale}/${key}`);
 }
 assert.equal(REGIONAL_LOCALES[locale].split("-")[0],locale);
 const states:OfflineStatus[]=[{type:"preparing"},{type:"progress",done:2,total:10},{type:"ready",count:10},{type:"removed"},{type:"removeFailed"},...Object.keys(OFFLINE_ERROR_COPY).map(code=>({type:"error" as const,code:code as keyof typeof OFFLINE_ERROR_COPY}))];
 for(const state of states){const text=offlineStatusText(locale,state,copy);assert(text.length>0);assert(!text.includes("{"));if(locale!=="en")assert.notEqual(text,offlineStatusText("en",state,siteControlsCopy.en));}
 assert.equal(offlineStatusText(locale,null,copy),"");
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 assert.equal(messages.a11y.listenToLessonLabel,copy.listen,"Generic narration must say Listen, not Listen to the lesson");
 assert.equal(messages.a11y.stopReadingLabel,copy.stop,"Keep short narration controls consistent");
 const html=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children:React.createElement(PathnameContext.Provider,{value:`/${locale}/library`,children:React.createElement(PageReadAloud,{locale,copy})})}));
 for(const text of [copy.region,copy.listen,copy.night,copy.reviews,copy.optional,copy.offlineSummary,copy.instructions,copy.limitations,copy.download,copy.remove])assert(html.includes(escape(text)),`${locale}: ${text}`);
 const fallback=offlineFallbackHtml(locale);assert(fallback.includes(`<html lang="${locale}">`));assert(fallback.includes(`href="/${locale}"`));assert(fallback.includes('content="noindex,nofollow"'));assert(!fallback.includes("<script"));
 for(const text of [copy.offlineHeading,copy.offlineWhy,copy.offlineWorks,copy.offlineHome,copy.offlineReconnect])assert(fallback.includes(text.replaceAll("&","&amp;")),`${locale}: offline fallback`);
}
assert.equal(siteControlsText("ro","progress",{done:2,total:10}),"Se descarcă 2 din 10 fișiere și pagini. Păstrează pagina deschisă.");
for(const code of Object.keys(OFFLINE_ERROR_COPY))assert.deepEqual(parseOfflineWorkerMessage({type:"error",code,message:"RAW UNTRANSLATED ERROR"}),{type:"error",code});
for(const [message,code] of [["A download is already running in another window. Let it finish first.","busy"],["The offline download list is unavailable. Reconnect and try again.","list_unavailable"],["This language does not have a prepared offline copy yet.","language_unavailable"],["Invalid offline download path.","invalid_path"],["Could not save /en/private-test.","file_unavailable"],["Offline setup is not ready. Try again while connected.","setup_not_ready"]])assert.deepEqual(parseOfflineWorkerMessage({type:"error",message}),{type:"error",code});
assert.deepEqual(parseOfflineWorkerMessage({type:"error",code:"toString",message:"<script>RAW</script>"}),{type:"error",code:"download_failed"});
assert.deepEqual(parseOfflineWorkerMessage({type:"progress",done:2,total:10}),{type:"progress",done:2,total:10});
for(const data of [{type:"ready",count:-1},{type:"ready",count:"10"},{type:"progress",done:11,total:10},{type:"progress",done:1,total:Infinity}])assert.deepEqual(parseOfflineWorkerMessage(data),{type:"error",code:"download_failed"});
assert.equal(parseOfflineWorkerMessage(null),null);assert.equal(parseOfflineWorkerMessage({type:"unrelated"}),null);
assert.equal(offlineExceptionCode(new DOMException("quota","QuotaExceededError")),"storage_full");assert.equal(offlineExceptionCode(new DOMException("timeout","AbortError")),"timeout");assert.equal(offlineExceptionCode(new Error("RAW")),"download_failed");
assert.deepEqual(ACTIVE_LOCALES,["en"]);
console.log("PASS: 315 common/offline UI strings, actual toolbar SSR and standalone fallback HTML in nine locales, regional tags, structured/legacy errors, all localized status variants, malformed message handling and unchanged English-only activation. Real non-English browser interaction and voice quality remain pending.");
