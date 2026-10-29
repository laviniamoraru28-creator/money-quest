"use client";

import Image from "next/image";
import {useLocale} from "next-intl";
import {experienceCopy} from "@/content/experience-copy";
import {isSupportedLocale} from "@/i18n/config";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { originalBooks } from "@/content/library";
import {libraryPeople} from "@/content/people";
import { authorBooks } from "@/content/author-books";

export function LibraryShelves() {
  const locale=useLocale();
  const t=experienceCopy[isSupportedLocale(locale)?locale:"en"];
  const [topic, setTopic] = useState("All topics");
  const topics = Array.from(new Set(authorBooks.flatMap(book => book.topics))).sort();
  const shown = authorBooks.filter(book => topic === "All topics" || book.topics.includes(topic));
  return <>
    <nav aria-label="Library shelves" className="mt-6 flex flex-wrap gap-3">
      {[["#money-quest-books", "Money Quest books"], ["#author-books", "Books by other authors"], ["#people-and-ideas", "People and ideas"], ["#short-reads", "Short reads"]].map(([href, text]) => <a key={href} href={href} className="min-h-12 rounded-xl border border-teal/30 bg-white px-4 py-3 font-semibold text-teal-text underline">{text}</a>)}
    </nav>
    <section id="money-quest-books" aria-labelledby="original-shelf-title" className="mt-8 scroll-mt-8">
      <h2 id="original-shelf-title" className="text-2xl">Money Quest original books</h2>
      <p className="mt-2">Read all 10 full stories here for free. Choose any chapter, listen if you wish, and explore the activities at your own pace.</p>
      <div className="library-shelves mt-5">{originalBooks.map((book, index) => <article key={book.slug} className="library-shelf-slot">
        <Link href={`/library/${book.slug}`} aria-label={book.title} className={`library-cover library-cover-${index % 4}`}>
          <Image unoptimized src={book.cover} alt="" width={576} height={384} className="aspect-square w-full object-cover"/>
          <h3 className="p-4 text-lg font-bold leading-snug">{book.title}</h3>
        </Link>
        <details className="mt-3 rounded-xl bg-white p-3"><summary className="min-h-12 cursor-pointer py-3 font-semibold text-teal-text">{t.about}</summary><p className="text-sm">Money Quest original · {book.chapters.length} chapters</p><p className="mt-2 text-sm">{book.audience}</p><p className="mt-2">{book.description}</p></details>
      </article>)}</div>
    </section>
    <section id="people-and-ideas" aria-labelledby="people-shelf-title" className="mt-10 scroll-mt-8">
      <h2 id="people-shelf-title" className="text-2xl">People and ideas: 10 mini-biographies</h2>
      <p className="mt-2">Meet real people through short factual introductions, cartoon portraits and thematic illustrations. Explore their work, the people around them and questions worth asking.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-3">{libraryPeople.map(person => <article key={person.slug} className="overflow-hidden rounded-2xl border border-ink/20 bg-white"><Image unoptimized data-learning-decoration src={person.image} alt="" width={384} height={384} className="aspect-square w-full object-cover"/><div className="p-5"><h3 className="text-xl"><Link href={`/library/${person.slug}`} className="inline-block min-h-12 py-2 font-semibold text-teal-text underline">{person.name}</Link></h3><p className="mt-2">{person.topic}</p><p className="mt-2 text-sm">{person.ages}</p></div></article>)}</div>
    </section>
    <section id="author-books" aria-labelledby="author-shelf-title" className="mt-10 scroll-mt-8 rounded-3xl border border-ink/15 bg-white p-5 md:p-8">
      <h2 id="author-shelf-title" className="text-2xl">Explore books by other authors</h2>
      <p className="mt-3 max-w-3xl">Discover published books with a grown-up. These are short Money Quest introductions based on publisher or author descriptions, not full books or reviews of every page.</p>
      <p className="mt-2 max-w-3xl">Age guidance is a starting point. Choose for your interests and reading support. You can ask your local library about borrowing; availability depends on its collection. Buying is optional.</p>
      <label htmlFor="author-topic" className="mt-5 block font-semibold">Choose a topic</label>
      <select id="author-topic" value={topic} onChange={event => setTopic(event.target.value)} className="mt-2 min-h-12 max-w-full rounded-xl border border-ink/30 bg-white p-3"><option>All topics</option>{topics.map(value => <option key={value}>{value}</option>)}</select>
      <p role="status" className="mt-3 text-sm">{shown.length} {shown.length === 1 ? "book" : "books"} shown</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">{shown.map(book => <article key={book.id} className="rounded-2xl border border-ink/20 p-5">
        <p className="text-sm font-bold text-teal-text">{book.topics.join(" · ")}</p><h3 className="mt-2 text-xl">{book.title}</h3><p className="mt-2">By {book.authors}{book.illustrator ? `. Illustrated by ${book.illustrator}.` : "."}</p><p className="mt-1 text-sm">{book.publisher} · {book.age}</p><p className="mt-3">{book.description}</p>
        <h4 className="mt-4 font-bold">Ideas to explore</h4><ul className="mt-2 list-disc space-y-2 pl-5">{book.ideas.map(idea => <li key={idea}>{idea}</li>)}</ul>
        <p className="mt-4 rounded-xl bg-fog p-3"><span className="font-semibold">Talk, draw or think: </span>{book.discussion}</p>
        <details className="mt-4"><summary className="min-h-12 cursor-pointer py-3 font-semibold text-teal-text">For grown-ups: where to find this book</summary><p className="mt-2 text-sm">This link leaves Money Quest. The external site has its own privacy and shopping terms. Some editions or sellers may be outside the UK. Check the edition and delivery options.</p><a href={book.url} rel="noreferrer" className="mt-2 inline-block min-h-12 py-3 font-semibold text-teal-text underline">{book.access}: {book.title} (external site)</a><p className="text-sm">Listing checked {book.checked}. No affiliate links. The complete book is not hosted on Money Quest.</p></details>
      </article>)}</div>
    </section>
  </>;
}
