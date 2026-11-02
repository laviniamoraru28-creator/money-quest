"use client";
import Image from "next/image";

import {useState} from "react";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";

/** Authored guidance only. No generated conversations or automatic speech. */
const defaultLabels={showGuide:"Show guide",hideGuide:"Hide guide",guideLabel:"Your learning guides"};
export function GuidePanel({message, compact = false, uiLocale="en-GB", labels=defaultLabels}: {message: string; compact?: boolean; uiLocale?:string; labels?:typeof defaultLabels}) {
  const [hidden, setHidden] = useState(false);
  const {focusMode} = useAccessibilityPrefs();
  if (hidden) return <button type="button" onClick={() => setHidden(false)} className="my-3 min-h-11 rounded-xl border border-teal px-4 text-teal-text">{labels.showGuide}</button>;
  return <aside aria-label={labels.guideLabel} className="my-4 flex flex-wrap items-center gap-4 rounded-2xl border border-teal/20 bg-white p-4">
    {!focusMode && <Image unoptimized src="/images/money-quest/guides/girl-and-puppy-thumb.webp" alt="" width={compact ? 72 : 112} height={compact ? 72 : 112} loading="lazy" className={`${compact ? "h-20 w-20" : "h-28 w-28"} rounded-xl object-contain`} />}
    <div className="min-w-0 flex-1 basis-48"><p className="text-base text-ink">{message}</p><div className="mt-2 flex flex-wrap items-center gap-3"><ReadAloudButton text={message} uiLocale={uiLocale}/><button type="button" onClick={() => setHidden(true)} className="min-h-11 px-2 text-sm text-teal-text underline">{labels.hideGuide}</button></div></div>
  </aside>;
}
