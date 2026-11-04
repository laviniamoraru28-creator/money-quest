"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {GlobalSettings} from "./GlobalSettings";

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
  return <aside aria-label={copy.region} data-read-aloud-ignore className="border-b border-teal/20 bg-cream px-5 py-2 text-ink">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
      <button type="button" disabled={!isSupported} onClick={listen} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-teal/40 bg-white px-4 py-3 font-semibold text-teal-text disabled:opacity-60"><ActionIcon name="sound"/>{isSpeaking ? copy.stop : copy.listen}</button>
      <GlobalSettings locale={language} copy={copy}/>
      <span role="status" className="text-sm">{message?copy[message]:""}</span>
    </div>
  </aside>;
}
