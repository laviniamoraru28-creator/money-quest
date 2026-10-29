"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {ActionIcon} from "./ActionIcon";
import {Link} from "@/i18n/navigation";
import {OfflineDownload} from "@/components/ui/OfflineDownload";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";
import { useReadAloud } from "@/lib/accessibility/use-read-aloud";
import {quietCopy} from "@/content/quiet-corner";
import {isSupportedLocale} from "@/i18n/config";

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

export function PageReadAloud({ locale }: { locale: string }) {
  const pathname = usePathname();
  const quiet = quietCopy[isSupportedLocale(locale) ? locale : "en"];
  const {nightView,toggleNightView,isLoaded} = useAccessibilityPrefs();
  const { isSupported, isSpeaking, speak, stop } = useReadAloud(locale === "en" ? "en-GB" : locale);
  const [message, setMessage] = useState("");
  useEffect(() => { stop(); setMessage(""); }, [pathname, stop]);
  useEffect(() => {
    if (!isSpeaking) return;
    const main = document.querySelector("main"); if (!main) return;
    const observer = new MutationObserver(() => { stop(); setMessage("The page changed. Choose Listen to read the new content."); });
    observer.observe(main, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [isSpeaking, stop]);
  const listen = () => {
    if (isSpeaking) { stop(); setMessage(""); return; }
    const main = document.querySelector("main");
    const text = main ? visibleLearningText(main) : "";
    if (!text) { setMessage("There is no visible learning text to read yet."); return; }
    setMessage(""); speak(text);
  };
  return <aside aria-label="Page read-aloud" data-read-aloud-ignore className="border-b border-teal/20 bg-cream px-5 py-2 text-ink">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3"><button type="button" disabled={!isSupported} onClick={listen} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-teal/40 bg-white px-4 py-3 font-semibold text-teal-text disabled:opacity-60"><ActionIcon name="sound"/>{isSpeaking ? "Stop" : "Listen"}</button><button type="button" disabled={!isLoaded} aria-pressed={nightView} onClick={toggleNightView} className="min-h-12 rounded-xl border border-teal/40 bg-white px-4 py-3 font-semibold text-teal-text"><ActionIcon name="night"/>Night view</button><Link href="/reviews" className="min-h-12 px-3 py-3 font-semibold text-teal-text underline">Reviews</Link><OfflineDownload locale={locale}/>{!pathname.endsWith("/quiet-corner") && <Link href="/quiet-corner" className="min-h-12 rounded-xl border-2 border-teal bg-white px-4 py-3 font-bold text-teal-text">{quiet.entry}</Link>}<span className="text-sm">Optional read-aloud. Nothing plays automatically.</span><p role="status" className="text-sm">{message}</p></div>
  </aside>;
}
