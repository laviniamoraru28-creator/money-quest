"use client";

import Image from "next/image";
import {experienceCopy} from "@/content/experience-copy";
import {REGIONAL_LOCALES} from "@/i18n/config";
import {readerCopy,readerText} from "@/content/reader-copy";
import type {ReaderPresentation} from "@/lib/i18n/library-presentation";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { AccessibilityMenu } from "@/components/ui/AccessibilityMenu";
import { useReadAloud } from "@/lib/accessibility/use-read-aloud";

const STORE = "money-quest-discovery-v1";
export default function OriginalBookReader({book,locale,paragraphsPerPage}:ReaderPresentation) {
  const t=experienceCopy[locale],copy=readerCopy[locale];
  const [page, setPage] = useState(0);
  const [opened, setOpened] = useState(false);
  const coverButton = useRef<HTMLButtonElement>(null);
  const perPage=paragraphsPerPage;
  const spreads = book.chapters.flatMap((item, chapterIndex) => Array.from({length:Math.ceil(item.paragraphs.length/perPage)}, (_, part) => ({chapterIndex,paragraphs:item.paragraphs.slice(part*perPage,part*perPage+perPage)})));
  const spread = spreads[page]!;
  const chapter = spread.chapterIndex;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [large, setLarge] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saveUnavailable"|"saveSuccess"|"saveFailure"|null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(0);
  const { isSupported, isSpeaking, speak, stop } = useReadAloud(REGIONAL_LOCALES[locale]);
  // Bundled books are validated as non-empty; navigation keeps this index in bounds.
  const current = book.chapters[chapter]!;
  const selected = answers[chapter];
  const choice = selected === undefined ? undefined : current.choices[selected];
  const readText = `${current.title}. ${spread.paragraphs.join("\n\n")} ${copy.keyIdea}. ${current.idea}. ${copy.tryLabel}. ${current.activity}`;
  useEffect(() => {
    if (previousPage.current !== page) { title.current?.focus(); previousPage.current = page; }
  }, [page, opened]);
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORE) || "[]");
      setSaved(Array.isArray(value) && value.includes(`library:${book.slug}`));
    } catch { setSaveStatus("saveUnavailable"); }
  }, [book.slug]);
  const move = (index: number) => { if (index < 0 || index >= book.chapters.length) return; stop(); setOpened(true); setPage(spreads.findIndex(item=>item.chapterIndex===index)); };
  const turnPage = (index:number) => { if(index<0||index>=spreads.length)return;stop();setPage(index); };
  const useBookCover = chapter === 0 || !["the-little-compass-and-the-money-choices", "the-garden-everyone-could-enter", "the-market-town-notebook"].includes(book.slug);
  const art = useBookCover ? book.cover : `/images/money-quest/worlds/${book.slug==="the-little-compass-and-the-money-choices"?["coin-cove","sky-exchange","market-town","market-town","golden-vault","guardian-gate","kindness-grove","coin-cove"][chapter]:book.slug==="the-garden-everyone-could-enter"?"kindness-grove":book.slug==="the-market-town-notebook"?"market-town":""}.webp`;
  const markFinished = () => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORE) || "[]");
      const existing = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
      localStorage.setItem(STORE, JSON.stringify(Array.from(new Set([...existing, `library:${book.slug}`]))));
      setSaved(true); setSaveStatus("saveSuccess");
    } catch { setSaveStatus("saveFailure"); }
  };
  return <div className="min-h-screen bg-fog text-ink">
    <header className="border-b border-ink/15 bg-white"><nav aria-label={copy.bookNav} className="mx-auto flex max-w-5xl flex-wrap items-center gap-5 px-5 py-3"><Link href="/library" className="min-h-12 py-3 font-semibold text-teal-text underline">{copy.backLibrary}</Link><Link href="/" className="min-h-12 py-3 font-semibold text-teal-text underline">{copy.home}</Link><AccessibilityMenu/></nav></header>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-8">
      <p className="font-semibold text-teal-text">{copy.original}</p><h1 className="mt-3 text-3xl md:text-4xl">{book.title}</h1><p className="mt-3 text-lg">{book.subtitle}</p><p className="mt-2">{book.audience}</p>
      <p className="mt-4 max-w-3xl">{readerText(locale,"intro",{count:book.chapters.length})}</p>
      <details className="mt-5 rounded-xl border border-ink/20 bg-white p-4"><summary className="min-h-12 cursor-pointer py-3 font-bold">{copy.contents}</summary><ol className="mt-2 list-decimal pl-6">{book.chapters.map((item, index) => <li key={item.title}><button type="button" aria-current={chapter === index ? "step" : undefined} onClick={() => move(index)} className="min-h-12 py-3 text-left font-semibold text-teal-text underline">{item.title}</button></li>)}</ol></details>
      {!opened && <button ref={coverButton} type="button" aria-label={t.openBook} onClick={() => {setOpened(true); requestAnimationFrame(() => title.current?.focus());}} className="library-cover library-cover-0 mx-auto mt-7 block max-w-sm text-left">
        <Image unoptimized src={book.cover} alt={book.coverAlt} width={576} height={384} className="aspect-square w-full object-cover"/><span className="block p-5 text-xl font-bold">{book.title}</span><span className="block px-5 pb-5 font-semibold">{t.openBook} →</span>
      </button>}
      {opened && <article className="book-opening mt-6 rounded-3xl border border-ink/15 bg-white p-5 md:p-9">
        <button type="button" onClick={() => {stop(); setOpened(false); requestAnimationFrame(() => coverButton.current?.focus());}} className="mb-4 min-h-12 rounded-xl border border-teal px-4 py-3 font-semibold text-teal-text">{t.closeBook}</button>
        <p className="font-semibold text-teal-text">{readerText(locale,"chapter",{current:chapter+1,total:book.chapters.length})}</p><h2 ref={title} tabIndex={-1} className="mt-3 text-2xl">{current.title}</h2>
        <div className="mt-5 flex flex-wrap gap-3">{isSupported && <button type="button" onClick={() => isSpeaking ? stop() : speak(readText)} className="min-h-12 rounded-xl border border-teal/40 px-4 py-3 font-semibold text-teal-text">{isSpeaking ? copy.stop : copy.listen}</button>}<button type="button" aria-pressed={large} onClick={() => setLarge(!large)} className="min-h-12 rounded-xl border border-ink/30 px-4 py-3">{large ? copy.standard : copy.larger}</button></div>
        <div className="book-spread mt-6" role="region" aria-label={copy.pages} tabIndex={0} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==="ArrowRight"){event.preventDefault();turnPage(page+1);}if(event.key==="ArrowLeft"){event.preventDefault();turnPage(page-1);}}}>
          <figure className="book-paper book-illustration"><Image unoptimized data-learning-decoration src={art} alt={useBookCover?book.coverAlt:copy.scene} width={768} height={768} className="aspect-square w-full rounded-xl object-cover"/><figcaption className="mt-4 text-center text-sm leading-relaxed">{current.idea}</figcaption><p className="mt-5 text-center text-sm" aria-hidden="true">{page*2+1}</p></figure>
          <section key={page} className="book-paper book-reading-page" aria-label={readerText(locale,"readingPage",{current:page+1})}><p className="text-sm font-semibold text-teal-text">{book.title}</p><h3 className="mt-4 text-xl">{current.title}</h3><div className={`mt-5 space-y-5 leading-loose ${large?"text-2xl":"text-lg"}`}>{spread.paragraphs.map(text=><p key={text}>{text}</p>)}</div><p className="mt-6 text-center text-sm" aria-hidden="true">{page*2+2}</p></section>
        </div>
        <nav aria-label={copy.turnPages} className="mt-6 flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={page===0} onClick={()=>turnPage(page-1)} className="min-h-12 rounded-xl border border-teal px-5 py-3 font-semibold text-teal-text disabled:opacity-50">← {copy.previousPage}</button><p className="text-sm">{readerText(locale,"spread",{current:page+1,total:spreads.length})}</p><button type="button" disabled={page===spreads.length-1} onClick={()=>turnPage(page+1)} className="min-h-12 rounded-xl bg-teal px-5 py-3 font-semibold text-white disabled:opacity-50">{copy.nextPage} →</button></nav>
        <section aria-label={copy.keyIdea} className="mt-6 rounded-xl bg-fog p-4"><h3 className="font-bold">{copy.keyIdea}</h3><p className="mt-2 leading-relaxed">{current.idea}</p></section>
        <section aria-label={copy.chapterQuestion} className="mt-7"><h3 className="text-xl">{copy.pause}</h3><fieldset className="mt-3"><legend className="text-lg">{current.question}</legend><div className="mt-3 grid gap-3">{current.choices.map((option, index) => <button key={option.text} type="button" aria-pressed={selected === index} onClick={() => setAnswers(previous => ({ ...previous, [chapter]: index }))} className={`min-h-12 rounded-xl border-2 p-4 text-left ${selected === index ? "border-teal bg-teal/10" : "border-ink/25"}`}>{option.text}</button>)}</div></fieldset><p role="status" className="mt-4 leading-relaxed">{choice ? `${choice.correct ? copy.correct : copy.retry} ${choice.feedback}` : ""}</p></section>
        <section className="mt-6 rounded-xl border border-teal/30 p-4"><h3 className="font-bold">{copy.tryHeading}</h3><p className="mt-2 leading-relaxed">{current.activity}</p><p className="mt-2 text-sm">{copy.communication}</p></section>
        <nav aria-label={copy.chapterControls} className="mt-7 flex flex-wrap gap-3"><button type="button" disabled={chapter === 0} onClick={() => move(chapter - 1)} className="min-h-12 rounded-xl border border-ink/30 px-5 py-3 disabled:opacity-50">{copy.previousChapter}</button><button type="button" disabled={chapter === book.chapters.length - 1} onClick={() => move(chapter + 1)} className="min-h-12 rounded-xl bg-teal px-5 py-3 font-semibold text-white disabled:opacity-50">{copy.nextChapter}</button></nav>
        {chapter === book.chapters.length - 1 && <section className="mt-8 border-t border-ink/15 pt-6"><h3 className="text-xl">{copy.ending}</h3><p className="mt-2">{copy.endingHint}</p><button type="button" onClick={markFinished} className="mt-4 min-h-12 rounded-xl border border-teal px-5 py-3 font-semibold text-teal-text">{saved ? copy.marked : copy.mark}</button></section>}
        <p role="status" className="mt-3 text-sm">{saveStatus?copy[saveStatus]:""}</p>
      </article>}
      <details className="mt-6 rounded-xl border border-ink/20 bg-white p-5"><summary className="min-h-12 cursor-pointer py-3 font-bold">{copy.words}</summary><dl className="mt-3 space-y-4">{book.glossary.map(item => <div key={item.term}><dt className="font-bold">{item.term}</dt><dd className="mt-1">{item.meaning}</dd></div>)}</dl></details>
      <p className="mt-6 text-sm leading-relaxed">{copy.editorial}</p>
      <Link href="/library" className="mt-5 inline-block min-h-12 py-3 font-semibold text-teal-text underline">{copy.returnShelves}</Link>
    </main>
  </div>;
}
