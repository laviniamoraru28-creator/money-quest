import {siteControlsCopy} from "@/content/site-controls-copy";
import type {Locale} from "@/i18n/config";
const escape=(text:string)=>text.replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
/** Build only ACTIVE_LOCALES. This standalone page needs no JavaScript or external assets. */
export function offlineFallbackHtml(locale:Locale) {
 const copy=siteControlsCopy[locale];
 return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Money Quest · ${escape(copy.offlineTitle)}</title><style>body{margin:0;background:#111;color:#fff;font:1.2rem/1.7 system-ui;padding:2rem}main{max-width:40rem;margin:auto;overflow-wrap:anywhere}a{color:#9df5e9;display:inline-block;padding:1rem 0}a:focus-visible{outline:3px solid #fff}</style></head><body><main id="main-content"><h1>${escape(copy.offlineHeading)}</h1><p>${escape(copy.offlineWhy)}</p><p>${escape(copy.offlineWorks)}</p><a href="/${locale}">${escape(copy.offlineHome)}</a><p>${escape(copy.offlineReconnect)}</p></main></body></html>`;
}
