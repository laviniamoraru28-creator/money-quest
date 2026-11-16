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
 * explorer-comic-transcripts.ts), in the selected locale, not the
 * separate lesson-content fields the comic replaced and never the
 * English transcript when another language is selected. The
 * transcript is also the sr-only equivalent, so a blind or low-vision
 * child gets exactly what the comic says, in the same panel order and
 * the same language, via either path. The image itself is alt=""
 * since that transcript is its complete equivalent.
 *
 * English keeps its original image at its original flat path
 * (comics/<topic>.webp) — that asset is never touched. The other 8
 * locales' supplied images live one level deeper, at
 * comics/<locale>/<topic>.webp, converted from the source archive to
 * webp at their native 1072x1920 (not resized to the English image's
 * 864x1536 — object-contain below means a slightly different aspect
 * ratio never crops either one, so there's no reason to force a
 * resize and risk softening the art).
 */
export function ExplorerComicLesson({ topicId, uiLocale }: ExplorerComicLessonProps) {
  const locale = isSupportedLocale(uiLocale) ? uiLocale : "en";
  const transcript = explorerComicTranscripts[topicId][locale];
  const src = locale === "en"
    ? `/images/money-quest/lessons/comics/${topicId}.webp`
    : `/images/money-quest/lessons/comics/${locale}/${topicId}.webp`;
  const [width, height] = locale === "en" ? [864, 1536] : [1072, 1920];
  return (
    <div data-explorer-comic-lesson={topicId} className="flex flex-col gap-2xs">
      <ReadAloudButton text={transcript} uiLocale={locale} />
      <div className="mt-2xs overflow-hidden rounded-xl shadow-floating">
        <Image
          unoptimized
          src={src}
          alt=""
          width={width}
          height={height}
          sizes="(min-width: 768px) 560px, 100vw"
          className="h-auto w-full max-w-full object-contain"
        />
      </div>
      <p className="sr-only">{transcript}</p>
    </div>
  );
}
