"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getLessonStructureById } from "@/content/catalog";
import { getWorksheetFilename } from "@/content/worksheets";

/**
 * A thin, static page: just enough context (which lesson this
 * worksheet belongs to) plus a link straight to the PDF in
 * public/worksheets/. The PDF itself is the deliverable — opening it
 * in a new tab gives the browser's own native PDF viewer, which
 * already has Print and Save-as-PDF built in on every desktop and
 * mobile browser, so there's no need for an embedded viewer, a print
 * library, or any JS beyond a plain link. Worksheets are English-only
 * by design (see public/worksheets/README.txt) — only this
 * surrounding page chrome (title, buttons, hint text) is translated.
 */
export default function WorksheetPage() {
  const params = useParams<{ worldId: string; activityId: string }>();
  const t = useTranslations();

  const structure = getLessonStructureById(params.activityId);
  const filename = getWorksheetFilename(params.activityId);

  if (!structure || !filename) {
    return (
      <div className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("play.lessonNotAvailable")}</p>
          <Link href={`/play/world/${params.worldId}`} className="mt-sm inline-block text-teal hover:underline">
            {t("play.backToTheWorld")}
          </Link>
        </div>
      </div>
    );
  }

  const lessonTitle = t(`curriculum.${structure.id}.title`);

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[600px]">
        <div className="flex flex-wrap gap-2xs">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
          >
            <span aria-hidden="true">🏠</span> {t("nav.home")}
          </Link>
          <Link
            href={`/play/world/${params.worldId}/lesson/${params.activityId}`}
            className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
          >
            <span aria-hidden="true">←</span> {t("worksheet.backToLesson")}
          </Link>
        </div>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("worksheet.pageTitle")}</h1>
        <p className="mt-2xs text-base text-ink/70">{lessonTitle}</p>
        <p className="mt-2xs text-sm text-ink/50">{t("worksheet.englishOnlyNote")}</p>

        <a
          href={`/worksheets/${filename}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-md inline-flex min-h-touch-min-child w-full items-center justify-center gap-2xs rounded-lg bg-teal px-md py-xs text-center font-medium text-white shadow-resting hover:bg-teal/90"
        >
          {t("worksheet.openButton")}
        </a>
        <p className="mt-2xs text-sm text-ink/60">{t("worksheet.printHint")}</p>

        <a
          href="/worksheets/answer-key/money-quest-worksheets-answer-key.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-md inline-block text-sm text-teal hover:underline"
        >
          {t("worksheet.answerKeyLink")}
        </a>
      </main>
    </div>
  );
}
