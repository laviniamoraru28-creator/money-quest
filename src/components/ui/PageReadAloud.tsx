"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {GlobalSettings} from "./GlobalSettings";
import {LanguageSwitcher} from "./LanguageSwitcher";
import {NavMenu} from "./NavMenu";

import {ActionIcon} from "./ActionIcon";


import { useReadAloud } from "@/lib/accessibility/use-read-aloud";
import {REGIONAL_LOCALES,type Locale} from "@/i18n/config";
import type {SiteControlsCopy} from "@/content/site-controls-copy";

/** Read rendered learning content only, never form values or hidden page content. */
export function visibleLearningText(root: HTMLElement): string {
  const parts: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && !parent.closest('script, style, nav, input, textarea, select, [hidden], [aria-hidden="true"], [data-read-aloud-ignore], .sr-only')) {
      const style = window.getComputedStyle(parent);
      if (parent.getClientRects().length && style.visibility !== "hidden" && style.display !== "none") {
        const text = node.textContent?.trim(); if (text) parts.push(text);
      }
    }
    node = walker.nextNode();
  }
  return parts.join(". ").replace(/\s+/g, " ");
}

export function PageReadAloud({locale,copy}:{locale:Locale;copy:SiteControlsCopy}) {
  const pathname = usePathname();
  const language=locale;
  const { isSupported, isSpeaking, speak, stop } = useReadAloud(REGIONAL_LOCALES[language]);
  const [message, setMessage] = useState<"pageChanged"|"noText"|null>(null);
  useEffect(() => { stop(); setMessage(null); }, [pathname, stop]);
  useEffect(() => {
    if (!isSpeaking) return;
    const main = document.querySelector("main"); if (!main) return;
    const observer = new MutationObserver(() => { stop(); setMessage("pageChanged"); });
    observer.observe(main, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [isSpeaking, stop]);
  const listen = () => {
    if (isSpeaking) { stop(); setMessage(null); return; }
    const main = document.querySelector("main");
    const text = main ? visibleLearningText(main) : "";
    if (!text) { setMessage("noText"); return; }
    setMessage(null); speak(text);
  };
  return <aside aria-label={copy.region} data-read-aloud-ignore className="sticky top-0 z-40 border-b border-white/20 bg-emerald-800 px-2 py-2 text-white shadow-sm sm:px-5">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 sm:gap-3">
      <a href={`/${language}`} className="min-w-0 flex-1 truncate px-1 font-display text-base font-bold tracking-tight text-white sm:text-xl" aria-label="Money Quest home">Money Quest</a>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <LanguageSwitcher compact/>
        <div className="rounded-lg bg-white"><GlobalSettings locale={language} copy={copy} compact/></div>
        <button type="button" disabled={!isSupported} onClick={listen} aria-label={isSpeaking?copy.stop:copy.listen} title={isSpeaking?copy.stop:copy.listen} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-white text-teal-text disabled:opacity-60"><ActionIcon name="sound"/><span className="sr-only">{isSpeaking?copy.stop:copy.listen}</span></button>
        <NavMenu/>
      </div>
    </div>
    {message&&<p role="status" className="mx-auto max-w-6xl pt-1 text-xs text-white">{copy[message]}</p>}
  </aside>;
}
