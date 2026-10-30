"use client";
import {REGIONAL_LOCALES} from "@/i18n/config";

import Image from "next/image";
import {experienceCopy} from "@/content/experience-copy";
import {libraryShelfCopy,shelfText} from "@/content/library-shelf-copy";
import {readerCopy,librarySourceDate} from "@/content/reader-copy";
import type {ShelfPresentation} from "@/lib/i18n/library-presentation";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

export function LibraryShelves({presentation}:{presentation:ShelfPresentation}) {
  const {locale,books,people,published}=presentation;
  const t=experienceCopy[locale],copy=libraryShelfCopy[locale];
  const [topic, setTopic] = useState("All topics");
  const topics = Array.from(new Set(published.flatMap(book => book.topics))).sort((a,b)=>a.localeCompare(b,REGIONAL_LOCALES[locale]));
  const shown = published.filter(book => topic === "All topics" || book.topics.includes(topic));
  return <>
    <nav aria-label={copy.nav} className="mt-6 flex flex-wrap gap-3">
      {[["#money-quest-books",copy.books],["#author-books",copy.authors],["#people-and-ideas",copy.people],["#short-reads",copy.shortReads]].map(([href, text]) => <a key={href} href={href} className="min-h-12 rounded-xl border border-teal/30 bg-white px-4 py-3 font-semibold text-teal-text underline">{text}</a>)}
    </nav>
    <section id="money-quest-books" aria-labelledby="original-shelf-title" className="mt-8 scroll-mt-8">
      <h2 id="original-shelf-title" className="text-2xl">{copy.originalHeading}</h2>
      <p className="mt-2">{shelfText(locale,"originalIntro",{count:books.length})}</p>
      <div className="library-shelves mt-5">{books.map((book, index) => <article key={book.slug} className="library-shelf-slot">
        <Link href={`/library/${book.slug}`} aria-label={book.title} className={`library-cover library-cover-${index % 4}`}>
          <Image unoptimized src={book.cover} alt="" width={576} height={384} className="aspect-square w-full object-cover"/>
          <h3 className="p-4 text-lg font-bold leading-snug">{book.title}</h3>
        </Link>
        <div className="library-shelf-board" aria-hidden="true"/>
        <details className="mt-3 rounded-xl bg-white p-3"><summary className="min-h-12 cursor-pointer py-3 font-semibold text-teal-text">{t.about}</summary><p className="text-sm">{copy.originalBrand} · {shelfText(locale,"chapterCount",{count:book.chapters.length})}</p><p className="mt-2 text-sm">{book.audience}</p><p className="mt-2">{book.description}</p></details>
      </article>)}</div>
    </section>
    <section id="people-and-ideas" aria-labelledby="people-shelf-title" className="mt-10 scroll-mt-8">
      <h2 id="people-shelf-title" className="text-2xl">{shelfText(locale,"peopleHeading",{count:people.length})}</h2>
      <p className="mt-2">{copy.peopleIntro}</p>
      <div className="mt-5 grid gap-5 md:grid-cols-3">{people.map(person => <article key={person.slug} className="overflow-hidden rounded-2xl border border-ink/20 bg-white"><Image unoptimized data-learning-decoration src={person.image} alt="" width={384} height={384} className="aspect-square w-full object-cover"/><div className="p-5"><h3 className="text-xl"><Link href={`/library/${person.slug}`} className="inline-block min-h-12 py-2 font-semibold text-teal-text underline">{person.name}</Link></h3><p className="mt-2">{person.topic}</p><p className="mt-2 text-sm">{person.ages}</p></div></article>)}</div>
    </section>
    <section id="author-books" aria-labelledby="author-shelf-title" className="mt-10 scroll-mt-8 rounded-3xl border border-ink/15 bg-white p-5 md:p-8">
      <h2 id="author-shelf-title" className="text-2xl">{copy.authorHeading}</h2>
      <p className="mt-3 max-w-3xl">{copy.authorIntro}</p>
      <p className="mt-2 max-w-3xl">{copy.guidance}</p>
      <label htmlFor="author-topic" className="mt-5 block font-semibold">{copy.topic}</label>
      <select id="author-topic" value={topic} onChange={event => setTopic(event.target.value)} className="mt-2 min-h-12 max-w-full rounded-xl border border-ink/30 bg-white p-3"><option value="All topics">{copy.allTopics}</option>{topics.map(value => <option key={value}>{value}</option>)}</select>
      <p role="status" className="mt-3 text-sm">{shelfText(locale,shown.length===1?"shownOne":"shownMany",{count:shown.length})}</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">{shown.map(book => <article key={book.id} className="rounded-2xl border border-ink/20 p-5">
        <p className="text-sm font-bold text-teal-text">{book.topics.join(" · ")}</p><h3 className="mt-2 text-xl">{book.title}</h3><p className="mt-2">{shelfText(locale,"by",{name:book.authors})}{book.illustrator ? `. ${shelfText(locale,"illustrated",{name:book.illustrator})}` : "."}</p><p className="mt-1 text-sm">{book.publisher} · {book.age}</p><p className="mt-3">{book.description}</p>
        <h4 className="mt-4 font-bold">{copy.ideas}</h4><ul className="mt-2 list-disc space-y-2 pl-5">{book.ideas.map(idea => <li key={idea}>{idea}</li>)}</ul>
        <p className="mt-4 rounded-xl bg-fog p-3"><span className="font-semibold">{copy.discuss} </span>{book.discussion}</p>
        <details className="mt-4"><summary className="min-h-12 cursor-pointer py-3 font-semibold text-teal-text">{copy.find}</summary><p className="mt-2 text-sm">{copy.leave}</p><a href={book.url} rel="noreferrer" className="mt-2 inline-block min-h-12 py-3 font-semibold text-teal-text underline">{book.access}: {book.title} ({readerCopy[locale].external})</a><p className="text-sm">{shelfText(locale,"listing",{date:librarySourceDate(locale,book.checked)})}</p></details>
      </article>)}</div>
    </section>
  </>;
}
