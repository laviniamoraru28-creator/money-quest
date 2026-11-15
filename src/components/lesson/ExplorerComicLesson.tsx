import Image from "next/image";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import type { ExplorerComicTopic } from "@/content/explorer-comic-topics";

export type { ExplorerComicTopic } from "@/content/explorer-comic-topics";
export { hasExplorerComic } from "@/content/explorer-comic-topics";

interface ExplorerComicLessonProps {
  topicId: ExplorerComicTopic;
  title: string;
  shortIntroduction: string;
  keyConcept: string;
  explanation: string;
  story: string;
  vocabulary: { term: string; definition: string }[];
  uiLocale: string;
  headingRef: React.RefObject<HTMLHeadingElement>;
}

/**
 * Replaces the usual illustration+prose "book" panel for Explorer with
 * the supplied comic strip itself. The comic is the lesson now — the
 * text it replaces isn't shown alongside it — but every child's
 * learning page still needs the same content available to assistive
 * tech, so the same strings that used to be visible prose are kept as
 * an sr-only block (zero visual footprint) rather than dropped. The
 * image itself is alt="" since that block is its full equivalent.
 */
export function ExplorerComicLesson({
  topicId, title, shortIntroduction, keyConcept, explanation, story, vocabulary, uiLocale, headingRef,
}: ExplorerComicLessonProps) {
  // Same three fields the pre-comic "book" panel's own Listen button
  // read aloud (shortIntroduction + explanation + story) — unchanged
  // scope, just no longer tied to visible prose.
  const readAloudText = [shortIntroduction, explanation, story].filter(Boolean).join(" ");
  return (
    <div data-explorer-comic-lesson={topicId} className="flex flex-col gap-2xs">
      <h1 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold">{title}</h1>
      <ReadAloudButton text={readAloudText} uiLocale={uiLocale} />
      <div className="mt-2xs overflow-hidden rounded-xl shadow-floating">
        <Image
          unoptimized
          src={`/images/money-quest/lessons/comics/${topicId}.webp`}
          alt=""
          width={864}
          height={1536}
          sizes="(min-width: 768px) 560px, 100vw"
          className="h-auto w-full max-w-full object-contain"
        />
      </div>
      <div className="sr-only">
        <p>{shortIntroduction}</p>
        {keyConcept && <p>{keyConcept}</p>}
        <p>{explanation}</p>
        <p>{story}</p>
        {vocabulary.length > 0 && (
          <dl>
            {vocabulary.map((v) => (
              <div key={v.term}>
                <dt>{v.term}</dt>
                <dd>{v.definition}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
