import Image from "next/image";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { explorerComicTranscripts } from "@/content/explorer-comic-transcripts";
import type { ExplorerComicTopic } from "@/content/explorer-comic-topics";
import { isSupportedLocale } from "@/i18n/config";

export type { ExplorerComicTopic } from "@/content/explorer-comic-topics";
export { hasExplorerComic } from "@/content/explorer-comic-topics";

interface ExplorerComicLessonProps {
  topicId: ExplorerComicTopic;
  uiLocale: string;
}

/**
 * Replaces the usual illustration+prose "book" panel for Explorer with
 * the supplied comic strip itself. The lesson title and instructional
 * guide render before this (see LessonPlayer), so this component is
 * just the comic: its own Listen button, the image, and an sr-only
 * transcript for assistive tech.
 *
 * The Listen button reads a transcript of the comic's own visible
 * text (title, dialogue, narration, key idea, vocabulary — see
 * explorer-comic-transcripts.ts), not the separate lesson-content
 * fields the comic replaced. The transcript is also the sr-only
 * equivalent, so a blind or low-vision child gets exactly what the
 * comic says, in the same panel order, via either path. The image
 * itself is alt="" since that transcript is its complete equivalent.
 */
export function ExplorerComicLesson({ topicId, uiLocale }: ExplorerComicLessonProps) {
  const locale = isSupportedLocale(uiLocale) ? uiLocale : "en";
  // Only English comic images exist today — see explorer-comic-transcripts.ts.
  const transcript = explorerComicTranscripts[topicId].en;
  return (
    <div data-explorer-comic-lesson={topicId} className="flex flex-col gap-2xs">
      <ReadAloudButton text={transcript} uiLocale={locale} />
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
      <p className="sr-only">{transcript}</p>
    </div>
  );
}
