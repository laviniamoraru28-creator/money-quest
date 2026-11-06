"use client";
import type {Locale} from "@/i18n/config";
import {quietCopy} from "@/content/quiet-corner";
import QuietVideos from "@/components/QuietVideos";

export default function QuietCorner({locale}:{locale:Locale}) {
  const t = quietCopy[locale];
  return <div className="min-h-screen bg-fog text-ink">
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{t.title}</h1>
      <QuietVideos locale={locale}/>
    </main>
  </div>;
}
