"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { OriginalBook } from "@/content/original-books";
import { Link } from "@/i18n/navigation";
import { AccessibilityMenu } from "@/components/ui/AccessibilityMenu";
import { useReadAloud } from "@/lib/accessibility/use-read-aloud";

const STORE = "money-quest-discovery-v1";
export default function OriginalBookReader({ book }: { book: OriginalBook }) {
  const [page, setPage] = useState(0);
  const perPage=book.audience.startsWith("Explorer")?1:2;
  const spreads = book.chapters.flatMap((item, chapterIndex) => Array.from({length:Math.ceil(item.paragraphs.length/perPage)}, (_, part) => ({chapterIndex,paragraphs:item.paragraphs.slice(part*perPage,part*perPage+perPage)})));
  const spread = spreads[page]!;
  const chapter = spread.chapterIndex;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [large, setLarge] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const title = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(0);
  const { isSupported, isSpeaking, speak, stop } = useReadAloud("en-GB");
  // Bundled books are validated as non-empty; navigation keeps this index in bounds.
  const current = book.chapters[chapter]!;
  const selected = answers[chapter];
  const choice = selected === undefined ? undefined : current.choices[selected];
  const readText = `${current.title}. ${spread.paragraphs.join("\n\n")} Key idea. ${current.idea}. Try it. ${current.activity}`;
  useEffect(() => {
    if (previousPage.current !== page) { title.current?.focus(); previousPage.current = page; }
  }, [page]);
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORE) || "[]");
      setSaved(Array.isArray(value) && value.includes(`library:${book.slug}`));
    } catch { setSaveMessage("Saving is unavailable. You can still read every chapter and try every activity."); }
  }, [book.slug]);
  const move = (index: number) => { if (index < 0 || index >= book.chapters.length) return; stop(); setPage(spreads.findIndex(item=>item.chapterIndex===index)); };
  const turnPage = (index:number) => { if(index<0||index>=spreads.length)return;stop();setPage(index); };
  const useBookCover = chapter === 0 || !["the-little-compass-and-the-money-choices", "the-garden-everyone-could-enter", "the-market-town-notebook"].includes(book.slug);
  const art = useBookCover ? book.cover : `/images/money-quest/worlds/${book.slug==="the-little-compass-and-the-money-choices"?["coin-cove","sky-exchange","market-town","market-town","golden-vault","guardian-gate","kindness-grove","coin-cove"][chapter]:book.slug==="the-garden-everyone-could-enter"?"kindness-grove":book.slug==="the-market-town-notebook"?"market-town":""}.webp`;
  const markFinished = () => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORE) || "[]");
      const existing = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
      localStorage.setItem(STORE, JSON.stringify(Array.from(new Set([...existing, `library:${book.slug}`]))));
      setSaved(true); setSaveMessage("Book marked as read on this device. You can read it again whenever you like.");
    } catch { setSaveMessage("Your browser could not save this. You can keep reading for this visit."); }
  };
  return <div className="min-h-screen bg-fog text-ink">
    <header className="border-b border-ink/15 bg-white"><nav aria-label="Book navigation" className="mx-auto flex max-w-5xl flex-wrap items-center gap-5 px-5 py-3"><Link href="/library" className="min-h-12 py-3 font-semibold text-teal-text underline">Back to Library</Link><Link href="/" className="min-h-12 py-3 font-semibold text-teal-text underline">Money Quest home</Link><AccessibilityMenu/></nav></header>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-8">
      <p className="font-semibold text-teal-text">Money Quest original book</p><h1 className="mt-3 text-3xl md:text-4xl">{book.title}</h1><p className="mt-3 text-lg">{book.subtitle}</p><p className="mt-2">{book.audience}</p>
      <p className="mt-4 max-w-3xl">This original fictional story has {book.chapters.length} chapters. Stop whenever you wish. Questions are optional; you can revisit any chapter without answering.</p>
      <details className="mt-5 rounded-xl border border-ink/20 bg-white p-4"><summary className="min-h-12 cursor-pointer py-3 font-bold">Contents: choose any chapter</summary><ol className="mt-2 list-decimal pl-6">{book.chapters.map((item, index) => <li key={item.title}><button type="button" aria-current={chapter === index ? "step" : undefined} onClick={() => move(index)} className="min-h-12 py-3 text-left font-semibold text-teal-text underline">{item.title}</button></li>)}</ol></details>
      <article className="mt-6 rounded-3xl border border-ink/15 bg-white p-5 md:p-9">
        <p className="font-semibold text-teal-text">Chapter {chapter + 1} of {book.chapters.length}</p><h2 ref={title} tabIndex={-1} className="mt-3 text-2xl">{current.title}</h2>
        <div className="mt-5 flex flex-wrap gap-3">{isSupported && <button type="button" onClick={() => isSpeaking ? stop() : speak(readText)} className="min-h-12 rounded-xl border border-teal/40 px-4 py-3 font-semibold text-teal-text">{isSpeaking ? "Stop" : "Listen"}</button>}<button type="button" aria-pressed={large} onClick={() => setLarge(!large)} className="min-h-12 rounded-xl border border-ink/30 px-4 py-3">{large ? "Standard text" : "Larger text"}</button></div>
        <div className="book-spread mt-6" role="region" aria-label="Illustrated book pages" tabIndex={0} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==="ArrowRight"){event.preventDefault();turnPage(page+1);}if(event.key==="ArrowLeft"){event.preventDefault();turnPage(page-1);}}}>
          <figure className="book-paper book-illustration"><Image unoptimized data-learning-decoration src={art} alt={chapter===0?book.coverAlt:"The Money Quest guide and puppy in a colourful learning world, illustrating this chapter’s setting."} width={768} height={768} className="aspect-square w-full rounded-xl object-cover"/><figcaption className="mt-4 text-center text-sm leading-relaxed">{current.idea}</figcaption><p className="mt-5 text-center text-sm" aria-hidden="true">{page*2+1}</p></figure>
          <section key={page} className="book-paper book-reading-page" aria-label={`Reading page ${page+1}`}><p className="text-sm font-semibold text-teal-text">{book.title}</p><h3 className="mt-4 text-xl">{current.title}</h3><div className={`mt-5 space-y-5 leading-loose ${large?"text-2xl":"text-lg"}`}>{spread.paragraphs.map(text=><p key={text}>{text}</p>)}</div><p className="mt-6 text-center text-sm" aria-hidden="true">{page*2+2}</p></section>
        </div>
        <nav aria-label="Turn book pages" className="mt-6 flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={page===0} onClick={()=>turnPage(page-1)} className="min-h-12 rounded-xl border border-teal px-5 py-3 font-semibold text-teal-text disabled:opacity-50">← Previous page</button><p className="text-sm">Spread {page+1} of {spreads.length}</p><button type="button" disabled={page===spreads.length-1} onClick={()=>turnPage(page+1)} className="min-h-12 rounded-xl bg-teal px-5 py-3 font-semibold text-white disabled:opacity-50">Next page →</button></nav>
        <section aria-label="Key idea" className="mt-6 rounded-xl bg-fog p-4"><h3 className="font-bold">Key idea</h3><p className="mt-2 leading-relaxed">{current.idea}</p></section>
        <section aria-label="Chapter question" className="mt-7"><h3 className="text-xl">Pause and think</h3><fieldset className="mt-3"><legend className="text-lg">{current.question}</legend><div className="mt-3 grid gap-3">{current.choices.map((option, index) => <button key={option.text} type="button" aria-pressed={selected === index} onClick={() => setAnswers(previous => ({ ...previous, [chapter]: index }))} className={`min-h-12 rounded-xl border-2 p-4 text-left ${selected === index ? "border-teal bg-teal/10" : "border-ink/25"}`}>{option.text}</button>)}</div></fieldset><p role="status" className="mt-4 leading-relaxed">{choice ? `${choice.correct ? "That fits." : "Let’s think it through."} ${choice.feedback}` : ""}</p></section>
        <section className="mt-6 rounded-xl border border-teal/30 p-4"><h3 className="font-bold">Try it your way</h3><p className="mt-2 leading-relaxed">{current.activity}</p><p className="mt-2 text-sm">Point, draw, type, use your communication tool or talk. You do not need to upload anything.</p></section>
        <nav aria-label="Chapter controls" className="mt-7 flex flex-wrap gap-3"><button type="button" disabled={chapter === 0} onClick={() => move(chapter - 1)} className="min-h-12 rounded-xl border border-ink/30 px-5 py-3 disabled:opacity-50">Previous chapter</button><button type="button" disabled={chapter === book.chapters.length - 1} onClick={() => move(chapter + 1)} className="min-h-12 rounded-xl bg-teal px-5 py-3 font-semibold text-white disabled:opacity-50">Next chapter</button></nav>
        {chapter === book.chapters.length - 1 && <section className="mt-8 border-t border-ink/15 pt-6"><h3 className="text-xl">Your ending</h3><p className="mt-2">Think about one idea you would keep or question. There is no score to beat.</p><button type="button" onClick={markFinished} className="mt-4 min-h-12 rounded-xl border border-teal px-5 py-3 font-semibold text-teal-text">{saved ? "Marked as read on this device" : "Mark book as read"}</button></section>}
        <p role="status" className="mt-3 text-sm">{saveMessage}</p>
      </article>
      <details className="mt-6 rounded-xl border border-ink/20 bg-white p-5"><summary className="min-h-12 cursor-pointer py-3 font-bold">Words to explore</summary><dl className="mt-3 space-y-4">{book.glossary.map(item => <div key={item.term}><dt className="font-bold">{item.term}</dt><dd className="mt-1">{item.meaning}</dd></div>)}</dl></details>
      <p className="mt-6 text-sm leading-relaxed">An original Money Quest story, created with AI assistance and awaiting the project owner’s editorial review. Fictional examples support discussion; they do not assess a child’s ability. No account is required. Only the optional read-completion marker is saved on this device; chapter answers are not stored.</p>
      <Link href="/library" className="mt-5 inline-block min-h-12 py-3 font-semibold text-teal-text underline">Return to all Library shelves</Link>
    </main>
  </div>;
}
