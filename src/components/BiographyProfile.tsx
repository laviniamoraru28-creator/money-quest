import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { LibraryPerson } from "@/content/people";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { AccessibilityMenu } from "@/components/ui/AccessibilityMenu";

export default function BiographyProfile({ person }: { person: LibraryPerson }) {
  return <div className="min-h-screen bg-fog text-ink"><header className="border-b border-ink/15 bg-white"><nav aria-label="Biography navigation" className="mx-auto flex max-w-4xl flex-wrap items-center gap-5 px-5 py-3"><Link href="/library" className="min-h-12 py-3 font-semibold text-teal-text underline">Back to Library</Link><Link href="/museum" className="min-h-12 py-3 font-semibold text-teal-text underline">Visit the Museum</Link><AccessibilityMenu/></nav></header>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-5 py-8"><article className="rounded-3xl border border-ink/15 bg-white p-5 md:p-9">
      <p className="font-semibold text-teal-text">People, ideas and questions · Money Quest mini-biography</p><h1 className="mt-3 text-3xl">{person.title}</h1><p className="mt-3">{person.topic}</p><p className="mt-2 text-sm">{person.ages}</p>
      <Image unoptimized data-learning-decoration src={person.image} alt={person.alt} width={768} height={768} className="mx-auto mt-6 aspect-square w-full max-w-md rounded-3xl object-contain"/>
      <p className="mt-2 text-sm">{person.illustrationNote ?? "Original AI-generated cartoon illustration. An imagined scene, not a photograph or historical evidence."}</p>
      <aside aria-label="A playful introduction" className="mt-5 rounded-xl bg-fog p-4"><p>{person.playful}</p></aside>
      <div className="mt-5"><ReadAloudButton text={`${person.title}. ${person.sections.map(section => `${section.heading}. ${section.text}`).join(" ")}`} uiLocale="en-GB"/></div>
      {person.sections.map(section => <section key={section.heading} className="mt-6 max-w-[65ch]"><h2 className="text-2xl">{section.heading}</h2><p className="mt-3 text-lg leading-loose">{section.text}</p></section>)}
      <section className="mt-7 rounded-xl border border-teal/30 p-4"><h2 className="text-xl">Ideas to keep questioning</h2><ul className="mt-3 list-disc space-y-2 pl-5">{person.takeaways.map(idea => <li key={idea}>{idea}</li>)}</ul><p className="mt-3">You can draw, point, type, use your communication tool or speak. No answer needs to be uploaded.</p></section>
      <details className="mt-6 rounded-xl border border-ink/20 p-4"><summary className="min-h-12 cursor-pointer py-3 font-semibold">Factual source and notes for grown-ups</summary><p className="mt-2">Biographical facts are based on the source below. The jokes, cartoon scene and discussion activity are Money Quest additions. This is a short introduction, not a complete account of the person’s life or an endorsement.</p><a href={person.source} rel="noreferrer" className="mt-2 inline-block min-h-12 py-3 text-teal-text underline">{person.sourceTitle} (external site)</a><p className="text-sm">Source checked {person.checked}.</p></details>
    </article></main></div>;
}
